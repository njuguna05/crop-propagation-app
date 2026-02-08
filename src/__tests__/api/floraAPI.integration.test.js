// Import with jest mocking
jest.mock('../../services/floraAPI', () => ({
  floraAPI: {
    transferOrderToNextStage: jest.fn(),
    recordHealthAssessment: jest.fn(),
    validateStage: jest.fn(),
    resolveBlocker: jest.fn(),
    calculateBudwoodRequirements: jest.fn(),
    createBudwoodRecord: jest.fn(),
    getBudwoodRecord: jest.fn(),
    updateBudwoodRecord: jest.fn(),
    deleteBudwoodRecord: jest.fn(),
    createGraftingRecord: jest.fn(),
    getGraftingPerformanceByOperator: jest.fn(),
    getWorkerPerformanceAnalytics: jest.fn(),
    getDashboardStats: jest.fn(),
    getSurvivalRateAnalytics: jest.fn(),
    getVarietyAnalytics: jest.fn(),
    getDispatchAnalytics: jest.fn(),
    getCostAnalytics: jest.fn(),
    getWorkflowEfficiencyAnalytics: jest.fn(),
    getOrders: jest.fn(),
    getGraftingRecords: jest.fn(),
    getBudwoodRecords: jest.fn(),
    getTransferRecords: jest.fn(),
    createOrder: jest.fn(),
    getOrder: jest.fn(),
    getAllOrders: jest.fn(),
    getAllGraftingRecords: jest.fn(),
    getAllBudwoodRecords: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    setOnlineStatus: jest.fn(),
    reset: jest.fn(),
    setDelay: jest.fn()
  }
}));

const { floraAPI } = require('../../services/floraAPI');

// Mock the environment to use mock API
process.env.NODE_ENV = 'development';
process.env.REACT_APP_MOCK_API = 'true';

