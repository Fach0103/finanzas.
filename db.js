class FinanceDB {
  constructor() {
    this.dbName = 'FinanzasApp';
    this.dbVersion = 2; // ✅ Versión actual con soporte de ingresos estimados
    this.db = null;
    this.defaultCategories = [
      'Alimentación', 'Transporte', 'Ocio', 'Servicios',
      'Salud', 'Educación', 'Otros'
    ];
  }

  // 🔌 Inicializar la base de datos
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('categoryId', 'categoryId', { unique: false });
        }

        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('incomeBudgets')) {
          db.createObjectStore('incomeBudgets', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        const tx = this.db.transaction(['categories'], 'readwrite');
        const store = tx.objectStore('categories');

        store.getAll().onsuccess = (e) => {
          const existing = e.target.result.map(cat => cat.name.toLowerCase());
          this.defaultCategories.forEach(name => {
            if (!existing.includes(name.toLowerCase())) {
              store.add({ name });
            }
          });
        };

        resolve(true);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // 📂 Categorías
  getAllCategories() {
    return this.#getAllFromStore('categories');
  }

  addCategory(categoria) {
    return this.#addToStore('categories', categoria);
  }

  updateCategory(id, data) {
    return this.#putToStore('categories', { id, ...data });
  }

  deleteCategoryAndTransactions(idCategoria) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['categories', 'transactions'], 'readwrite');
      const catStore = tx.objectStore('categories');
      const tranStore = tx.objectStore('transactions');

      const cursorRequest = tranStore.index('categoryId').openCursor(IDBKeyRange.only(idCategoria));
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      catStore.delete(idCategoria).onsuccess = () => resolve(true);
      catStore.delete(idCategoria).onerror = () => reject(catStore.delete(idCategoria).error);
    });
  }

  // 💳 Transacciones
  guardarTransaccion(transaccion) {
    return this.#putToStore('transactions', transaccion);
  }

  obtenerTodas() {
    return this.#getAllFromStore('transactions');
  }

  eliminarTransaccion(id) {
    return this.#deleteFromStore('transactions', id);
  }

  // 🟧 Presupuesto de Egresos
  guardarPresupuesto(presupuesto) {
    const id = `${presupuesto.categoria}-${presupuesto.mes}-${presupuesto.anio}`;
    return this.#putToStore('budgets', { id, ...presupuesto });
  }

  obtenerPresupuestoPorId(id) {
    return this.#getFromStore('budgets', id);
  }

  obtenerPresupuestos() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['budgets'], 'readonly');
      const store = tx.objectStore('budgets');
      const request = store.getAll();

      request.onsuccess = () => {
        const agrupados = {};
        request.result.forEach(p => {
          agrupados[p.anio] ||= {};
          agrupados[p.anio][p.mes] ||= {};
          agrupados[p.anio][p.mes][p.categoria] = p.monto;
        });
        resolve(agrupados);
      };

      request.onerror = () => reject(request.error);
    });
  }

  obtenerGastos() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['transactions'], 'readonly');
      const store = tx.objectStore('transactions');
      const request = store.getAll();

      request.onsuccess = () => {
        const gastos = {};
        request.result.forEach(t => {
          if (t.tipo !== 'egreso') return;
          const fecha = new Date(t.fecha);
          const anio = fecha.getFullYear();
          const mes = fecha.getMonth() + 1;

          gastos[anio] ||= {};
          gastos[anio][mes] ||= {};
          gastos[anio][mes][t.categoria] ||= 0;
          gastos[anio][mes][t.categoria] += t.monto;
        });
        resolve(gastos);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 🟩 Presupuesto de Ingresos
  guardarPresupuestoIngreso(presupuesto) {
    const id = `${presupuesto.mes}-${presupuesto.anio}`;
    return this.#putToStore('incomeBudgets', { id, ...presupuesto });
  }

  obtenerTodosIngresosEstimados() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['incomeBudgets'], 'readonly');
      const store = tx.objectStore('incomeBudgets');
      const request = store.getAll();

      request.onsuccess = () => {
        const agrupados = {};
        request.result.forEach(p => {
          agrupados[p.anio] ||= {};
          agrupados[p.anio][p.mes] = p.monto;
        });
        resolve(agrupados);
      };

      request.onerror = () => reject(request.error);
    });
  }

  obtenerIngresosReales() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['transactions'], 'readonly');
      const store = tx.objectStore('transactions');
      const request = store.getAll();

      request.onsuccess = () => {
        const ingresos = {};
        request.result.forEach(t => {
          if (t.tipo !== 'ingreso') return;
          const fecha = new Date(t.fecha);
          const anio = fecha.getFullYear();
          const mes = fecha.getMonth() + 1;

          ingresos[anio] ||= {};
          ingresos[anio][mes] ||= 0;
          ingresos[anio][mes] += t.monto;
        });
        resolve(ingresos);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 🛠️ Métodos privados internos
  #getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      tx.objectStore(storeName).getAll().onsuccess = (e) => resolve(e.target.result);
      tx.objectStore(storeName).getAll().onerror = (e) => reject(e.target.error);
    });
  }

  #getFromStore(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      tx.objectStore(storeName).get(id).onsuccess = (e) => resolve(e.target.result);
      tx.objectStore(storeName).get(id).onerror = (e) => reject(e.target.error);
    });
  }

  #putToStore(storeName, object) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      tx.objectStore(storeName).put(object).onsuccess = () => resolve(true);
      tx.objectStore(storeName).put(object).onerror = (e) => reject(e.target.error);
    });
  }

  #addToStore(storeName, object) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      tx.objectStore(storeName).add(object).onsuccess = (e) => resolve(e.target.result);
      tx.objectStore(storeName).add(object).onerror = (e) => reject(e.target.error);
    });
  }

  #deleteFromStore(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      tx.objectStore(storeName).delete(id).onsuccess = () => resolve(true);
      tx.objectStore(storeName).delete(id).onerror = (e) => reject(e.target.error);
    });
  }
}

// 🎯 Instancia exportada para uso global
export const financeDB = new FinanceDB();
