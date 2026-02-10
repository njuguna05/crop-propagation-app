import { db } from './database';
import { floraAPI } from './floraAPI';
import { useAppStore } from '../stores/appStore';

// Sync service for offline/online data synchronization
class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.syncListeners = [];
    this.conflictResolvers = {};

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners({ type: 'online' });
      this.startSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners({ type: 'offline' });
    });

    // Auto-sync interval (every 5 minutes when online)
    setInterval(() => {
      if (this.isOnline && !this.isSyncing && !this.isAdminUser()) {
        this.startSync();
      }
    }, 5 * 60 * 1000);
  }

  // Check if current user is a superuser/admin
  isAdminUser() {
    const state = useAppStore.getState();
    return state.user?.is_superuser === true;
  }

  // Add sync listener
  addSyncListener(listener) {
    this.syncListeners.push(listener);
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // Notify sync listeners
  notifyListeners(event) {
    this.syncListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  // Set conflict resolver for a table
  setConflictResolver(tableName, resolver) {
    this.conflictResolvers[tableName] = resolver;
  }

  // Default conflict resolver (last write wins)
  defaultConflictResolver(localItem, serverItem) {
    const localTime = new Date(localItem.lastUpdated);
    const serverTime = new Date(serverItem.lastUpdated);
    return localTime > serverTime ? localItem : serverItem;
  }

  // Start sync process
  async startSync(force = false) {
    // Skip sync for admin/superuser accounts
    if (this.isAdminUser()) {
      console.log('Skipping sync for admin user');
      return { success: false, error: 'admin_user' };
    }

    if (!this.isOnline) {
      console.log('Cannot sync: offline');
      return { success: false, error: 'offline' };
    }

    if (this.isSyncing && !force) {
      console.log('Sync already in progress');
      return { success: false, error: 'sync_in_progress' };
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'sync_start' });

    try {
      console.log('Starting sync process...');

      // Step 1: Upload local changes
      const uploadResult = await this.uploadLocalChanges();
      if (!uploadResult.success) {
        throw new Error(`Upload failed: ${uploadResult.error}`);
      }

      // Step 2: Download server changes
      const downloadResult = await this.downloadServerChanges();
      if (!downloadResult.success) {
        throw new Error(`Download failed: ${downloadResult.error}`);
      }

      // Step 3: Process sync queue
      const queueResult = await this.processSyncQueue();
      if (!queueResult.success) {
        console.warn('Some sync queue items failed:', queueResult.error);
      }

      // Update last sync timestamp
      await db.setLastSyncTimestamp(new Date().toISOString());

      this.notifyListeners({
        type: 'sync_complete',
        stats: {
          uploaded: uploadResult.stats,
          downloaded: downloadResult.stats,
          queued: queueResult.stats
        }
      });

      console.log('Sync completed successfully');
      return { success: true };

    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners({ type: 'sync_error', error: error.message });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // Upload local changes to server
  async uploadLocalChanges() {
    try {
      const pendingItems = await db.getPendingSyncItems();
      const stats = {
        crops: 0,
        tasks: 0,
        orders: 0,
        budwoodCollection: 0,
        graftingRecords: 0,
        transferRecords: 0
      };

      // Upload crops
      for (const crop of pendingItems.crops) {
        try {
          let result;
          if (crop.id && crop.id > 0) {
            // Update existing
            result = await floraAPI.updateCrop(crop.id, crop);
          } else {
            // Create new
            result = await floraAPI.createCrop(crop);
            // Update local ID with server ID
            await db.crops.update(crop.id, { id: result.id });
          }
          await db.markAsSynced('crops', [crop.id]);
          stats.crops++;
        } catch (error) {
          console.error(`Failed to upload crop ${crop.id}:`, error);
          await db.addToSyncQueue('upload', 'crops', crop.id, crop);
        }
      }

      // Upload tasks
      for (const task of pendingItems.tasks) {
        try {
          let result;
          if (task.id && task.id > 0) {
            result = await floraAPI.updateTask(task.id, task);
          } else {
            result = await floraAPI.createTask(task);
            await db.tasks.update(task.id, { id: result.id });
          }
          await db.markAsSynced('tasks', [task.id]);
          stats.tasks++;
        } catch (error) {
          console.error(`Failed to upload task ${task.id}:`, error);
          await db.addToSyncQueue('upload', 'tasks', task.id, task);
        }
      }

      // Upload orders
      for (const order of pendingItems.orders) {
        try {
          let result;
          if (order.id && typeof order.id === 'string' && order.id.startsWith('PO-')) {
            result = await floraAPI.updateOrder(order.id, order);
          } else {
            result = await floraAPI.createOrder(order);
            await db.orders.update(order.id, { id: result.id });
          }
          await db.markAsSynced('orders', [order.id]);
          stats.orders++;
        } catch (error) {
          console.error(`Failed to upload order ${order.id}:`, error);
          await db.addToSyncQueue('upload', 'orders', order.id, order);
        }
      }

      // Upload budwood collection records
      for (const record of pendingItems.budwoodCollection) {
        try {
          let result;
          if (record.id && typeof record.id === 'string') {
            result = await floraAPI.updateBudwoodRecord(record.id, record);
          } else {
            result = await floraAPI.createBudwoodRecord(record);
            await db.budwoodCollection.update(record.id, { id: result.id });
          }
          await db.markAsSynced('budwoodCollection', [record.id]);
          stats.budwoodCollection++;
        } catch (error) {
          console.error(`Failed to upload budwood record ${record.id}:`, error);
          await db.addToSyncQueue('upload', 'budwoodCollection', record.id, record);
        }
      }

      // Upload grafting records
      for (const record of pendingItems.graftingRecords) {
        try {
          let result;
          if (record.id && typeof record.id === 'string') {
            result = await floraAPI.updateGraftingRecord(record.id, record);
          } else {
            result = await floraAPI.createGraftingRecord(record);
            await db.graftingRecords.update(record.id, { id: result.id });
          }
          await db.markAsSynced('graftingRecords', [record.id]);
          stats.graftingRecords++;
        } catch (error) {
          console.error(`Failed to upload grafting record ${record.id}:`, error);
          await db.addToSyncQueue('upload', 'graftingRecords', record.id, record);
        }
      }

      // Upload transfer records
      for (const record of pendingItems.transferRecords) {
        try {
          let result;
          if (record.id && typeof record.id === 'string') {
            result = await floraAPI.updateTransferRecord(record.id, record);
          } else {
            result = await floraAPI.createTransferRecord(record);
            await db.transferRecords.update(record.id, { id: result.id });
          }
          await db.markAsSynced('transferRecords', [record.id]);
          stats.transferRecords++;
        } catch (error) {
          console.error(`Failed to upload transfer record ${record.id}:`, error);
          await db.addToSyncQueue('upload', 'transferRecords', record.id, record);
        }
      }

      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Download server changes
  async downloadServerChanges() {
    try {
      const lastSync = await db.getLastSyncTimestamp();
      const stats = {
        crops: 0,
        tasks: 0,
        orders: 0,
        budwoodCollection: 0,
        graftingRecords: 0,
        transferRecords: 0
      };

      // Download crops
      const crops = await floraAPI.getCrops(lastSync);
      if (crops.length > 0) {
        await this.mergeServerData('crops', crops);
        stats.crops = crops.length;
      }

      // Download tasks
      const tasks = await floraAPI.getTasks(lastSync);
      if (tasks.length > 0) {
        await this.mergeServerData('tasks', tasks);
        stats.tasks = tasks.length;
      }

      // Download orders
      const orders = await floraAPI.getOrders(lastSync);
      if (orders.length > 0) {
        await this.mergeServerData('orders', orders);
        stats.orders = orders.length;
      }

      // Download budwood records
      const budwoodRecords = await floraAPI.getBudwoodRecords(lastSync);
      if (budwoodRecords.length > 0) {
        await this.mergeServerData('budwoodCollection', budwoodRecords);
        stats.budwoodCollection = budwoodRecords.length;
      }

      // Download grafting records
      const graftingRecords = await floraAPI.getGraftingRecords(lastSync);
      if (graftingRecords.length > 0) {
        await this.mergeServerData('graftingRecords', graftingRecords);
        stats.graftingRecords = graftingRecords.length;
      }

      // Download transfer records
      const transferRecords = await floraAPI.getTransferRecords(lastSync);
      if (transferRecords.length > 0) {
        await this.mergeServerData('transferRecords', transferRecords);
        stats.transferRecords = transferRecords.length;
      }

      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Merge server data with local data (handle conflicts)
  async mergeServerData(tableName, serverItems) {
    const table = db[tableName];

    for (const serverItem of serverItems) {
      const localItem = await table.get(serverItem.id);

      if (!localItem) {
        // New item from server
        await table.put({ ...serverItem, syncStatus: 'synced' });
      } else if (localItem.syncStatus === 'synced') {
        // Local item is synced, update with server version
        await table.put({ ...serverItem, syncStatus: 'synced' });
      } else {
        // Conflict: local item has changes
        const resolver = this.conflictResolvers[tableName] || this.defaultConflictResolver;
        const resolvedItem = resolver(localItem, serverItem);

        if (resolvedItem === localItem) {
          // Keep local version, will be uploaded in next sync
          console.log(`Conflict resolved: keeping local version of ${tableName} ${localItem.id}`);
        } else {
          // Use server version
          await table.put({ ...resolvedItem, syncStatus: 'synced' });
          console.log(`Conflict resolved: using server version of ${tableName} ${serverItem.id}`);
        }
      }
    }
  }

  // Process sync queue for retries
  async processSyncQueue() {
    try {
      const queueItems = await db.getSyncQueue();
      const stats = { processed: 0, failed: 0 };

      for (const item of queueItems) {
        if (item.retryCount >= 3) {
          // Max retries reached, remove from queue
          await db.clearSyncQueueItem(item.id);
          stats.failed++;
          continue;
        }

        try {
          if (item.operation === 'upload') {
            // Retry upload operation
            const table = db[item.tableName];
            const currentData = await table.get(item.recordId);

            if (currentData) {
              let result;
              if (item.tableName === 'crops') {
                result = currentData.id > 0
                  ? await floraAPI.updateCrop(currentData.id, currentData)
                  : await floraAPI.createCrop(currentData);
              } else if (item.tableName === 'tasks') {
                result = currentData.id > 0
                  ? await floraAPI.updateTask(currentData.id, currentData)
                  : await floraAPI.createTask(currentData);
              } else if (item.tableName === 'orders') {
                result = typeof currentData.id === 'string' && currentData.id.startsWith('PO-')
                  ? await floraAPI.updateOrder(currentData.id, currentData)
                  : await floraAPI.createOrder(currentData);
              }

              if (result) {
                await db.markAsSynced(item.tableName, [item.recordId]);
                await db.clearSyncQueueItem(item.id);
                stats.processed++;
              }
            } else {
              // Item no longer exists locally, remove from queue
              await db.clearSyncQueueItem(item.id);
              stats.processed++;
            }
          }
        } catch (error) {
          console.error(`Retry failed for queue item ${item.id}:`, error);
          await db.incrementRetryCount(item.id);
          stats.failed++;
        }
      }

      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Force full sync (downloads everything from server)
  async forceSyncFromServer() {
    // Skip sync for admin/superuser accounts
    if (this.isAdminUser()) {
      console.log('Skipping full sync for admin user');
      return { success: false, error: 'admin_user' };
    }

    try {
      this.notifyListeners({ type: 'full_sync_start' });

      // Clear local data
      await db.clearAllData();

      // Download all data
      const crops = await floraAPI.getAllCrops();
      const tasks = await floraAPI.getAllTasks();
      const orders = await floraAPI.getAllOrders();
      const budwoodRecords = await floraAPI.getAllBudwoodRecords();
      const graftingRecords = await floraAPI.getAllGraftingRecords();
      const transferRecords = await floraAPI.getAllTransferRecords();

      // Store data locally
      if (crops.length > 0) await db.bulkUpsertCrops(crops);
      if (tasks.length > 0) await db.bulkUpsertTasks(tasks);
      if (orders.length > 0) await db.bulkUpsertOrders(orders);
      if (budwoodRecords.length > 0) await db.budwoodCollection.bulkPut(budwoodRecords);
      if (graftingRecords.length > 0) await db.graftingRecords.bulkPut(graftingRecords);
      if (transferRecords.length > 0) await db.transferRecords.bulkPut(transferRecords);

      // Update sync timestamp
      await db.setLastSyncTimestamp(new Date().toISOString());

      this.notifyListeners({ type: 'full_sync_complete' });

      return { success: true };
    } catch (error) {
      this.notifyListeners({ type: 'full_sync_error', error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Check sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    };
  }
}

// Create sync service instance
export const syncService = new SyncService();