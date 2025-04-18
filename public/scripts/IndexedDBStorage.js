export const IndexedDBStorage = (() => {
    const dbName = 'IndexedDBStorage';
    const storeName = 'keyval-store';
    let db;

    // Open or create the database and object store
    const initDB = () => {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }

            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                db.createObjectStore(storeName);
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => {
                reject(`Error opening IndexedDB: ${event.target.errorCode}`);
            };
        });
    };

    const setItem = async (key, value) => {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.put(value, key);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (event) => {
                reject(`Error setting item: ${event.target.errorCode}`);
            };
        });
    };

    const getItem = async (key) => {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName]);
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(key);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(`Error getting item: ${event.target.errorCode}`);
            };
        });
    };

    const removeItem = async (key) => {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.delete(key);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (event) => {
                reject(`Error removing item: ${event.target.errorCode}`);
            };
        });
    };

    const clear = async () => {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.clear();

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (event) => {
                reject(`Error clearing storage: ${event.target.errorCode}`);
            };
        });
    };

    return {
        setItem,
        getItem,
        removeItem,
        clear
    };
})();