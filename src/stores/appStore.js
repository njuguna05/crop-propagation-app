import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { db, initializeDatabase, isDatabaseEmpty } from '../services/database';
import { syncService } from '../services/syncService';
import { floraAPI } from '../services/floraAPI';

// Main application store with offline-first capabilities
export const useAppStore = create(
  persist(
    subscribeWithSelector((set, get) => ({
      // Connection and sync status
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      syncStatus: 'idle', // 'idle', 'syncing', 'success', 'error'
      syncError: null,

      // Authentication state
      user: null,
      isAuthenticated: false,
      authToken: null,

      // App initialization state
      isInitialized: false,
      isLoading: false,

      // Data state (loaded from IndexedDB)
      crops: [],
      tasks: [],
      orders: [],
      budwoodCollection: [],
      graftingRecords: [],
      transferRecords: [],

      // UI state
      activeTab: 'dashboard',
      selectedCrop: null,
      selectedOrder: null,
      searchTerm: '',
      filterStatus: 'all',
      filterSection: 'all',

      // Modal states
      showNewOrder: false,
      showNewCrop: false,
      showTransferModal: false,
      showHealthModal: false,
      showBudwoodModal: false,
      showGraftingModal: false,

      // Actions
      setOnlineStatus: (online) => set({ isOnline: online }),

      setSyncStatus: (status, error = null) => set({
        syncStatus: status,
        syncError: error,
        isSyncing: status === 'syncing'
      }),

      setLastSyncTime: (time) => set({ lastSyncTime: time }),

      // Authentication actions
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await floraAPI.login(credentials);
          set({
            user: response.user,
            isAuthenticated: true,
            authToken: response.token,
            isLoading: false
          });

          // Initialize database and sync after login
          await get().initializeApp();

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        floraAPI.logout();
        await db.clearAllData();
        set({
          user: null,
          isAuthenticated: false,
          authToken: null,
          crops: [],
          tasks: [],
          orders: [],
          budwoodCollection: [],
          graftingRecords: [],
          transferRecords: [],
          isInitialized: false
        });
      },

      // App initialization
      initializeApp: async () => {
        set({ isLoading: true });
        try {
          // Initialize database
          await initializeDatabase();

          // Load data from IndexedDB
          await get().loadLocalData();

          // Check if database is empty and user is authenticated
          if (get().isAuthenticated && await isDatabaseEmpty()) {
            // First time login, sync data from server
            await syncService.forceSyncFromServer();
            await get().loadLocalData();
          } else if (get().isAuthenticated && get().isOnline) {
            // Regular sync
            syncService.startSync();
          }

          set({ isInitialized: true, isLoading: false });
        } catch (error) {
          console.error('App initialization failed:', error);
          set({ isLoading: false });
        }
      },

      // Load data from IndexedDB
      loadLocalData: async () => {
        try {
          const [crops, tasks, orders, budwood, grafting, transfers] = await Promise.all([
            db.crops.orderBy('lastUpdated').reverse().toArray(),
            db.tasks.orderBy('dueDate').toArray(),
            db.orders.orderBy('orderDate').reverse().toArray(),
            db.budwoodCollection.orderBy('harvestDate').reverse().toArray(),
            db.graftingRecords.orderBy('date').reverse().toArray(),
            db.transferRecords.orderBy('transferDate').reverse().toArray()
          ]);

          set({
            crops,
            tasks,
            orders,
            budwoodCollection: budwood,
            graftingRecords: grafting,
            transferRecords: transfers
          });
        } catch (error) {
          console.error('Failed to load local data:', error);
        }
      },

      // Crop management actions
      addCrop: async (cropData) => {
        const crop = {
          ...cropData,
          id: Date.now(), // Temporary ID
          plantedDate: new Date().toISOString().split('T')[0],
          expectedGermination: new Date(Date.now() + 10*24*60*60*1000).toISOString().split('T')[0],
          currentStage: 'planted',
          temperature: 20,
          humidity: 65,
          watered: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        };

        // Add to IndexedDB
        const id = await db.crops.add(crop);
        crop.id = id;

        // Update state
        set(state => ({ crops: [crop, ...state.crops] }));

        // Sync if online
        if (get().isOnline) {
          syncService.startSync();
        }

        return crop;
      },

      updateCrop: async (id, updates) => {
        // Update in IndexedDB
        await db.crops.update(id, {
          ...updates,
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        });

        // Update state
        set(state => ({
          crops: state.crops.map(crop =>
            crop.id === id ? { ...crop, ...updates } : crop
          )
        }));

        // Sync if online
        if (get().isOnline) {
          syncService.startSync();
        }
      },

      deleteCrop: async (id) => {
        await db.crops.delete(id);
        set(state => ({
          crops: state.crops.filter(crop => crop.id !== id)
        }));

        // Add to sync queue for deletion
        if (get().isOnline) {
          syncService.startSync();
        }
      },

      // Task management actions
      addTask: async (taskData) => {
        const task = {
          ...taskData,
          id: Date.now(),
          completed: false,
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        };

        const id = await db.tasks.add(task);
        task.id = id;

        set(state => ({ tasks: [...state.tasks, task] }));

        if (get().isOnline) {
          syncService.startSync();
        }

        return task;
      },

      updateTask: async (id, updates) => {
        await db.tasks.update(id, {
          ...updates,
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        });

        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, ...updates } : task
          )
        }));

        if (get().isOnline) {
          syncService.startSync();
        }
      },

      toggleTask: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (task) {
          await get().updateTask(id, { completed: !task.completed });
        }
      },

      deleteTask: async (id) => {
        await db.tasks.delete(id);
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== id)
        }));

        if (get().isOnline) {
          syncService.startSync();
        }
      },

      // Order management actions
      addOrder: async (orderData) => {
        const order = {
          ...orderData,
          id: `PO-${new Date().getFullYear()}-${String(get().orders.length + 1).padStart(3, '0')}`,
          orderNumber: `PO-${new Date().getFullYear()}-${String(get().orders.length + 1).padStart(3, '0')}`,
          status: 'order_created',
          currentSection: null,
          orderDate: new Date().toISOString().split('T')[0],
          totalQuantity: parseInt(orderData.quantity),
          completedQuantity: 0,
          currentStageQuantity: parseInt(orderData.quantity),
          totalValue: parseFloat(orderData.quantity) * parseFloat(orderData.unitPrice || 0),
          stageHistory: [{
            stage: 'order_created',
            date: new Date().toISOString().split('T')[0],
            quantity: parseInt(orderData.quantity),
            operator: 'System'
          }],
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        };

        await db.orders.add(order);
        set(state => ({ orders: [order, ...state.orders] }));

        if (get().isOnline) {
          syncService.startSync();
        }

        return order;
      },

      updateOrder: async (id, updates) => {
        await db.orders.update(id, {
          ...updates,
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        });

        set(state => ({
          orders: state.orders.map(order =>
            order.id === id ? { ...order, ...updates } : order
          )
        }));

        if (get().isOnline) {
          syncService.startSync();
        }
      },

      // Transfer order between stages
      transferOrder: async (orderId, transferData) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return;

        // Create transfer record
        const transferRecord = {
          id: `TR-${Date.now()}`,
          orderId: orderId,
          fromSection: transferData.fromSection,
          toSection: transferData.toSection,
          fromStage: order.status,
          toStage: transferData.toStage,
          quantity: parseInt(transferData.quantity),
          transferDate: new Date().toISOString().split('T')[0],
          operator: transferData.operator,
          qualityScore: parseFloat(transferData.qualityScore),
          notes: transferData.notes,
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        };

        await db.transferRecords.add(transferRecord);

        // Update order
        const updatedOrder = {
          ...order,
          status: transferData.toStage,
          currentSection: transferData.toSection,
          currentStageQuantity: parseInt(transferData.quantity),
          stageHistory: [...order.stageHistory, {
            stage: transferData.toStage,
            date: new Date().toISOString().split('T')[0],
            quantity: parseInt(transferData.quantity),
            operator: transferData.operator,
            notes: transferData.notes
          }],
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        };

        await db.orders.update(orderId, updatedOrder);

        set(state => ({
          orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
          transferRecords: [transferRecord, ...state.transferRecords]
        }));

        if (get().isOnline) {
          syncService.startSync();
        }
      },

      // Record health assessment (plant losses)
      recordHealthAssessment: async (orderId, healthData) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return;

        const lostQty = parseInt(healthData.lostQuantity);
        const newQty = order.currentStageQuantity - lostQty;

        const updatedOrder = {
          ...order,
          currentStageQuantity: newQty > 0 ? newQty : 0,
          notes: [...(order.notes || []), {
            type: 'health_assessment',
            date: new Date().toISOString().split('T')[0],
            lost: lostQty,
            notes: healthData.notes,
            stage: order.status
          }],
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        };

        await db.orders.update(orderId, updatedOrder);

        set(state => ({
          orders: state.orders.map(o => o.id === orderId ? updatedOrder : o)
        }));

        if (get().isOnline) {
          syncService.startSync();
        }
      },

      // Add budwood collection record
      addBudwoodRecord: async (recordData) => {
        const record = {
          ...recordData,
          id: `BW-${Date.now()}`,
          harvestDate: recordData.harvestDate || new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        };

        await db.budwoodCollection.add(record);
        set(state => ({ budwoodCollection: [record, ...state.budwoodCollection] }));

        if (get().isOnline) {
          syncService.startSync();
        }

        return record;
      },

      // Add grafting record
      addGraftingRecord: async (recordData) => {
        const record = {
          ...recordData,
          id: `GR-${Date.now()}`,
          quantity: parseInt(recordData.quantity || 0),
          successRate: parseFloat(recordData.successRate || 0),
          lastUpdated: new Date().toISOString(),
          syncStatus: 'pending'
        };

        await db.graftingRecords.add(record);
        set(state => ({ graftingRecords: [record, ...state.graftingRecords] }));

        if (get().isOnline) {
          syncService.startSync();
        }

        return record;
      },

      // UI state actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedCrop: (crop) => set({ selectedCrop: crop }),
      setSelectedOrder: (order) => set({ selectedOrder: order }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterSection: (section) => set({ filterSection: section }),

      // Modal actions
      setShowNewOrder: (show) => set({ showNewOrder: show }),
      setShowNewCrop: (show) => set({ showNewCrop: show }),
      setShowTransferModal: (show) => set({ showTransferModal: show }),
      setShowHealthModal: (show) => set({ showHealthModal: show }),
      setShowBudwoodModal: (show) => set({ showBudwoodModal: show }),
      setShowGraftingModal: (show) => set({ showGraftingModal: show }),

      // Filtered data selectors
      getFilteredCrops: () => {
        const { crops, searchTerm } = get();
        return crops.filter(crop =>
          crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crop.variety.toLowerCase().includes(searchTerm.toLowerCase())
        );
      },

      getFilteredOrders: () => {
        const { orders, searchTerm, filterStatus, filterSection } = get();
        return orders.filter(order => {
          const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               order.variety.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
          const matchesSection = filterSection === 'all' || order.currentSection === filterSection;
          return matchesSearch && matchesStatus && matchesSection;
        });
      },

      getPendingTasks: () => {
        const { tasks } = get();
        return tasks.filter(task => !task.completed);
      },

      getTodaysTasks: () => {
        const { tasks } = get();
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task => task.dueDate === today && !task.completed);
      },

      // Statistics
      getStageStats: () => {
        const { crops } = get();
        return crops.reduce((acc, crop) => {
          acc[crop.currentStage] = (acc[crop.currentStage] || 0) + 1;
          return acc;
        }, {});
      },

      getDashboardStats: () => {
        const { crops, tasks, orders } = get();
        const pendingTasks = tasks.filter(t => !t.completed).length;
        const totalRevenue = orders.reduce((acc, order) => acc + (order.totalValue || 0), 0);
        const activePlants = orders.reduce((acc, order) => acc + order.currentStageQuantity, 0);

        return {
          totalCrops: crops.length,
          pendingTasks,
          totalRevenue,
          activePlants
        };
      }
    })),
    {
      name: 'crop-propagation-store',
      partialize: (state) => ({
        // Only persist UI preferences and user data
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
        activeTab: state.activeTab,
        lastSyncTime: state.lastSyncTime
      })
    }
  )
);

// Setup sync service listeners
syncService.addSyncListener((event) => {
  const store = useAppStore.getState();

  switch (event.type) {
    case 'online':
      store.setOnlineStatus(true);
      break;
    case 'offline':
      store.setOnlineStatus(false);
      break;
    case 'sync_start':
      store.setSyncStatus('syncing');
      break;
    case 'sync_complete':
      store.setSyncStatus('success');
      store.setLastSyncTime(new Date().toISOString());
      store.loadLocalData(); // Refresh data from IndexedDB
      break;
    case 'sync_error':
      store.setSyncStatus('error', event.error);
      break;
    case 'full_sync_complete':
      store.setSyncStatus('success');
      store.setLastSyncTime(new Date().toISOString());
      store.loadLocalData();
      break;
    default:
      console.warn('Unknown sync event type:', event.type);
      break;
  }
});