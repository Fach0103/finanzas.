import { financeDB } from './db.js';                         // db.js está en la raíz
import { inicializarNavegacion } from './js/sidebar.js';     // módulos están en /js/
import { inicializarCategorias } from './js/categorias.js';
import { inicializarDashboard } from './js/dashboard.js';


document.addEventListener('DOMContentLoaded', async () => {
  await financeDB.init();             // 🔒 Inicializa IndexedDB y stores
  inicializarNavegacion();            // 🧭 Activa navegación entre vistas
  inicializarCategorias();            // 🗂️ Carga y gestiona categorías
  inicializarDashboard();             // 📊 Muestra resumen financiero
});
