import { financeDB } from './db.js';
import { inicializarNavegacion } from './js/sidebar.js';
import { inicializarCategorias } from './js/categorias.js';
import { inicializarDashboard } from './js/dashboard.js';

document.addEventListener('DOMContentLoaded', async () => {
  await financeDB.init();             // 🔐 Inicializa IndexedDB
  inicializarNavegacion();            // 🧭 Módulo de navegación entre vistas
  inicializarCategorias();            // 🗂️ Carga y gestiona categorías
  inicializarDashboard();             // 📊 Muestra resumen financiero
});
