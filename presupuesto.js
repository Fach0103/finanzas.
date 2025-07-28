import { financeDB } from '../db.js';

// 🧠 Datos en memoria
let egresosEstimados = {};
let gastosReales = {};
let ingresosEstimados = {};
let ingresosReales = {};

// 🔄 Carga inicial general
export async function inicializarPresupuesto() {
  egresosEstimados = await financeDB.obtenerPresupuestos();
  gastosReales = await financeDB.obtenerGastos();
  ingresosEstimados = await financeDB.obtenerTodosIngresosEstimados();
  ingresosReales = await financeDB.obtenerIngresosReales();
}

///////////////////////////////////////
// 🟧 EGRESOS – Presupuesto estimado
///////////////////////////////////////

export function definirPresupuesto(anio, mes, categoria, monto) {
  if (!egresosEstimados[anio]) egresosEstimados[anio] = {};
  if (!egresosEstimados[anio][mes]) egresosEstimados[anio][mes] = {};
  egresosEstimados[anio][mes][categoria] = monto;

  const presupuesto = { anio, mes, categoria, monto };
  financeDB.guardarPresupuesto(presupuesto);
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

///////////////////////////////////////
// 📊 Balance General Mensual
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
