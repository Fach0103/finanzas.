class FinanceDB {
  constructor() {
    this.dbName = 'FinanzasApp';
    this.dbVersion = 1;
    this.db = null;
    this.defaultCategories = [
      'Alimentación',
      'Transporte',
      'Ocio',
      'Servicios',
      'Salud',
      'Educación',
      'Otros'
    ];
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        db.createObjectStore('categories', {
          keyPath: 'id',
          autoIncrement: true
        });

        const transactionStore = db.createObjectStore('transactions', {
          keyPath: 'id',
          autoIncrement: true
        });
        transactionStore.createIndex('categoryId', 'categoryId', { unique: false });

        db.createObjectStore('budgets', {
          keyPath: 'id',
          autoIncrement: true
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;

        const transaction = this.db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        const checkRequest = store.getAll();
        checkRequest.onsuccess = () => {
          const existingNames = checkRequest.result.map(cat => cat.name.toLowerCase());

          this.defaultCategories.forEach(name => {
            if (!existingNames.includes(name.toLowerCase())) {
              store.add({ name });
            }
          });
        };

        checkRequest.onerror = () => {
          console.error('Error al verificar categorías existentes:', checkRequest.error);
        };

        resolve(true);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  getAllCategories() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['categories'], 'readonly');
      const store = transaction.objectStore('categories');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  addCategory(categoria) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['categories'], 'readwrite');
      const store = transaction.objectStore('categories');
      const request = store.add(categoria);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  updateCategory(id, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['categories'], 'readwrite');
      const store = transaction.objectStore('categories');
      const request = store.put({ id, ...data });

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  deleteCategoryAndTransactions(idCategoria) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['categories', 'transactions'], 'readwrite');
      const categoryStore = transaction.objectStore('categories');
      const transactionStore = transaction.objectStore('transactions');

      const index = transactionStore.index('categoryId');
      const cursorRequest = index.openCursor(IDBKeyRange.only(idCategoria));

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      cursorRequest.onerror = () => {
        reject(cursorRequest.error);
      };

      const deleteCategoryRequest = categoryStore.delete(idCategoria);
      deleteCategoryRequest.onsuccess = () => resolve(true);
      deleteCategoryRequest.onerror = () => reject(deleteCategoryRequest.error);
    });
  }
}

export const financeDB = new FinanceDB();
