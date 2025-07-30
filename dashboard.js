import { financeDB } from '../db.js';
import { mostrarMensaje } from './utils.js';
import { inicializarGraficosDashboard } from './charts.js';

/**
 * 🔄 Inicializa el resumen visual del dashboard
 */
export function inicializarDashboard() {
  cargarResumen();
}

/**
 * 📊 Carga los datos y actualiza el dashboard
 */
async function cargarResumen() {
  const [categorias, transacciones, presupuestos] = await Promise.all([
    financeDB.getAllCategories(),
    getAllFromStore('transactions'),
    getAllFromStore('budgets')
  ]);

  const contenedor = document.getElementById('dashboardResumen');
  contenedor.innerHTML = '';
  let gastoTotal = 0;

  categorias.forEach(cat => {
    const gastoCat = transacciones
      .filter(t => t.categoryId === cat.id && t.tipo === 'egreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const presupuesto = presupuestos.find(p => p.categoryId === cat.id);
    const limite = presupuesto ? presupuesto.amount : null;

    gastoTotal += gastoCat;

    const item = document.createElement('div');
    item.classList.add('dashboard-item');
    if (limite && gastoCat > limite) {
      item.classList.add('exceso-gasto');
    }

    item.innerHTML = `
      <h4>${cat.name}</h4>
      <p>Gasto: $${gastoCat.toFixed(2)}</p>
      <p>Límite: ${limite ? '$' + limite.toFixed(2) : '–'}</p>
    `;
    contenedor.appendChild(item);
  });

  mostrarMensaje('dashboardTotal', `Gasto total acumulado: $${gastoTotal.toFixed(2)}`);

  // 🧩 Visualizaciones gráficas
  inicializarGraficosDashboard(categorias, transacciones, presupuestos);
}

/**
 * 📂 Obtiene todos los registros de un store
 * @param {string} storeName
 * @returns {Promise<any[]>}
 */
function getAllFromStore(storeName) {
  return new Promise((resolve, reject) => {
    const tx = financeDB.db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
