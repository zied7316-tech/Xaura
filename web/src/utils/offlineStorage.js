// Offline storage utility for walk-in appointments
// Uses IndexedDB for reliable offline storage

const DB_NAME = 'xaura-walkin-db';
const DB_VERSION = 1;
const STORE_NAME = 'walkin-queue';

let db = null;

// Initialize IndexedDB
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: false
        });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
};

// Generate unique ID for offline items
const generateId = () => {
  return `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Save walk-in appointment to offline queue
export const saveToQueue = async (appointmentData) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const item = {
      id: generateId(),
      ...appointmentData,
      timestamp: new Date().toISOString(),
      status: 'pending', // pending, syncing, synced, failed
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => {
        console.log('✅ Walk-in saved to offline queue:', item.id);
        resolve(item);
      };
      request.onerror = () => {
        console.error('Failed to save to queue:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error saving to queue:', error);
    throw error;
  }
};

// Get all pending items from queue
export const getQueue = async () => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
};

// Update item status
export const updateItemStatus = async (id, status, serverId = null) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error('Item not found'));
          return;
        }

        item.status = status;
        if (serverId) {
          item.serverId = serverId;
        }
        if (status === 'syncing') {
          item.syncingAt = new Date().toISOString();
        }
        if (status === 'synced') {
          item.syncedAt = new Date().toISOString();
        }
        if (status === 'failed') {
          item.retryCount = (item.retryCount || 0) + 1;
        }

        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve(item);
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Error updating item status:', error);
    throw error;
  }
};

// Remove item from queue (after successful sync)
export const removeFromQueue = async (id) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('✅ Removed from queue:', id);
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error removing from queue:', error);
    throw error;
  }
};

// Get queue count
export const getQueueCount = async () => {
  try {
    const queue = await getQueue();
    return queue.length;
  } catch (error) {
    console.error('Error getting queue count:', error);
    return 0;
  }
};

// Check if online
export const isOnline = () => {
  return navigator.onLine;
};

// Listen for online/offline events
export const onOnlineStatusChange = (callback) => {
  window.addEventListener('online', () => {
    console.log('🌐 Online - starting sync...');
    callback(true);
  });
  window.addEventListener('offline', () => {
    console.log('📴 Offline - saving locally...');
    callback(false);
  });
};