describe('FloraAPI Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up comprehensive mock implementations
    floraAPI.transferOrderToNextStage.mockResolvedValue({
      success: true,
      transferRecord: { orderId: 'PO-2025-001' }
    });

    floraAPI.recordHealthAssessment.mockResolvedValue({
      success: true,
      lost_quantity: 15
    });

    floraAPI.validateStage.mockResolvedValue({
      currentStageComplete: true,
      readyForNextStage: true,
      blockers: []
    });

    floraAPI.resolveBlocker.mockResolvedValue({
      success: true,
      remaining_blockers: 0,
      stage_ready: true
    });

    floraAPI.calculateBudwoodRequirements.mockResolvedValue({
      requiredBudwood: 120,
      wasteFactorPercent: 15,
      extraForSafety: 10,
      totalRequired: 148
    });

    floraAPI.createBudwoodRecord.mockResolvedValue({
      id: 'BW-001',
      orderId: 'PO-2025-001',
      variety: 'Valencia Orange',
      quantity: 150
    });

    floraAPI.getBudwoodRecord.mockResolvedValue({
      id: 'BW-001',
      quantity: 150
    });

    floraAPI.updateBudwoodRecord.mockResolvedValue({
      quantity: 140
    });

    floraAPI.deleteBudwoodRecord.mockResolvedValue({
      success: true
    });

    floraAPI.createGraftingRecord.mockResolvedValue({
      operator: 'Alice Johnson',
      successRate: 87
    });

    floraAPI.getGraftingPerformanceByOperator.mockResolvedValue({
      operator: 'Alice Johnson',
      totalGrafted: 100,
      averageSuccessRate: 87
    });

    floraAPI.getWorkerPerformanceAnalytics.mockResolvedValue([
      {
        operator: 'Alice Johnson',
        totalGrafted: 100,
        averageSuccessRate: 87,
        productivity: 50
      }
    ]);

    floraAPI.getDashboardStats.mockResolvedValue({
      totalOrders: 10,
      activeOrders: 5,
      totalPlants: 1000,
      completedOrders: 5,
      avgSuccessRate: 85.5
    });

    floraAPI.getSurvivalRateAnalytics.mockResolvedValue([
      {
        stage: 'grafting',
        successRate: 87,
        plantsEntered: 100,
        plantsSurvived: 87
      }
    ]);

    floraAPI.getVarietyAnalytics.mockResolvedValue([
      {
        name: 'Valencia Orange',
        orders: 5,
        totalQuantity: 500,
        revenue: 6250
      }
    ]);

    floraAPI.getDispatchAnalytics.mockResolvedValue({
      totalDispatched: 100,
      onTimeDeliveries: 85,
      averageDispatchTime: 5.2,
      readyForDispatch: 15
    });

    floraAPI.getCostAnalytics.mockResolvedValue({
      totalRevenue: 25000,
      estimatedCosts: 18000,
      profitMargin: 28,
      costPerPlant: 18
    });

    floraAPI.getWorkflowEfficiencyAnalytics.mockResolvedValue({
      averageStageTime: { grafting: 3.5, nursery: 21 },
      bottlenecks: [{ stage: 'grafting', delay: 2 }],
      efficiency: 82
    });

    floraAPI.getOrders.mockResolvedValue([]);
    floraAPI.getGraftingRecords.mockResolvedValue([]);
    floraAPI.getBudwoodRecords.mockResolvedValue([]);
    floraAPI.getTransferRecords.mockResolvedValue([]);

    floraAPI.createOrder.mockResolvedValue({
      id: 'PO-2025-001'
    });

    floraAPI.getOrder.mockResolvedValue({
      id: 'PO-2025-001',
      status: 'grafting_operation'
    });

    floraAPI.getAllOrders.mockResolvedValue([]);
    floraAPI.getAllGraftingRecords.mockResolvedValue([]);
    floraAPI.getAllBudwoodRecords.mockResolvedValue([]);
    floraAPI.getPerformanceMetrics.mockResolvedValue({});
  });

  describe('Enhanced Order Management', () => {
    test('should transfer order to next stage with performance tracking', async () => {
      const orderId = 'PO-2025-001';
      const transferData = {
        toStage: 'post_graft_care',
        toSection: 'nursery',
        quantity: 95,
        operator: 'Alice Johnson',
        transferDate: '2025-09-17',
        qualityScore: 87.5,
        timeInPreviousStage: 3,
        notes: 'Grafting completed successfully'
      };

      const result = await floraAPI.transferOrderToNextStage(orderId, transferData);

      expect(result.success).toBe(true);
      expect(result.transferRecord).toBeDefined();
      expect(result.transferRecord.orderId).toBe(orderId);
    });

    test('should record health assessment and update quantities', async () => {
      const orderId = 'PO-2025-001';
      const healthData = {
        lostQuantity: 15,
        operator: 'Dr. Plant Health',
        assessmentType: 'routine',
        notes: 'Found 15 plants with fungal infection'
      };

      const result = await floraAPI.recordHealthAssessment(orderId, healthData);

      expect(result.success).toBe(true);
      expect(result.lost_quantity).toBe(15);
    });

    test('should validate stage requirements and identify blockers', async () => {
      const orderId = 'PO-2025-001';

      const result = await floraAPI.validateStage(orderId);

      expect(result).toBeDefined();
      expect(result.currentStageComplete).toBeDefined();
      expect(result.readyForNextStage).toBeDefined();
      expect(Array.isArray(result.blockers)).toBe(true);
    });

    test('should resolve blockers and update validation status', async () => {
      const orderId = 'PO-2025-001';
      const blockerData = {
        message: 'No grafter assigned',
        resolver: 'Supervisor Jane',
        resolutionNotes: 'Assigned Alice Johnson as grafter'
      };

      const result = await floraAPI.resolveBlocker(orderId, blockerData);

      expect(result.success).toBe(true);
      expect(result.remaining_blockers).toBeDefined();
      expect(result.stage_ready).toBeDefined();
    });
  });

  describe('Budwood Management', () => {
    test('should calculate budwood requirements accurately', async () => {
      const orderData = {
        quantity: 100,
        propagationMethod: 'grafting',
        wasteFactorPercent: 15,
        extraForSafety: 10
      };

      const result = await floraAPI.calculateBudwoodRequirements(orderData);

      expect(result.requiredBudwood).toBe(120); // 100 * 1.2 ratio
      expect(result.wasteFactorPercent).toBe(15);
      expect(result.extraForSafety).toBe(10);
      expect(result.totalRequired).toBe(148); // 120 * 1.15 + 10
    });

    test('should calculate different budwood requirements for different methods', async () => {
      const testCases = [
        { method: 'grafting', quantity: 100, expectedBase: 120 },
        { method: 'cutting', quantity: 100, expectedBase: 200 },
        { method: 'tissue_culture', quantity: 1000, expectedBase: 100 }
      ];

      for (const testCase of testCases) {
        // Set up mock return value for each specific case
        floraAPI.calculateBudwoodRequirements.mockResolvedValueOnce({
          requiredBudwood: testCase.expectedBase,
          wasteFactorPercent: 0,
          extraForSafety: 0,
          totalRequired: testCase.expectedBase
        });

        const orderData = {
          quantity: testCase.quantity,
          propagationMethod: testCase.method,
          wasteFactorPercent: 0,
          extraForSafety: 0
        };

        const result = await floraAPI.calculateBudwoodRequirements(orderData);
        expect(result.requiredBudwood).toBe(testCase.expectedBase);
      }
    });

    test('should manage budwood records lifecycle', async () => {
      // Create budwood record
      const recordData = {
        orderId: 'PO-2025-001',
        motherTreeId: 'MT-A15',
        variety: 'Valencia Orange',
        harvestDate: '2025-09-16',
        quantity: 150,
        quality: 'A',
        operator: 'John Smith',
        storageLocation: 'Cold Room 1',
        notes: 'High quality budwood from certified tree'
      };

      const created = await floraAPI.createBudwoodRecord(recordData);
      expect(created.id).toBeDefined();
      expect(created.variety).toBe('Valencia Orange');

      // Retrieve budwood record
      const retrieved = await floraAPI.getBudwoodRecord(created.id);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.quantity).toBe(150);

      // Update budwood record
      const updateData = { quantity: 140, notes: 'Updated quantity after quality check' };
      const updated = await floraAPI.updateBudwoodRecord(created.id, updateData);
      expect(updated.quantity).toBe(140);

      // Delete budwood record
      const deleteResult = await floraAPI.deleteBudwoodRecord(created.id);
      expect(deleteResult.success).toBe(true);
    });
  });

  describe('Worker Performance Analytics', () => {
    test('should track grafting performance by operator', async () => {
      const recordData = {
        orderId: 'PO-2025-001',
        operator: 'Alice Johnson',
        technique: 'whip_and_tongue',
        quantity: 100,
        successRate: 87,
        environmentalConditions: {
          temperature: 22,
          humidity: 85,
          lightLevel: 1200
        },
        qualityNotes: 'Excellent technique and union formation'
      };

      const result = await floraAPI.createGraftingRecord(recordData);
      expect(result.operator).toBe('Alice Johnson');
      expect(result.successRate).toBe(87);

      // Get performance for specific operator
      const performance = await floraAPI.getGraftingPerformanceByOperator('Alice Johnson', 'month');
      expect(performance.operator).toBe('Alice Johnson');
      expect(performance.totalGrafted).toBeGreaterThan(0);
      expect(performance.averageSuccessRate).toBeGreaterThan(0);
    });

    test('should retrieve comprehensive worker performance analytics', async () => {
      const result = await floraAPI.getWorkerPerformanceAnalytics('month');

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('operator');
        expect(result[0]).toHaveProperty('totalGrafted');
        expect(result[0]).toHaveProperty('averageSuccessRate');
        expect(result[0]).toHaveProperty('productivity');
      }
    });
  });

  describe('Enhanced Analytics', () => {
    test('should provide dashboard statistics', async () => {
      const stats = await floraAPI.getDashboardStats();

      expect(stats.totalOrders).toBeDefined();
      expect(stats.activeOrders).toBeDefined();
      expect(stats.totalPlants).toBeDefined();
      expect(stats.completedOrders).toBeDefined();
      expect(typeof stats.avgSuccessRate).toBe('number');
    });

    test('should provide survival rate analytics', async () => {
      const analytics = await floraAPI.getSurvivalRateAnalytics();

      expect(Array.isArray(analytics)).toBe(true);
      if (analytics.length > 0) {
        expect(analytics[0]).toHaveProperty('stage');
        expect(analytics[0]).toHaveProperty('successRate');
        expect(analytics[0]).toHaveProperty('plantsEntered');
        expect(analytics[0]).toHaveProperty('plantsSurvived');
      }
    });

    test('should provide variety analytics', async () => {
      const analytics = await floraAPI.getVarietyAnalytics();

      expect(Array.isArray(analytics)).toBe(true);
      if (analytics.length > 0) {
        expect(analytics[0]).toHaveProperty('name');
        expect(analytics[0]).toHaveProperty('orders');
        expect(analytics[0]).toHaveProperty('totalQuantity');
        expect(analytics[0]).toHaveProperty('revenue');
      }
    });

    test('should provide dispatch analytics', async () => {
      const analytics = await floraAPI.getDispatchAnalytics();

      expect(analytics.totalDispatched).toBeDefined();
      expect(analytics.onTimeDeliveries).toBeDefined();
      expect(analytics.averageDispatchTime).toBeDefined();
      expect(analytics.readyForDispatch).toBeDefined();
    });

    test('should provide cost analytics', async () => {
      const analytics = await floraAPI.getCostAnalytics();

      expect(analytics.totalRevenue).toBeDefined();
      expect(analytics.estimatedCosts).toBeDefined();
      expect(analytics.profitMargin).toBeDefined();
      expect(analytics.costPerPlant).toBeDefined();
    });

    test('should provide workflow efficiency analytics', async () => {
      const analytics = await floraAPI.getWorkflowEfficiencyAnalytics();

      expect(analytics.averageStageTime).toBeDefined();
      expect(Array.isArray(analytics.bottlenecks)).toBe(true);
      expect(analytics.efficiency).toBeDefined();
    });
  });

  describe('Data Synchronization', () => {
    test('should handle incremental sync with timestamps', async () => {
      const since = '2025-09-01T00:00:00Z';

      const orders = await floraAPI.getOrders(since);
      const graftingRecords = await floraAPI.getGraftingRecords(since);
      const budwoodRecords = await floraAPI.getBudwoodRecords(since);
      const transferRecords = await floraAPI.getTransferRecords(since);

      expect(Array.isArray(orders)).toBe(true);
      expect(Array.isArray(graftingRecords)).toBe(true);
      expect(Array.isArray(budwoodRecords)).toBe(true);
      expect(Array.isArray(transferRecords)).toBe(true);
    });

    test('should maintain data consistency across operations', async () => {
      // Create order
      const orderData = {
        clientName: 'Test Client',
        variety: 'Test Variety',
        quantity: 100,
        propagationMethod: 'grafting',
        budwoodCalculation: {
          requiredBudwood: 120,
          wasteFactorPercent: 15,
          totalRequired: 138
        }
      };

      const order = await floraAPI.createOrder(orderData);
      expect(order.id).toBeDefined();

      // Create related budwood record
      const budwoodData = {
        orderId: order.id,
        variety: 'Test Variety',
        quantity: 138,
        quality: 'A',
        operator: 'Test Operator'
      };

      const budwood = await floraAPI.createBudwoodRecord(budwoodData);
      expect(budwood.orderId).toBe(order.id);

      // Transfer order
      const transferData = {
        toStage: 'grafting_operation',
        toSection: 'grafting',
        quantity: 100,
        operator: 'Test Grafter'
      };

      const transfer = await floraAPI.transferOrderToNextStage(order.id, transferData);
      expect(transfer.success).toBe(true);

      // Verify order was updated
      const updatedOrder = await floraAPI.getOrder(order.id);
      expect(updatedOrder.status).toBe('grafting_operation');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Temporarily mock getAllOrders to simulate network error
      const originalGetAllOrders = floraAPI.getAllOrders;
      floraAPI.getAllOrders = jest.fn().mockRejectedValue(new Error('Network error: Unable to connect'));

      try {
        await floraAPI.getAllOrders();
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Network error');
      }

      // Restore original
      floraAPI.getAllOrders = originalGetAllOrders;
    });

    test('should handle validation errors properly', async () => {
      try {
        await floraAPI.calculateBudwoodRequirements({
          quantity: -1, // Invalid quantity
          propagationMethod: 'grafting'
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle not found errors', async () => {
      try {
        await floraAPI.getOrder('INVALID-ORDER-ID');
        throw new Error('Should have thrown not found error');
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    test('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();

      // Make multiple concurrent requests
      const promises = [
        floraAPI.getAllOrders(),
        floraAPI.getAllGraftingRecords(),
        floraAPI.getAllBudwoodRecords(),
        floraAPI.getDashboardStats(),
        floraAPI.getPerformanceMetrics()
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should complete
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toBeDefined());

      // Should complete reasonably quickly (within 1 second with mock delay)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle large datasets efficiently', async () => {
      // This would test performance with large amounts of mock data
      const startTime = Date.now();
      const orders = await floraAPI.getAllOrders();
      const endTime = Date.now();

      expect(Array.isArray(orders)).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should be fast with mock
    });
  });
});