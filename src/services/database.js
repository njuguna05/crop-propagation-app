import Dexie from 'dexie';

// IndexedDB database for offline storage
export class CropPropagationDB extends Dexie {
  constructor() {
    super('CropPropagationDB');

    // Define schema
    this.version(1).stores({
      crops: '++id, name, variety, propagationMethod, currentStage, location, plantedDate, lastUpdated, syncStatus',
      tasks: '++id, cropId, task, dueDate, completed, priority, lastUpdated, syncStatus',
      orders: '++id, orderNumber, status, clientName, cropType, variety, totalQuantity, currentStageQuantity, orderDate, lastUpdated, syncStatus',
      budwoodCollection: '++id, orderId, motherTreeId, variety, harvestDate, quantity, quality, operator, lastUpdated, syncStatus',
      graftingRecords: '++id, orderId, date, operator, technique, quantity, successRate, lastUpdated, syncStatus',
      transferRecords: '++id, orderId, fromSection, toSection, quantity, transferDate, operator, lastUpdated, syncStatus',
      syncQueue: '++id, operation, tableName, recordId, data, timestamp, retryCount',
      userSettings: 'id, key, value, lastUpdated'
    });

    // Hooks for automatic sync status and timestamps
    this.crops.hook('creating', (primKey, obj, trans) => {
      obj.lastUpdated = new Date().toISOString();
      obj.syncStatus = 'pending';
    });

    this.crops.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.lastUpdated = new Date().toISOString();
      modifications.syncStatus = 'pending';
    });

    this.tasks.hook('creating', (primKey, obj, trans) => {
      obj.lastUpdated = new Date().toISOString();
      obj.syncStatus = 'pending';
    });

    this.tasks.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.lastUpdated = new Date().toISOString();
      modifications.syncStatus = 'pending';
    });

    this.orders.hook('creating', (primKey, obj, trans) => {
      obj.lastUpdated = new Date().toISOString();
      obj.syncStatus = 'pending';
    });

    this.orders.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.lastUpdated = new Date().toISOString();
      modifications.syncStatus = 'pending';
    });
  }

  // Bulk operations for sync
  async bulkUpsertCrops(crops) {
    const cropsWithSync = crops.map(crop => ({
      ...crop,
      lastUpdated: crop.lastUpdated || new Date().toISOString(),
      syncStatus: crop.syncStatus || 'synced'
    }));
    return await this.crops.bulkPut(cropsWithSync);
  }

  async bulkUpsertTasks(tasks) {
    const tasksWithSync = tasks.map(task => ({
      ...task,
      lastUpdated: task.lastUpdated || new Date().toISOString(),
      syncStatus: task.syncStatus || 'synced'
    }));
    return await this.tasks.bulkPut(tasksWithSync);
  }

  async bulkUpsertOrders(orders) {
    const ordersWithSync = orders.map(order => ({
      ...order,
      lastUpdated: order.lastUpdated || new Date().toISOString(),
      syncStatus: order.syncStatus || 'synced'
    }));
    return await this.orders.bulkPut(ordersWithSync);
  }

  // Get pending sync items
  async getPendingSyncItems() {
    const crops = await this.crops.where('syncStatus').equals('pending').toArray();
    const tasks = await this.tasks.where('syncStatus').equals('pending').toArray();
    const orders = await this.orders.where('syncStatus').equals('pending').toArray();
    const budwood = await this.budwoodCollection.where('syncStatus').equals('pending').toArray();
    const grafting = await this.graftingRecords.where('syncStatus').equals('pending').toArray();
    const transfers = await this.transferRecords.where('syncStatus').equals('pending').toArray();

    return {
      crops,
      tasks,
      orders,
      budwoodCollection: budwood,
      graftingRecords: grafting,
      transferRecords: transfers
    };
  }

  // Mark items as synced
  async markAsSynced(tableName, ids) {
    return await this[tableName].where('id').anyOf(ids).modify({
      syncStatus: 'synced'
    });
  }

  // Add to sync queue
  async addToSyncQueue(operation, tableName, recordId, data) {
    return await this.syncQueue.add({
      operation,
      tableName,
      recordId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
  }

  // Get sync queue
  async getSyncQueue() {
    return await this.syncQueue.orderBy('timestamp').toArray();
  }

  // Clear sync queue item
  async clearSyncQueueItem(id) {
    return await this.syncQueue.delete(id);
  }

  // Increment retry count
  async incrementRetryCount(id) {
    return await this.syncQueue.where('id').equals(id).modify(item => {
      item.retryCount = (item.retryCount || 0) + 1;
    });
  }

  // Get last sync timestamp
  async getLastSyncTimestamp() {
    const setting = await this.userSettings.get('lastSyncTimestamp');
    return setting?.value || null;
  }

  // Set last sync timestamp
  async setLastSyncTimestamp(timestamp) {
    return await this.userSettings.put({
      id: 'lastSyncTimestamp',
      key: 'lastSyncTimestamp',
      value: timestamp,
      lastUpdated: new Date().toISOString()
    });
  }

  // Clear all data (for logout)
  async clearAllData() {
    await this.crops.clear();
    await this.tasks.clear();
    await this.orders.clear();
    await this.budwoodCollection.clear();
    await this.graftingRecords.clear();
    await this.transferRecords.clear();
    await this.syncQueue.clear();
    await this.userSettings.clear();
  }

  // Export data for backup
  async exportData() {
    const crops = await this.crops.toArray();
    const tasks = await this.tasks.toArray();
    const orders = await this.orders.toArray();
    const budwood = await this.budwoodCollection.toArray();
    const grafting = await this.graftingRecords.toArray();
    const transfers = await this.transferRecords.toArray();
    const settings = await this.userSettings.toArray();

    return {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        crops,
        tasks,
        orders,
        budwoodCollection: budwood,
        graftingRecords: grafting,
        transferRecords: transfers,
        userSettings: settings
      }
    };
  }

  // Import data from backup
  async importData(backupData) {
    if (backupData.version !== 1) {
      throw new Error('Incompatible backup version');
    }

    const { data } = backupData;

    // Clear existing data
    await this.clearAllData();

    // Import data
    if (data.crops?.length) await this.bulkUpsertCrops(data.crops);
    if (data.tasks?.length) await this.bulkUpsertTasks(data.tasks);
    if (data.orders?.length) await this.bulkUpsertOrders(data.orders);
    if (data.budwoodCollection?.length) await this.budwoodCollection.bulkPut(data.budwoodCollection);
    if (data.graftingRecords?.length) await this.graftingRecords.bulkPut(data.graftingRecords);
    if (data.transferRecords?.length) await this.transferRecords.bulkPut(data.transferRecords);
    if (data.userSettings?.length) await this.userSettings.bulkPut(data.userSettings);
  }
}

// Create database instance
export const db = new CropPropagationDB();

// Database initialization
export const initializeDatabase = async () => {
  try {
    await db.open();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};

// Check if database is empty (first time setup)
export const isDatabaseEmpty = async () => {
  const cropCount = await db.crops.count();
  const taskCount = await db.tasks.count();
  const orderCount = await db.orders.count();
  const budwoodCount = await db.budwoodCollection.count();
  const graftingCount = await db.graftingRecords.count();
  const transferCount = await db.transferRecords.count();

  // Database is empty only if ALL tables are empty
  return cropCount === 0 && taskCount === 0 && orderCount === 0 &&
         budwoodCount === 0 && graftingCount === 0 && transferCount === 0;
};