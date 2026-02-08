// Mock API service for testing without real backend
export class MockFloraAPI {
  constructor() {
    this.delayMs = 500; // Simulate network delay
    this.isOnline = true; // Simulate online/offline

    // Initialize enhanced mock data with new features
    this.initializeEnhancedMockData();
  }

  initializeEnhancedMockData() {
    // Mock data with enhanced features
    this.mockData = {
      user: {
        id: 1,
        name: 'Demo User',
        email: 'demo@cropprop.com',
        role: 'manager'
      },
      crops: [
        {
          id: 1,
          name: 'Tomato Heritage',
          variety: 'Cherokee Purple',
          propagationMethod: 'seed',
          currentStage: 'germination',
          location: 'Greenhouse A - Tray 1',
          plantedDate: '2025-08-15',
          expectedGermination: '2025-08-25',
          temperature: 22,
          humidity: 75,
          watered: '2025-09-01',
          notes: 'Good germination rate, 85% sprouted',
          lastUpdated: '2025-09-15T10:00:00Z',
          syncStatus: 'synced'
        },
        {
          id: 2,
          name: 'Basil Sweet',
          variety: 'Genovese',
          propagationMethod: 'cutting',
          currentStage: 'rooting',
          location: 'Propagation Station B',
          plantedDate: '2025-08-20',
          expectedGermination: '2025-08-27',
          temperature: 24,
          humidity: 80,
          watered: '2025-09-02',
          notes: 'Strong root development',
          lastUpdated: '2025-09-15T10:00:00Z',
          syncStatus: 'synced'
        },
        {
          id: 3,
          name: 'Lettuce Buttercrunch',
          variety: 'Buttercrunch',
          propagationMethod: 'seed',
          currentStage: 'planted',
          location: 'Cold Frame 1',
          plantedDate: '2025-08-25',
          expectedGermination: '2025-09-05',
          temperature: 18,
          humidity: 70,
          watered: '2025-09-01',
          notes: 'Pre-germination stage',
          lastUpdated: '2025-09-15T10:00:00Z',
          syncStatus: 'synced'
        }
      ],
      tasks: [
        {
          id: 1,
          cropId: 1,
          task: 'Water seedlings',
          dueDate: '2025-09-16',
          completed: false,
          priority: 'high',
          lastUpdated: '2025-09-15T10:00:00Z',
          syncStatus: 'synced'
        },
        {
          id: 2,
          cropId: 2,
          task: 'Check root development',
          dueDate: '2025-09-17',
          completed: false,
          priority: 'medium',
          lastUpdated: '2025-09-15T10:00:00Z',
          syncStatus: 'synced'
        },
        {
          id: 3,
          cropId: 1,
          task: 'Transplant to larger pots',
          dueDate: '2025-09-20',
          completed: false,
          priority: 'medium',
          lastUpdated: '2025-09-15T10:00:00Z',
          syncStatus: 'synced'
        },
        {
          id: 4,
          cropId: 3,
          task: 'Monitor germination',
          dueDate: '2025-09-16',
          completed: false,
          priority: 'high',
          lastUpdated: '2025-09-15T10:00:00Z',
          syncStatus: 'synced'
        }
      ],
      orders: [
        {
          id: 'PO-2025-001',
          orderNumber: 'PO-2025-001',
          status: 'grafting_operation',
          currentSection: 'grafting',
          clientName: 'Green Valley Farms',
          contactPerson: 'John Smith',
          phone: '+1-555-0123',
          email: 'john@greenvalley.com',
          orderDate: '2025-08-15',
          requestedDelivery: '2025-10-15',
          totalQuantity: 500,
          completedQuantity: 125,
          currentStageQuantity: 100,
          cropType: 'Citrus',
          variety: 'Valencia Orange',
          propagationMethod: 'grafting',
          unitPrice: 12.50,
          totalValue: 6250,
          priority: 'high',
          notes: ['Premium rootstock required'],
          budwoodCalculation: {
            requiredBudwood: 600,
            wasteFactorPercent: 15,
            extraForSafety: 50,
            totalRequired: 740
          },
          workerAssignments: {
            budwoodCollector: 'John Smith',
            grafter: 'Alice Johnson',
            nurseryManager: 'Maria Garcia',
            qualityController: 'David Chen'
          },
          stageValidation: {
            currentStageComplete: false,
            readyForNextStage: false,
            blockers: [
              {
                type: 'worker',
                message: 'Grafter efficiency below target',
                severity: 'warning',
                action: 'Review grafting technique'
              }
            ]
          },
          stageHistory: [
            {
              stage: 'order_created',
              date: '2025-08-15',
              quantity: 500,
              operator: 'System',
              workerPerformance: null
            },
            {
              stage: 'budwood_collection',
              date: '2025-08-17',
              quantity: 500,
              operator: 'John Smith',
              workerPerformance: {
                timeInStage: 2,
                qualityScore: 95,
                efficiencyRating: 88
              }
            },
            {
              stage: 'grafting_setup',
              date: '2025-08-20',
              quantity: 450,
              operator: 'Alice Johnson',
              workerPerformance: {
                timeInStage: 1,
                qualityScore: 87,
                efficiencyRating: 82
              }
            }
          ],
          specifications: {
            rootstockType: 'Carrizo Citrange',
            containerSize: '3-gallon',
            heightRequirement: '18-24 inches',
            certifications: ['Organic', 'Disease-free']
          },
          lastUpdated: '2025-09-15T10:00:00Z',
          syncStatus: 'synced'
        }
      ],
      budwoodRecords: [
        {
          id: 'BW-001',
          orderId: 'PO-2025-001',
          motherTreeId: 'MT-A12',
          variety: 'Valencia Orange',
          harvestDate: '2025-08-16',
          quantity: 150,
          quality: 'A',
          operator: 'John Smith',
          storageLocation: 'Cold Room 1',
          notes: 'Excellent quality budwood from certified mother tree'
        }
      ],
      graftingRecords: [
        {
          id: 'GR-001',
          orderId: 'PO-2025-001',
          date: '2025-08-21',
          operator: 'Alice Johnson',
          technique: 'whip_and_tongue',
          quantity: 100,
          successRate: 87,
          environmentalConditions: {
            temperature: 22,
            humidity: 85,
            lightLevel: 1200
          },
          qualityNotes: 'Good union formation, proper technique applied'
        }
      ],
      transferRecords: [
        {
          id: 'TR-001',
          orderId: 'PO-2025-001',
          fromSection: 'budwood',
          toSection: 'grafting',
          fromStage: 'budwood_preparation',
          toStage: 'grafting_setup',
          quantity: 450,
          transferDate: '2025-08-20',
          operator: 'Alice Johnson',
          qualityScore: 92,
          notes: 'Smooth transition, all requirements met'
        }
      ]
    };
  }

