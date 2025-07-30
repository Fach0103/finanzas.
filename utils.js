import { financeDB } from '../db.js';
import { cargarCategoriasEnSelect } from './categorias.js';
import { inicializarDashboard } from './dashboard.js';
import { inicializarPresupuesto } from './presupuesto.js';

/**
 * 🔄 Sincroniza el sistema completo después de una acción (transacción, presupuesto, etc.)
 * @param {TransaccionesManager|null} managerTransacciones 
 */
export async function sincronizarSistema(managerTransacciones = null) {
  const transacciones = await financeDB.obtenerTodasTransacciones();

  // 📝 Recargar lista de transacciones si hay instancia disponible
  if (managerTransacciones) {
    managerTransacciones.cargarDesdeLista(transacciones);
  }

  // 📊 Actualizar dashboard y memoria financiera
  inicializarDashboard();
  await inicializarPresupuesto();

  // 🔃 Recargar selects
  cargarCategoriasEnSelect('categorySelect');
  cargarCategoriasEnSelect('budgetCategorySelect');
}

/**
 * 🧽 Resetea todos los inputs de un formulario
 * @param {string} formId 
 */
export function resetearFormulario(formId) {
  const form = document.querySelector(formId);
  if (form) form.reset();
}

/**
 * 📆 Formatea una fecha ISO (yyyy-mm-dd) a formato legible
 * @param {string} fechaISO 
 * @returns {string}
 */
export function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * 💬 Muestra un mensaje en un elemento HTML
 * @param {string} elementId 
 * @param {string} texto 
 */
export function mostrarMensaje(elementId, texto) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = texto;
}
