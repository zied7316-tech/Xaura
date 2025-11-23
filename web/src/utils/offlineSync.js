// Offline sync service for walk-in appointments
import { getQueue, updateItemStatus, removeFromQueue } from './offlineStorage';
import { appointmentManagementService } from '../services/appointmentManagementService';

let isSyncing = false;
let syncInterval = null;

// Sync a single item
const syncItem = async (item) => {
  try {
    // Update status to syncing
    await updateItemStatus(item.id, 'syncing');

    // Extract appointment data (remove internal fields)
    const { id, timestamp, status, retryCount, syncingAt, syncedAt, serverId, ...appointmentData } = item;

    // Try to sync to server
    const result = await appointmentManagementService.createWalkInAppointment(appointmentData);

    if (result.success) {
      // Success - remove from queue
      await removeFromQueue(item.id);
      console.log('✅ Synced walk-in:', item.id, '→', result.data._id);
      return { success: true, itemId: item.id, serverId: result.data._id };
    } else {
      // Failed - mark as failed
      await updateItemStatus(item.id, 'failed');
      console.error('❌ Sync failed:', item.id, result.message);
      return { success: false, itemId: item.id, error: result.message };
    }
  } catch (error) {
    // Network error or other error - mark as failed
    await updateItemStatus(item.id, 'failed');
    console.error('❌ Sync error:', item.id, error.message);
    return { success: false, itemId: item.id, error: error.message };
  }
};

// Sync all pending items
export const syncQueue = async () => {
  if (isSyncing) {
    console.log('⏳ Sync already in progress...');
    return;
  }

  if (!navigator.onLine) {
    console.log('📴 Offline - cannot sync');
    return;
  }

  isSyncing = true;
  console.log('🔄 Starting queue sync...');

  try {
    const queue = await getQueue();
    
    if (queue.length === 0) {
      console.log('✅ Queue is empty');
      isSyncing = false;
      return { synced: 0, failed: 0, total: 0 };
    }

    console.log(`📦 Found ${queue.length} items to sync`);

    let synced = 0;
    let failed = 0;

    // Sync items one by one (to avoid overwhelming the server)
    for (const item of queue) {
      // Skip items that failed too many times (more than 5 retries)
      if (item.retryCount >= 5) {
        console.warn('⚠️ Skipping item with too many retries:', item.id);
        failed++;
        continue;
      }

      const result = await syncItem(item);
      if (result.success) {
        synced++;
      } else {
        failed++;
      }

      // Small delay between items to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);
    isSyncing = false;
    return { synced, failed, total: queue.length };
  } catch (error) {
    console.error('❌ Sync error:', error);
    isSyncing = false;
    return { synced: 0, failed: 0, total: 0, error: error.message };
  }
};

// Start automatic sync (checks every 30 seconds)
export const startAutoSync = () => {
  if (syncInterval) {
    return; // Already started
  }

  // Sync immediately if online
  if (navigator.onLine) {
    syncQueue();
  }

  // Then sync every 30 seconds
  syncInterval = setInterval(() => {
    if (navigator.onLine && !isSyncing) {
      syncQueue();
    }
  }, 30000); // 30 seconds

  console.log('🔄 Auto-sync started (every 30 seconds)');
};

// Stop automatic sync
export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏹️ Auto-sync stopped');
  }
};

// Listen for online events and sync immediately
export const setupOnlineListener = () => {
  window.addEventListener('online', () => {
    console.log('🌐 Online - syncing queue...');
    syncQueue();
  });
};

