import { financeDB } from '../db.js';

// 🧠 Datos en memoria
let egresosEstimados = {};
let gastosReales = {};
let ingresosEstimados = {};
let ingresosReales = {};

// 🔁 Recarga completa de datos
async function recargarDatosEnMemoria() {
  egresosEstimados = await financeDB.obtenerPresupuestos();
  gastosReales = await financeDB.obtenerGastos();
  ingresosEstimados = await financeDB.obtenerTodosIngresosEstimados();
  ingresosReales = await financeDB.obtenerIngresosReales();
}

// 🔄 Inicialización
export async function inicializarPresupuesto() {
  await recargarDatosEnMemoria();
}

///////////////////////////////////////
// 🟧 EGRESOS – Presupuesto estimado
///////////////////////////////////////

export async function definirPresupuesto(anio, mes, categoria, monto) {
  if (!egresosEstimados[anio]) egresosEstimados[anio] = {};
  if (!egresosEstimados[anio][mes]) egresosEstimados[anio][mes] = {};
  egresosEstimados[anio][mes][categoria] = monto;

  const presupuesto = { anio, mes, categoria, monto };
  await financeDB.guardarPresupuesto(presupuesto);
  await recargarDatosEnMemoria();
}

export function compararPresupuesto(anio, mes) {
  const estimado = egresosEstimados[anio]?.[mes] || {};
  const real = gastosReales[anio]?.[mes] || {};
  const diferencia = {};

  for (const categoria in estimado) {
    const gastado = real[categoria] || 0;
    diferencia[categoria] = estimado[categoria] - gastado;
  }

  return diferencia;
}

export function proyectarEgresosMensuales(mes) {
  let total = 0;
  let count = 0;

  for (const anio in egresosEstimados) {
    const mensual = egresosEstimados[anio]?.[mes];
    if (mensual) {
      total += Object.values(mensual).reduce((a, b) => a + b, 0);
      count++;
    }
  }

  return count > 0 ? (total / count).toFixed(2) : "0.00";
}

export function obtenerPresupuesto(anio, mes) {
  return egresosEstimados[anio]?.[mes] || {};
}

///////////////////////////////////////
// 🟩 INGRESOS – Estimado y análisis
///////////////////////////////////////

export async function definirIngresoEstimado(anio, mes, monto) {
  if (!ingresosEstimados[anio]) ingresosEstimados[anio] = {};
  ingresosEstimados[anio][mes] = monto;

  await financeDB.guardarPresupuestoIngreso({ anio, mes, monto });
  await recargarDatosEnMemoria();
}

export function compararIngresos(anio, mes) {
  const estimado = ingresosEstimados[anio]?.[mes] || 0;
  const real = ingresosReales[anio]?.[mes] || 0;
  return {
    estimado,
    real,
    diferencia: estimado - real
  };
}

export function proyectarIngresosMensuales(mes) {
  let total = 0;
  let count = 0;

  for (const anio in ingresosEstimados) {
    const mensual = ingresosEstimados[anio]?.[mes];
    if (mensual) {
      total += mensual;
      count++;
    }
  }

  return count > 0 ? (total / count).toFixed(2) : "0.00";
}

export function obtenerIngresoEstimado(anio, mes) {
  return ingresosEstimados[anio]?.[mes] || 0;
}

export function obtenerIngresoReal(anio, mes) {
  return ingresosReales[anio]?.[mes] || 0;
}

///////////////////////////////////////
// 🚨 Desviaciones y Alertas
///////////////////////////////////////

export function calcularDesviaciones(anio, mes) {
  const estimado = egresosEstimados[anio]?.[mes] || {};
  const real = gastosReales[anio]?.[mes] || {};

  const resultado = {};

  for (const categoria in estimado) {
    const montoEstimado = estimado[categoria] || 0;
    const montoReal = real[categoria] || 0;
    const desviacion = montoReal - montoEstimado;

    resultado[categoria] = {
      estimado: montoEstimado,
      real: montoReal,
      desviacion,
      alerta: desviacion > 0
    };
  }

  return resultado;
}

// 🔍 Categorías críticas por desviaciones frecuentes
export function detectarCategoriasCriticas() {
  const criticas = {};

  for (const anio in egresosEstimados) {
    for (const mes in egresosEstimados[anio]) {
      const alertas = calcularDesviaciones(anio, mes);
      for (const categoria in alertas) {
        if (alertas[categoria].alerta) {
          criticas[categoria] ||= 0;
          criticas[categoria]++;
        }
      }
    }
  }

  return Object.entries(criticas)
    .sort((a, b) => b[1] - a[1])
    .reduce((acc, [cat, count]) => {
      acc[cat] = count;
      return acc;
    }, {});
}

///////////////////////////////////////
// 📊 Balance General y Análisis anual
///////////////////////////////////////

export function obtenerBalanceMensual(anio, mes) {
  const ingresoEstimado = ingresosEstimados[anio]?.[mes] || 0;
  const ingresoReal = ingresosReales[anio]?.[mes] || 0;
  const egresosEstimado = Object.values(egresosEstimados[anio]?.[mes] || {}).reduce((a, b) => a + b, 0);
  const egresosReal = Object.values(gastosReales[anio]?.[mes] || {}).reduce((a, b) => a + b, 0);

  return {
    ingresoEstimado,
    ingresoReal,
    egresosEstimado,
    egresosReal,
    saldoEstimado: ingresoEstimado - egresosEstimado,
    saldoReal: ingresoReal - egresosReal
  };
}

// 📆 Total anual por categoría
export function obtenerResumenAnual(anio) {
  const resumen = {};
  const gastos = gastosReales[anio] || {};

  for (const mes in gastos) {
    for (const categoria in gastos[mes]) {
      resumen[categoria] ||= 0;
      resumen[categoria] += gastos[mes][categoria];
    }
  }

  return resumen;
}
