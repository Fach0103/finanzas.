import { financeDB } from './db.js';

export function inicializarDashboard() {
  cargarResumen();
}

/* 🧾 Muestra resumen financiero por categoría */
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
      .filter(t => t.categoryId === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const presupuesto = presupuestos.find(p => p.categoryId === cat.id);
    const limite = presupuesto ? presupuesto.amount : null;

    gastoTotal += gastoCat;

    const item = document.createElement('div');
    item.classList.add('dashboard-item');
    item.innerHTML = `
      <h4>${cat.name}</h4>
      <p>Gasto: $${gastoCat.toFixed(2)}</p>
      <p>Límite: ${limite ? '$' + limite.toFixed(2) : '–'}</p>
    `;
    contenedor.appendChild(item);
  });

  const totalContenedor = document.getElementById('dashboardTotal');
  totalContenedor.textContent = `Gasto total acumulado: $${gastoTotal.toFixed(2)}`;
}

/* 🔄 Utilidad para obtener datos de stores */
function getAllFromStore(storeName) {
  return new Promise((resolve, reject) => {
    const tx = financeDB.db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