  // Simulate network delay
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.delayMs));
  }

  // Simulate network errors
  simulateNetworkError() {
    if (!this.isOnline || Math.random() < 0.1) { // 10% chance of error
      throw new Error('Network error: Please check your connection');
    }
  }

  // Authentication endpoints
  async login(credentials) {
    await this.delay();
    this.simulateNetworkError();

    if (credentials.email === 'demo@cropprop.com' && credentials.password === 'demo123') {
      return {
        token: 'mock-jwt-token-' + Date.now(),
        user: this.mockData.user
      };
    } else {
      throw new Error('Invalid credentials');
    }
  }

  async register(userData) {
    await this.delay();
    this.simulateNetworkError();

    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: { ...this.mockData.user, ...userData }
    };
  }

  async refreshToken() {
    await this.delay();
    return {
      token: 'mock-jwt-token-' + Date.now()
    };
  }

  async getCurrentUser() {
    await this.delay();
    return this.mockData.user;
  }

  // Crop management endpoints
  async getAllCrops() {
    await this.delay();
    this.simulateNetworkError();
    return [...this.mockData.crops];
  }

  async getCrops(since = null) {
    await this.delay();
    this.simulateNetworkError();

    if (since) {
      const sinceDate = new Date(since);
      return this.mockData.crops.filter(crop => new Date(crop.lastUpdated) > sinceDate);
    }

    return [...this.mockData.crops];
  }

  async getCrop(id) {
    await this.delay();
    this.simulateNetworkError();

    const crop = this.mockData.crops.find(c => c.id === parseInt(id));
    if (!crop) throw new Error('Crop not found');
    return crop;
  }

  async createCrop(cropData) {
    await this.delay();
    this.simulateNetworkError();

    const newCrop = {
      ...cropData,
      id: Math.max(...this.mockData.crops.map(c => c.id)) + 1,
      lastUpdated: new Date().toISOString(),
      syncStatus: 'synced'
    };

    this.mockData.crops.push(newCrop);
    return newCrop;
  }

  async updateCrop(id, cropData) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.crops.findIndex(c => c.id === parseInt(id));
    if (index === -1) throw new Error('Crop not found');

    this.mockData.crops[index] = {
      ...this.mockData.crops[index],
      ...cropData,
      lastUpdated: new Date().toISOString()
    };

    return this.mockData.crops[index];
  }

  async deleteCrop(id) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.crops.findIndex(c => c.id === parseInt(id));
    if (index === -1) throw new Error('Crop not found');

    this.mockData.crops.splice(index, 1);
    return { success: true };
  }

  // Task management endpoints
  async getAllTasks() {
    await this.delay();
    this.simulateNetworkError();
    return [...this.mockData.tasks];
  }

  async getTasks(since = null) {
    await this.delay();
    this.simulateNetworkError();

    if (since) {
      const sinceDate = new Date(since);
      return this.mockData.tasks.filter(task => new Date(task.lastUpdated) > sinceDate);
    }

    return [...this.mockData.tasks];
  }

  async getTask(id) {
    await this.delay();
    this.simulateNetworkError();

    const task = this.mockData.tasks.find(t => t.id === parseInt(id));
    if (!task) throw new Error('Task not found');
    return task;
  }

  async createTask(taskData) {
    await this.delay();
    this.simulateNetworkError();

    const newTask = {
      ...taskData,
      id: Math.max(...this.mockData.tasks.map(t => t.id)) + 1,
      lastUpdated: new Date().toISOString(),
      syncStatus: 'synced'
    };

    this.mockData.tasks.push(newTask);
    return newTask;
  }

  async updateTask(id, taskData) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.tasks.findIndex(t => t.id === parseInt(id));
    if (index === -1) throw new Error('Task not found');

    this.mockData.tasks[index] = {
      ...this.mockData.tasks[index],
      ...taskData,
      lastUpdated: new Date().toISOString()
    };

    return this.mockData.tasks[index];
  }

  async deleteTask(id) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.tasks.findIndex(t => t.id === parseInt(id));
    if (index === -1) throw new Error('Task not found');

    this.mockData.tasks.splice(index, 1);
    return { success: true };
  }

  // Order management endpoints
  async getAllOrders() {
    await this.delay();
    this.simulateNetworkError();
    return [...this.mockData.orders];
  }

  async getOrders(since = null) {
    await this.delay();
    this.simulateNetworkError();

    if (since) {
      const sinceDate = new Date(since);
      return this.mockData.orders.filter(order => new Date(order.lastUpdated) > sinceDate);
    }

    return [...this.mockData.orders];
  }

  async getOrder(id) {
    await this.delay();
    this.simulateNetworkError();

    const order = this.mockData.orders.find(o => o.id === id);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async createOrder(orderData) {
    await this.delay();
    this.simulateNetworkError();

    const newOrder = {
      ...orderData,
      id: `PO-2025-${String(this.mockData.orders.length + 1).padStart(3, '0')}`,
      lastUpdated: new Date().toISOString(),
      syncStatus: 'synced'
    };

    this.mockData.orders.push(newOrder);
    return newOrder;
  }

  async updateOrder(id, orderData) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');

    this.mockData.orders[index] = {
      ...this.mockData.orders[index],
      ...orderData,
      lastUpdated: new Date().toISOString()
    };

    return this.mockData.orders[index];
  }

  async updateOrderStatus(id, status) {
    await this.delay();
    return this.updateOrder(id, { status });
  }

  async deleteOrder(id) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');

    this.mockData.orders.splice(index, 1);
    return { success: true };
  }

  // Budwood and other endpoints (placeholder implementations)
  async getAllBudwoodRecords() {
    await this.delay();
    return [];
  }

  async getBudwoodRecords() {
    await this.delay();
    return [];
  }

  async createBudwoodRecord(data) {
    await this.delay();
    return { ...data, id: 'BW-' + Date.now() };
  }

  async getAllGraftingRecords() {
    await this.delay();
    return [];
  }

  async getGraftingRecords() {
    await this.delay();
    return [];
  }

  async createGraftingRecord(data) {
    await this.delay();
    return { ...data, id: 'GR-' + Date.now() };
  }

  async getAllTransferRecords() {
    await this.delay();
    return [];
  }

  async getTransferRecords() {
    await this.delay();
    return [];
  }

  async createTransferRecord(data) {
    await this.delay();
    return { ...data, id: 'TR-' + Date.now() };
  }

  // Analytics endpoints
  async getDashboardStats() {
    await this.delay();
    return {
      totalCrops: this.mockData.crops.length,
      totalTasks: this.mockData.tasks.length,
      pendingTasks: this.mockData.tasks.filter(t => !t.completed).length,
      totalRevenue: this.mockData.orders.reduce((sum, o) => sum + (o.totalValue || 0), 0)
    };
  }

  async getPerformanceMetrics() {
    await this.delay();
    return {
      successRate: 87,
      averageGrowthTime: 14,
      productivity: 92
    };
  }

  // Health check
  async healthCheck() {
    await this.delay();
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Enhanced propagation order methods
  async transferOrderToNextStage(orderId, transferData) {
    await this.delay();
    this.simulateNetworkError();

    const order = this.mockData.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // Create transfer record
    const transferRecord = {
      id: `TR-${Date.now()}`,
      orderId,
      ...transferData,
      transferDate: new Date().toISOString().split('T')[0]
    };

    this.mockData.transferRecords.push(transferRecord);

    // Update order with new stage history
    const updatedOrder = {
      ...order,
      currentStageQuantity: parseInt(transferData.quantity),
      stageHistory: [...order.stageHistory, {
        stage: transferData.toStage,
        date: new Date().toISOString().split('T')[0],
        quantity: parseInt(transferData.quantity),
        operator: transferData.operator,
        workerPerformance: {
          timeInStage: Math.floor(Math.random() * 7) + 1,
          qualityScore: parseInt(transferData.qualityScore) || 85,
          efficiencyRating: Math.floor(Math.random() * 20) + 80
        }
      }],
      lastUpdated: new Date().toISOString()
    };

    await this.updateOrder(orderId, updatedOrder);
    return { success: true, transferRecord };
  }

  async recordHealthAssessment(orderId, healthData) {
    await this.delay();
    this.simulateNetworkError();

    const order = this.mockData.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const lostQty = parseInt(healthData.lostQuantity);
    const newQty = order.currentStageQuantity - lostQty;

    const updatedOrder = {
      ...order,
      currentStageQuantity: Math.max(0, newQty),
      notes: [...(order.notes || []), {
        type: 'health_assessment',
        date: new Date().toISOString().split('T')[0],
        lost: lostQty,
        notes: healthData.notes,
        operator: healthData.operator
      }],
      lastUpdated: new Date().toISOString()
    };

    await this.updateOrder(orderId, updatedOrder);
    return { success: true };
  }

  async validateStage(orderId) {
    await this.delay();
    this.simulateNetworkError();

    const order = this.mockData.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // Mock validation logic
    const validation = {
      currentStageComplete: Math.random() > 0.3,
      readyForNextStage: Math.random() > 0.4,
      blockers: []
    };

    if (!validation.readyForNextStage) {
      validation.blockers.push({
        type: 'timing',
        message: 'Stage minimum duration not met',
        severity: 'warning',
        action: 'Allow more time for proper development'
      });
    }

    return validation;
  }

  async resolveBlocker(orderId, blockerData) {
    await this.delay();
    this.simulateNetworkError();

    const order = this.mockData.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // Remove the blocker and update validation
    const updatedValidation = {
      ...order.stageValidation,
      blockers: order.stageValidation.blockers.filter(b => b.message !== blockerData.message),
      currentStageComplete: true,
      readyForNextStage: true
    };

    await this.updateOrder(orderId, { stageValidation: updatedValidation });
    return { success: true };
  }

  // Enhanced budwood methods
  async getAllBudwoodRecords() {
    await this.delay();
    this.simulateNetworkError();
    return [...this.mockData.budwoodRecords];
  }

  async getBudwoodRecords(since = null) {
    await this.delay();
    this.simulateNetworkError();

    if (since) {
      const sinceDate = new Date(since);
      return this.mockData.budwoodRecords.filter(record => new Date(record.harvestDate) > sinceDate);
    }

    return [...this.mockData.budwoodRecords];
  }

  async getBudwoodRecord(id) {
    await this.delay();
    this.simulateNetworkError();

    const record = this.mockData.budwoodRecords.find(r => r.id === id);
    if (!record) throw new Error('Budwood record not found');
    return record;
  }

  async createBudwoodRecord(recordData) {
    await this.delay();
    this.simulateNetworkError();

    const newRecord = {
      ...recordData,
      id: `BW-${Date.now()}`,
      harvestDate: recordData.harvestDate || new Date().toISOString().split('T')[0]
    };

    this.mockData.budwoodRecords.push(newRecord);
    return newRecord;
  }

  async updateBudwoodRecord(id, recordData) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.budwoodRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Budwood record not found');

    this.mockData.budwoodRecords[index] = {
      ...this.mockData.budwoodRecords[index],
      ...recordData
    };

    return this.mockData.budwoodRecords[index];
  }

  async deleteBudwoodRecord(id) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.budwoodRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Budwood record not found');

    this.mockData.budwoodRecords.splice(index, 1);
    return { success: true };
  }

  async calculateBudwoodRequirements(orderData) {
    await this.delay();
    this.simulateNetworkError();

    const budwoodRatios = {
      grafting: 1.2,
      cutting: 2.0,
      tissue_culture: 0.1
    };

    const ratio = budwoodRatios[orderData.propagationMethod] || 1.2;
    const required = Math.ceil(orderData.quantity * ratio);
    const wasteFactor = 1 + ((orderData.wasteFactorPercent || 15) / 100);
    const total = Math.ceil(required * wasteFactor) + (orderData.extraForSafety || 0);

    return {
      requiredBudwood: required,
      wasteFactorPercent: orderData.wasteFactorPercent || 15,
      extraForSafety: orderData.extraForSafety || 0,
      totalRequired: total
    };
  }

  // Enhanced grafting methods
  async getAllGraftingRecords() {
    await this.delay();
    this.simulateNetworkError();
    return [...this.mockData.graftingRecords];
  }

  async getGraftingRecords(since = null) {
    await this.delay();
    this.simulateNetworkError();

    if (since) {
      const sinceDate = new Date(since);
      return this.mockData.graftingRecords.filter(record => new Date(record.date) > sinceDate);
    }

    return [...this.mockData.graftingRecords];
  }

  async getGraftingRecord(id) {
    await this.delay();
    this.simulateNetworkError();

    const record = this.mockData.graftingRecords.find(r => r.id === id);
    if (!record) throw new Error('Grafting record not found');
    return record;
  }

  async createGraftingRecord(recordData) {
    await this.delay();
    this.simulateNetworkError();

    const newRecord = {
      ...recordData,
      id: `GR-${Date.now()}`,
      date: recordData.date || new Date().toISOString().split('T')[0],
      quantity: parseInt(recordData.quantity || 0),
      successRate: parseFloat(recordData.successRate || 0)
    };

    this.mockData.graftingRecords.push(newRecord);
    return newRecord;
  }

  async updateGraftingRecord(id, recordData) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.graftingRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Grafting record not found');

    this.mockData.graftingRecords[index] = {
      ...this.mockData.graftingRecords[index],
      ...recordData,
      quantity: parseInt(recordData.quantity || this.mockData.graftingRecords[index].quantity),
      successRate: parseFloat(recordData.successRate || this.mockData.graftingRecords[index].successRate)
    };

    return this.mockData.graftingRecords[index];
  }

  async deleteGraftingRecord(id) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.graftingRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Grafting record not found');

    this.mockData.graftingRecords.splice(index, 1);
    return { success: true };
  }

  async getGraftingPerformanceByOperator(operatorId, timeFrame = 'month') {
    await this.delay();
    this.simulateNetworkError();

    const records = this.mockData.graftingRecords.filter(r => r.operator === operatorId);
    const totalGrafted = records.reduce((sum, r) => sum + r.quantity, 0);
    const avgSuccessRate = records.length > 0
      ? records.reduce((sum, r) => sum + r.successRate, 0) / records.length
      : 0;

    return {
      operator: operatorId,
      timeFrame,
      totalGrafted,
      totalSessions: records.length,
      averageSuccessRate: Math.round(avgSuccessRate),
      records
    };
  }

  // Enhanced transfer methods
  async getAllTransferRecords() {
    await this.delay();
    this.simulateNetworkError();
    return [...this.mockData.transferRecords];
  }

  async getTransferRecords(since = null) {
    await this.delay();
    this.simulateNetworkError();

    if (since) {
      const sinceDate = new Date(since);
      return this.mockData.transferRecords.filter(record => new Date(record.transferDate) > sinceDate);
    }

    return [...this.mockData.transferRecords];
  }

  async getTransferRecord(id) {
    await this.delay();
    this.simulateNetworkError();

    const record = this.mockData.transferRecords.find(r => r.id === id);
    if (!record) throw new Error('Transfer record not found');
    return record;
  }

  async createTransferRecord(recordData) {
    await this.delay();
    this.simulateNetworkError();

    const newRecord = {
      ...recordData,
      id: `TR-${Date.now()}`,
      transferDate: recordData.transferDate || new Date().toISOString().split('T')[0]
    };

    this.mockData.transferRecords.push(newRecord);
    return newRecord;
  }

  async updateTransferRecord(id, recordData) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.transferRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Transfer record not found');

    this.mockData.transferRecords[index] = {
      ...this.mockData.transferRecords[index],
      ...recordData
    };

    return this.mockData.transferRecords[index];
  }

  async deleteTransferRecord(id) {
    await this.delay();
    this.simulateNetworkError();

    const index = this.mockData.transferRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Transfer record not found');

    this.mockData.transferRecords.splice(index, 1);
    return { success: true };
  }

  // Enhanced analytics methods
  async getDashboardStats() {
    await this.delay();
    this.simulateNetworkError();

    return {
      totalOrders: this.mockData.orders.length,
      activeOrders: this.mockData.orders.filter(o => o.status !== 'dispatched').length,
      totalPlants: this.mockData.orders.reduce((sum, o) => sum + o.currentStageQuantity, 0),
      completedOrders: this.mockData.orders.filter(o => o.status === 'dispatched').length,
      avgSuccessRate: this.mockData.graftingRecords.length > 0
        ? this.mockData.graftingRecords.reduce((sum, r) => sum + r.successRate, 0) / this.mockData.graftingRecords.length
        : 0
    };
  }

  async getPerformanceMetrics(dateRange = '30d') {
    await this.delay();
    this.simulateNetworkError();

    const operators = {};
    this.mockData.graftingRecords.forEach(record => {
      if (!operators[record.operator]) {
        operators[record.operator] = { totalGrafted: 0, totalSuccessRate: 0, count: 0 };
      }
      operators[record.operator].totalGrafted += record.quantity;
      operators[record.operator].totalSuccessRate += record.successRate;
      operators[record.operator].count++;
    });

    return Object.entries(operators).map(([name, data]) => ({
      operator: name,
      totalGrafted: data.totalGrafted,
      averageSuccessRate: Math.round(data.totalSuccessRate / data.count),
      productivity: Math.round((data.totalGrafted / data.count) * 10)
    }));
  }

  async getSuccessRateAnalysis() {
    await this.delay();
    this.simulateNetworkError();

    const stageSuccessRates = {};
    this.mockData.orders.forEach(order => {
      order.stageHistory.forEach(stage => {
        if (!stageSuccessRates[stage.stage]) {
          stageSuccessRates[stage.stage] = { entered: 0, survived: 0 };
        }
        stageSuccessRates[stage.stage].entered += stage.quantity;
        if (stage.workerPerformance) {
          stageSuccessRates[stage.stage].survived += Math.round(stage.quantity * (stage.workerPerformance.qualityScore / 100));
        }
      });
    });

    return Object.entries(stageSuccessRates).map(([stage, data]) => ({
      stage,
      successRate: data.entered > 0 ? Math.round((data.survived / data.entered) * 100) : 100,
      plantsEntered: data.entered,
      plantsSurvived: data.survived
    }));
  }

  async getWorkerPerformanceAnalytics(timeFrame = 'month') {
    return await this.getPerformanceMetrics(timeFrame);
  }

  async getSurvivalRateAnalytics() {
    return await this.getSuccessRateAnalysis();
  }

  async getVarietyAnalytics() {
    await this.delay();
    this.simulateNetworkError();

    const varieties = {};
    this.mockData.orders.forEach(order => {
      if (!varieties[order.variety]) {
        varieties[order.variety] = {
          name: order.variety,
          orders: 0,
          totalQuantity: 0,
          completedQuantity: 0,
          revenue: 0
        };
      }
      const variety = varieties[order.variety];
      variety.orders++;
      variety.totalQuantity += order.totalQuantity;
      variety.completedQuantity += order.completedQuantity || 0;
      variety.revenue += order.totalValue || 0;
    });

    return Object.values(varieties);
  }

  async getDispatchAnalytics() {
    await this.delay();
    this.simulateNetworkError();

    const dispatched = this.mockData.orders.filter(o => o.status === 'dispatched');
    return {
      totalDispatched: dispatched.length,
      onTimeDeliveries: Math.floor(dispatched.length * 0.85),
      averageDispatchTime: 45,
      readyForDispatch: this.mockData.orders.filter(o => o.status === 'pre_dispatch').length
    };
  }

  async getCostAnalytics() {
    await this.delay();
    this.simulateNetworkError();

    const totalRevenue = this.mockData.orders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
    const estimatedCosts = totalRevenue * 0.65; // 65% cost ratio

    return {
      totalRevenue,
      estimatedCosts,
      profitMargin: Math.round(((totalRevenue - estimatedCosts) / totalRevenue) * 100),
      costPerPlant: Math.round(estimatedCosts / this.mockData.orders.reduce((sum, o) => sum + o.currentStageQuantity, 0))
    };
  }

  async getWorkflowEfficiencyAnalytics() {
    await this.delay();
    this.simulateNetworkError();

    return {
      averageStageTime: 5.2,
      bottlenecks: [
        { stage: 'grafting_operation', avgTime: 7, severity: 'medium' },
        { stage: 'post_graft_care', avgTime: 12, severity: 'high' }
      ],
      efficiency: 82
    };
  }

  // Control methods for testing
  setOnlineStatus(online) {
    this.isOnline = online;
  }

  setDelay(ms) {
    this.delayMs = ms;
  }

  reset() {
    // Reset to initial data state
    this.mockData.crops = [
      {
        id: 1,
        name: 'Tomato Heritage',
        variety: 'Cherokee Purple',
        propagationMethod: 'seed',
        currentStage: 'germination',
        location: 'Greenhouse A - Tray 1',
        plantedDate: '2025-08-15',
        expectedGermination: '2025-08-25',
        temperature: 22,
        humidity: 75,
        watered: '2025-09-01',
        notes: 'Good germination rate, 85% sprouted',
        lastUpdated: '2025-09-15T10:00:00Z',
        syncStatus: 'synced'
      }
    ];
  }
}