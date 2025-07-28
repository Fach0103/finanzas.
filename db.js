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

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // ✅ Verificar antes de crear cada store
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

        const checkRequest = store.getAll();
        checkRequest.onsuccess = () => {
          const existing = checkRequest.result.map(cat => cat.name.toLowerCase());
          this.defaultCategories.forEach(name => {
            if (!existing.includes(name.toLowerCase())) store.add({ name });
          });
        };

        resolve(true);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // 📂 Métodos de Categorías
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

      const index = tranStore.index('categoryId');
      const cursorRequest = index.openCursor(IDBKeyRange.only(idCategoria));

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      const deleteCatRequest = catStore.delete(idCategoria);
      deleteCatRequest.onsuccess = () => resolve(true);
      deleteCatRequest.onerror = () => reject(deleteCatRequest.error);
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

  // 🟧 Presupuestos de Egresos
  guardarPresupuesto(presupuesto) {
    const id = `${presupuesto.categoria}-${presupuesto.mes}-${presupuesto.anio}`;
    const registro = { id, ...presupuesto };
    return this.#putToStore('budgets', registro);
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

  // 🟩 Presupuestos de Ingresos
  guardarPresupuestoIngreso(presupuesto) {
    const id = `${presupuesto.mes}-${presupuesto.anio}`;
    const registro = { id, ...presupuesto };
    return this.#putToStore('incomeBudgets', registro);
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

  // 🔒 Métodos privados
  #getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  #getFromStore(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  #putToStore(storeName, object) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(object);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  #addToStore(storeName, object) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(object);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  #deleteFromStore(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

export const financeDB = new FinanceDB();
