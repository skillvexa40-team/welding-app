const DB_NAME = 'WeldingAppDB';
const DB_VERSION = 1;

const STORES = {
  shops: { keyPath: 'id', autoIncrement: true },
  items: { keyPath: 'id', autoIncrement: true },
  purchases: { keyPath: 'id', autoIncrement: true },
  clients: { keyPath: 'id', autoIncrement: true },
  jobs: { keyPath: 'id', autoIncrement: true },
  job_materials: { keyPath: 'id', autoIncrement: true },
  payments: { keyPath: 'id', autoIncrement: true },
  employees: { keyPath: 'id', autoIncrement: true },
  salary_payments: { keyPath: 'id', autoIncrement: true },
  weekly_kharcha: { keyPath: 'id', autoIncrement: true },
  expenses: { keyPath: 'id', autoIncrement: true },
  settings: { keyPath: 'key' }
};

export const db = {
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (e) => reject('Database error: ' + e.target.errorCode);

      request.onsuccess = (e) => {
        resolve(e.target.result);
      };

      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        
        for (const [storeName, config] of Object.entries(STORES)) {
          if (!database.objectStoreNames.contains(storeName)) {
            const store = database.createObjectStore(storeName, config);
            
            if (storeName === 'items') {
              store.createIndex('name', 'name', { unique: false });
              store.createIndex('category', 'category', { unique: false });
              store.createIndex('shopId', 'shopId', { unique: false });
            }
            if (storeName === 'clients') {
              store.createIndex('name', 'name', { unique: false });
              store.createIndex('phone', 'phone', { unique: false });
            }
            if (storeName === 'jobs') {
              store.createIndex('clientId', 'clientId', { unique: false });
              store.createIndex('shopId', 'shopId', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            }
            if (storeName === 'employees') {
              store.createIndex('shopId', 'shopId', { unique: false });
            }
            if (storeName === 'expenses') {
              store.createIndex('shopId', 'shopId', { unique: false });
              store.createIndex('date', 'date', { unique: false });
            }
          }
        }
      };
    });
  },

  async add(storeName, data) {
    const database = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, data) {
    const database = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async get(storeName, id) {
    const database = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(storeName) {
    const database = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getByIndex(storeName, indexName, value) {
    const database = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, id) {
    const database = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    const database = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};