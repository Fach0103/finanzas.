import { financeDB } from './db.js';
import { inicializarNavegacion } from './js/sidebar.js';
import { inicializarCategorias } from './js/categorias.js';
import { inicializarDashboard } from './js/dashboard.js';
import { inicializarGraficosDashboard } from './js/charts.js';
import { TransaccionesManager } from './js/transaccion.js';
import {
  definirPresupuesto,
  compararPresupuesto,
  proyectarEgresosMensuales,
  obtenerPresupuesto,
  definirIngresoEstimado,
  compararIngresos,
  proyectarIngresosMensuales,
  inicializarPresupuesto,
  calcularDesviaciones,
  obtenerBalanceMensual
} from './js/presupuesto.js';
import { sincronizarSistema } from './js/utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await financeDB.init();
  inicializarNavegacion();
  inicializarCategorias();
  inicializarDashboard();
  await inicializarPresupuesto();

  const manager = new TransaccionesManager('#lista-transacciones');
  let modoEdicionId = null;

  const lista = await financeDB.obtenerTodasTransacciones();
  manager.cargarDesdeLista(lista);

  const presupuestos = obtenerPresupuesto();
  inicializarGraficosDashboard([], lista, presupuestos);

  // 📝 Transacciones
  const form = document.querySelector('#form-transaccion');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      id: modoEdicionId || crypto.randomUUID(),
      tipo: e.target.tipo.value,
      amount: parseFloat(e.target.monto.value),
      fecha: e.target.fecha.value,
      categoryId: parseInt(e.target.categoria.value),
      descripcion: e.target.descripcion.value.trim()
    };
    await financeDB.guardarTransaccion(data);
    form.reset();
    modoEdicionId = null;
    await sincronizarSistema(manager);
    inicializarGraficosDashboard([], await financeDB.obtenerTodasTransacciones(), obtenerPresupuesto());
  });

  // 🛠️ Edición/Eliminación
  document.querySelector('#lista-transacciones')?.addEventListener('click', async e => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('btn-editar')) {
      const lista = await financeDB.obtenerTodasTransacciones();
      const transaccion = lista.find(t => t.id === id);
      if (transaccion) {
        modoEdicionId = transaccion.id;
        Object.entries(transaccion).forEach(([key, value]) => {
          const input = document.querySelector(`[name="${key}"]`);
          if (input) input.value = value;
        });
      }
    }
    if (e.target.classList.contains('btn-eliminar')) {
      await financeDB.eliminarTransaccion(id);
      await sincronizarSistema(manager);
      inicializarGraficosDashboard([], await financeDB.obtenerTodasTransacciones(), obtenerPresupuesto());
    }
  });

  // 🔶 Presupuesto de Egresos
  document.querySelector('#btnGuardarPresupuesto')?.addEventListener('click', async () => {
    const categoria = parseInt(document.querySelector('#budgetCategorySelect').value);
    const monto = parseFloat(document.querySelector('#inputMonto').value);
    const mes = parseInt(document.querySelector('#inputMes').value);
    const anio = parseInt(document.querySelector('#inputAnio').value);

    await definirPresupuesto(anio, mes, categoria, monto);
    document.querySelector('#resultado-presupuesto').innerText = '✅ Presupuesto de egreso guardado.';
    await sincronizarSistema(manager);
    inicializarGraficosDashboard([], await financeDB.obtenerTodasTransacciones(), obtenerPresupuesto());
  });

  document.querySelector('#btnComparar')?.addEventListener('click', () => {
    const mes = parseInt(document.querySelector('#inputMes').value);
    const anio = parseInt(document.querySelector('#inputAnio').value);
    const diferencias = compararPresupuesto(anio, mes);

    const mensaje = Object.entries(diferencias).map(([cat, dif]) =>
      `📌 ${cat}: diferencia de ${dif.toFixed(2)}`
    ).join('\n');

    document.querySelector('#resultado-presupuesto').innerText = mensaje || '⚠️ No hay egresos comparables.';
  });

  document.querySelector('#btnProyeccion')?.addEventListener('click', () => {
    const mes = parseInt(document.querySelector('#inputMes').value);
    const proyeccion = proyectarEgresosMensuales(mes);
    document.querySelector('#resultado-presupuesto').innerText =
      `📈 Proyección mensual de egresos: ${proyeccion}`;
  });

  // 🔷 Presupuesto de Ingresos
  document.querySelector('#btnGuardarIngreso')?.addEventListener('click', async () => {
    const monto = parseFloat(document.querySelector('#inputIngresoMonto').value);
    const mes = parseInt(document.querySelector('#inputIngresoMes').value);
    const anio = parseInt(document.querySelector('#inputIngresoAnio').value);

    await definirIngresoEstimado(anio, mes, monto);
    document.querySelector('#resultado-ingresos').innerText = '✅ Ingreso estimado guardado.';
    await sincronizarSistema(manager);
    inicializarGraficosDashboard([], await financeDB.obtenerTodasTransacciones(), obtenerPresupuesto());
  });

  document.querySelector('#btnCompararIngreso')?.addEventListener('click', () => {
    const mes = parseInt(document.querySelector('#inputIngresoMes').value);
    const anio = parseInt(document.querySelector('#inputIngresoAnio').value);
    const { estimado, real, diferencia } = compararIngresos(anio, mes);

    document.querySelector('#resultado-ingresos').innerText =
      `📊 Estimado: ${estimado} | Real: ${real} | Diferencia: ${diferencia.toFixed(2)}`;
  });

  document.querySelector('#btnProyeccionIngreso')?.addEventListener('click', () => {
    const mes = parseInt(document.querySelector('#inputIngresoMes').value);
    const proyeccion = proyectarIngresosMensuales(mes);
    document.querySelector('#resultado-ingresos').innerText =
      `📈 Proyección mensual de ingresos: ${proyeccion}`;
  });

  // 🚨 Análisis de Desviaciones
  document.querySelector('#btnDesviaciones')?.addEventListener('click', () => {
    const mes = parseInt(document.querySelector('#inputMes').value);
    const anio = parseInt(document.querySelector('#inputAnio').value);
    const resultado = calcularDesviaciones(anio, mes);

    let mensaje = `📊 Desviaciones en el presupuesto ${mes}/${anio}:\n\n`;
    for (const categoria in resultado) {
      const { estimado, real, desviacion, alerta } = resultado[categoria];
      mensaje += `
🔹 ${categoria}
   Estimado: ${estimado}
   Real: ${real}
   Desviación: ${desviacion}
   ${alerta ? '⚠️ ¡Presupuesto superado!' : '✅ Dentro del límite'}
\n`;
    }

    document.querySelector('#resultado-desviaciones').innerText = mensaje;
  });

  // 📊 Balance General
  document.querySelector('#btnBalanceGeneral')?.addEventListener('click', () => {
    const mes = parseInt(document.querySelector('#inputMes').value);
    const anio = parseInt(document.querySelector('#inputAnio').value);
    const resumen = obtenerBalanceMensual(anio, mes);

    const mensaje = `
📅 Periodo: ${mes}/${anio}
🟩 Ingreso Estimado: ${resumen.ingresoEstimado}
🟧 Egreso Estimado: ${resumen.egresosEstimado}
💰 Saldo Estimado: ${resumen.saldoEstimado}

✅ Ingreso Real: ${resumen.ingresoReal}
❌ Egreso Real: ${resumen.egresosReal}
🧾 Saldo Real: ${resumen.saldoReal}
    `;
    document.querySelector('#resultado-presupuesto').innerText = mensaje;
  });
});
