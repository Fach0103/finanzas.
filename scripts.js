import { financeDB } from '../db.js';
import { inicializarDashboard } from './dashboard.js';
import { inicializarPresupuesto } from './presupuesto.js';
import { inicializarCategorias } from './categorias.js';
import { sincronizarSistema } from './utils.js';

/**
 * 🚀 Punto de entrada principal
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 🧠 Inicializar base de datos
  await financeDB.init();

  // 🟦 Inicializar módulos
  inicializarCategorias();
  await inicializarPresupuesto();
  inicializarDashboard();

  // 🔄 Sincronizar sistema después de carga
  await sincronizarSistema();

  // 📐 Activar navegación entre vistas
  prepararNavegacion();
});

/**
 * 🔀 Control de navegación de vistas (sidebar)
 */
function prepararNavegacion() {
  const enlaces = document.querySelectorAll('.sidebar-nav a');
  const secciones = document.querySelectorAll('.view');

  enlaces.forEach(enlace => {
    enlace.addEventListener('click', (e) => {
      e.preventDefault();
      const destino = enlace.dataset.target;

      secciones.forEach(vista => {
        vista.classList.toggle('active', vista.id === destino);
      });
    });
  });
}
