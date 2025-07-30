class FinanceDB {
  constructor() {
    this.dbName = 'FinanzasApp';
    this.dbVersion = 2;
    this.db = null;

    this.defaultCategories = [
      'Alimentación', 'Transporte', 'Ocio', 'Servicios',
      'Salud', 'Educación', 'Otros'
    ];
  }

  // 🔌 Inicializa la base de datos con stores
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = ({ target }) => {
        const db = target.result;

        // Categorías
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        }

        // Transacciones
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('categoryId', 'categoryId');
        }

        // Presupuestos
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }

        // Presupuestos de ingresos
        if (!db.objectStoreNames.contains('incomeBudgets')) {
          db.createObjectStore('incomeBudgets', { keyPath: 'id' });
        }
      };

      request.onsuccess = ({ target }) => {
        this.db = target.result;
        this.#ensureDefaultCategories().then(resolve).catch(reject);
      };

      request.onerror = ({ target }) => reject(target.error);
    });
  }

  // 🗂️ Asegura categorías iniciales
  async #ensureDefaultCategories() {
    const tx = this.db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = ({ target }) => {
        const existentes = target.result.map(c => c.name.toLowerCase());
        this.defaultCategories.forEach(name => {
          if (!existentes.includes(name.toLowerCase())) store.add({ name });
        });
        resolve();
      };
      request.onerror = ({ target }) => reject(target.error);
    });
  }

  // 📂 Categorías
  getAllCategories() {
    return this.#getAll('categories');
  }

  addCategory(data) {
    return this.#add('categories', data);
  }

  updateCategory(id, data) {
    return this.#put('categories', { id, ...data });
  }

  deleteCategoryAndTransactions(idCategoria) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['categories', 'transactions'], 'readwrite');
      const catStore = tx.objectStore('categories');
      const tranStore = tx.objectStore('transactions');

      const cursor = tranStore.index('categoryId').openCursor(IDBKeyRange.only(idCategoria));
      cursor.onsuccess = ({ target }) => {
        const c = target.result;
        if (c) {
          c.delete();
          c.continue();
        }
      };

      catStore.delete(idCategoria).onsuccess = () => resolve(true);
      catStore.delete(idCategoria).onerror = e => reject(e.target.error);
    });
  }

  // 💳 Transacciones
  guardarTransaccion(data) {
    return this.#put('transactions', data);
  }

  obtenerTodasTransacciones() {
    return this.#getAll('transactions');
  }

  eliminarTransaccion(id) {
    return this.#delete('transactions', id);
  }

  // 🟧 Presupuestos de egresos
  guardarPresupuestoEgreso(p) {
    const id = `${p.categoria}-${p.mes}-${p.anio}`;
    return this.#put('budgets', { id, ...p });
  }

  obtenerPresupuestos() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('budgets', 'readonly');
      const store = tx.objectStore('budgets');
      const req = store.getAll();

      req.onsuccess = () => {
        const r = req.result.reduce((acc, p) => {
          acc[p.anio] ||= {};
          acc[p.anio][p.mes] ||= {};
          acc[p.anio][p.mes][p.categoria] = p.monto;
          return acc;
        }, {});
        resolve(r);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // 🟩 Presupuestos de ingresos
  guardarPresupuestoIngreso(p) {
    const id = `${p.mes}-${p.anio}`;
    return this.#put('incomeBudgets', { id, ...p });
  }

  obtenerTodosIngresosEstimados() {
    return this.#aggregateStore('incomeBudgets', p => {
      return { anio: p.anio, mes: p.mes, monto: p.monto };
    });
  }

  obtenerIngresosReales() {
    return this.#aggregateStore('transactions', t => {
      if (t.tipo !== 'ingreso') return null;
      const fecha = new Date(t.fecha);
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, monto: t.monto };
    });
  }

  obtenerGastosReales() {
    return this.#aggregateStore('transactions', t => {
      if (t.tipo !== 'egreso') return null;
      const fecha = new Date(t.fecha);
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, categoria: t.categoria, monto: t.monto };
    }, true);
  }

  // 🔒 Métodos internos
  #getAll(store) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readonly');
      tx.objectStore(store).getAll().onsuccess = e => res(e.target.result);
      tx.objectStore(store).getAll().onerror = e => rej(e.target.error);
    });
  }

  #add(store, obj) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).add(obj).onsuccess = e => res(e.target.result);
      tx.objectStore(store).add(obj).onerror = e => rej(e.target.error);
    });
  }

  #put(store, obj) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).put(obj).onsuccess = () => res(true);
      tx.objectStore(store).put(obj).onerror = e => rej(e.target.error);
    });
  }

  #delete(store, id) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id).onsuccess = () => res(true);
      tx.objectStore(store).delete(id).onerror = e => rej(e.target.error);
    });
  }

  // 🧠 Agrupación personalizada
  #aggregateStore(store, transformFn, groupByCategory = false) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const s = tx.objectStore(store);
      const req = s.getAll();

      req.onsuccess = () => {
        const result = {};
        req.result.forEach(item => {
          const t = transformFn(item);
          if (!t) return;
          const { anio, mes, categoria, monto } = t;
          result[anio] ||= {};
          result[anio][mes] ||= groupByCategory ? {} : 0;

          if (groupByCategory) {
            result[anio][mes][categoria] ||= 0;
            result[anio][mes][categoria] += monto;
          } else {
            result[anio][mes] += monto;
          }
        });
        resolve(result);
      };

      req.onerror = () => reject(req.error);
    });
  }
}

// 🎯 Exportación
export const financeDB = new FinanceDB();
