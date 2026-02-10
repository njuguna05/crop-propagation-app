import axios from 'axios';
import { MockFloraAPI } from './mockAPI';

// FloraERP API Service
class FloraAPI {
  constructor() {
    this.baseURL = process.env.REACT_APP_FLORA_API_URL || 'https://github.com/devafrichama/Floraerp';
    this.token = localStorage.getItem('flora_auth_token');
    this.tenantId = localStorage.getItem('currentTenantId');

    // Use mock API only if explicitly enabled
    this.useMockAPI = process.env.REACT_APP_MOCK_API === 'true';

    if (this.useMockAPI) {
      console.log('🔧 Using Mock API for development');
      this.mockAPI = new MockFloraAPI();
    }

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token and tenant ID
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Add tenant ID header if available
        if (this.tenantId) {
          config.headers['X-Tenant-ID'] = this.tenantId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.logout();
          window.location.href = '/login';
        }

        // Handle network errors
        if (!error.response) {
          throw new Error('Network error: Please check your connection');
        }

        throw new Error(error.response.data?.message || 'API request failed');
      }
    );
  }

  // Set authentication token
  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('flora_auth_token', token);
  }

  // Set current tenant ID
  setTenantId(tenantId) {
    this.tenantId = tenantId;
    if (tenantId) {
      localStorage.setItem('currentTenantId', tenantId);
    } else {
      localStorage.removeItem('currentTenantId');
    }
  }

  // Clear authentication
  logout() {
    this.token = null;
    localStorage.removeItem('flora_auth_token');
    localStorage.removeItem('flora_user');
  }

  // Authentication endpoints
  async login(credentials) {
    if (this.useMockAPI) {
      const response = await this.mockAPI.login(credentials);
      if (response.token) {
        this.setAuthToken(response.token);
        localStorage.setItem('flora_user', JSON.stringify(response.user));
      }
      return response;
    }

    // Backend expects {username, password} - username field accepts email too
    const loginPayload = {
      username: credentials.email || credentials.username,
      password: credentials.password
    };

    const response = await this.client.post('/auth/login', loginPayload);

    // Backend returns {access_token, refresh_token, token_type}
    if (response.access_token) {
      this.setAuthToken(response.access_token);
      localStorage.setItem('flora_refresh_token', response.refresh_token);

      // Fetch user profile after login
      const user = await this.client.get('/auth/me');
      localStorage.setItem('flora_user', JSON.stringify(user));

      return { token: response.access_token, user };
    }
    return response;
  }

  async register(userData) {
    return await this.client.post('/auth/register', userData);
  }

  async refreshToken() {
    const response = await this.client.post('/auth/refresh');
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async getCurrentUser() {
    return await this.client.get('/auth/me');
  }

  // Crop management endpoints
  async getAllCrops() {
    if (this.useMockAPI) {
      return await this.mockAPI.getAllCrops();
    }
    return await this.client.get('/crops');
  }

  async getCrops(since = null) {
    if (this.useMockAPI) {
      return await this.mockAPI.getCrops(since);
    }
    const params = since ? { since } : {};
    return await this.client.get('/crops', { params });
  }

  async getCrop(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.getCrop(id);
    }
    return await this.client.get(`/crops/${id}`);
  }

  async createCrop(cropData) {
    if (this.useMockAPI) {
      return await this.mockAPI.createCrop(cropData);
    }
    return await this.client.post('/crops', this.mapCropToAPI(cropData));
  }

  async updateCrop(id, cropData) {
    if (this.useMockAPI) {
      return await this.mockAPI.updateCrop(id, cropData);
    }
    return await this.client.put(`/crops/${id}`, this.mapCropToAPI(cropData));
  }

  async deleteCrop(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.deleteCrop(id);
    }
    return await this.client.delete(`/crops/${id}`);
  }

  // Task management endpoints
  async getAllTasks() {
    if (this.useMockAPI) {
      return await this.mockAPI.getAllTasks();
    }
    return await this.client.get('/tasks');
  }

  async getTasks(since = null) {
    if (this.useMockAPI) {
      return await this.mockAPI.getTasks(since);
    }
    const params = since ? { since } : {};
    return await this.client.get('/tasks', { params });
  }

  async getTask(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.getTask(id);
    }
    return await this.client.get(`/tasks/${id}`);
  }

  async createTask(taskData) {
    if (this.useMockAPI) {
      return await this.mockAPI.createTask(taskData);
    }
    return await this.client.post('/tasks', this.mapTaskToAPI(taskData));
  }

  async updateTask(id, taskData) {
    if (this.useMockAPI) {
      return await this.mockAPI.updateTask(id, taskData);
    }
    return await this.client.put(`/tasks/${id}`, this.mapTaskToAPI(taskData));
  }

  async deleteTask(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.deleteTask(id);
    }
    return await this.client.delete(`/tasks/${id}`);
  }

  // Order management endpoints
  async getAllOrders() {
    if (this.useMockAPI) {
      return await this.mockAPI.getAllOrders();
    }
    return await this.client.get('/orders');
  }

  async getOrders(since = null) {
    if (this.useMockAPI) {
      return await this.mockAPI.getOrders(since);
    }
    const params = since ? { since } : {};
    return await this.client.get('/orders', { params });
  }

  async getOrder(id) {
    return await this.client.get(`/orders/${id}`);
  }

  async createOrder(orderData) {
    return await this.client.post('/orders', this.mapOrderToAPI(orderData));
  }

  async updateOrder(id, orderData) {
    return await this.client.put(`/orders/${id}`, this.mapOrderToAPI(orderData));
  }

  async updateOrderStatus(id, status) {
    return await this.client.patch(`/orders/${id}/status`, { status });
  }

  async deleteOrder(id) {
    return await this.client.delete(`/orders/${id}`);
  }

  // Enhanced budwood collection endpoints
  async getAllBudwoodRecords() {
    if (this.useMockAPI) {
      return await this.mockAPI.getAllBudwoodRecords();
    }
    return await this.client.get('/budwood');
  }

  async getBudwoodRecords(since = null) {
    if (this.useMockAPI) {
      return await this.mockAPI.getBudwoodRecords(since);
    }
    const params = since ? { since } : {};
    return await this.client.get('/budwood', { params });
  }

  async getBudwoodRecord(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.getBudwoodRecord(id);
    }
    return await this.client.get(`/budwood/${id}`);
  }

  async createBudwoodRecord(recordData) {
    if (this.useMockAPI) {
      return await this.mockAPI.createBudwoodRecord(recordData);
    }
    return await this.client.post('/budwood', recordData);
  }

  async updateBudwoodRecord(id, recordData) {
    if (this.useMockAPI) {
      return await this.mockAPI.updateBudwoodRecord(id, recordData);
    }
    return await this.client.put(`/budwood/${id}`, recordData);
  }

  async deleteBudwoodRecord(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.deleteBudwoodRecord(id);
    }
    return await this.client.delete(`/budwood/${id}`);
  }

  async calculateBudwoodRequirements(orderData) {
    if (this.useMockAPI) {
      return await this.mockAPI.calculateBudwoodRequirements(orderData);
    }
    return await this.client.post('/budwood/calculate', orderData);
  }

  // Enhanced grafting records endpoints
  async getAllGraftingRecords() {
    if (this.useMockAPI) {
      return await this.mockAPI.getAllGraftingRecords();
    }
    return await this.client.get('/grafting');
  }

  async getGraftingRecords(since = null) {
    if (this.useMockAPI) {
      return await this.mockAPI.getGraftingRecords(since);
    }
    const params = since ? { since } : {};
    return await this.client.get('/grafting', { params });
  }

  async getGraftingRecord(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.getGraftingRecord(id);
    }
    return await this.client.get(`/grafting/${id}`);
  }

  async createGraftingRecord(recordData) {
    if (this.useMockAPI) {
      return await this.mockAPI.createGraftingRecord(recordData);
    }
    return await this.client.post('/grafting', recordData);
  }

  async updateGraftingRecord(id, recordData) {
    if (this.useMockAPI) {
      return await this.mockAPI.updateGraftingRecord(id, recordData);
    }
    return await this.client.put(`/grafting/${id}`, recordData);
  }

  async deleteGraftingRecord(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.deleteGraftingRecord(id);
    }
    return await this.client.delete(`/grafting/${id}`);
  }

  async getGraftingPerformanceByOperator(operatorId, timeFrame = 'month') {
    if (this.useMockAPI) {
      return await this.mockAPI.getGraftingPerformanceByOperator(operatorId, timeFrame);
    }
    return await this.client.get(`/grafting/performance/${operatorId}`, { params: { timeFrame } });
  }

  // Transfer records endpoints
  async getAllTransferRecords() {
    if (this.useMockAPI) {
      return await this.mockAPI.getAllTransferRecords();
    }
    return await this.client.get('/transfers');
  }

  async getTransferRecords(since = null) {
    if (this.useMockAPI) {
      return await this.mockAPI.getTransferRecords(since);
    }
    const params = since ? { since } : {};
    return await this.client.get('/transfers', { params });
  }

  async getTransferRecord(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.getTransferRecord(id);
    }
    return await this.client.get(`/transfers/${id}`);
  }

  async createTransferRecord(recordData) {
    if (this.useMockAPI) {
      return await this.mockAPI.createTransferRecord(recordData);
    }
    return await this.client.post('/transfers', recordData);
  }

  async updateTransferRecord(id, recordData) {
    if (this.useMockAPI) {
      return await this.mockAPI.updateTransferRecord(id, recordData);
    }
    return await this.client.put(`/transfers/${id}`, recordData);
  }

  async deleteTransferRecord(id) {
    if (this.useMockAPI) {
      return await this.mockAPI.deleteTransferRecord(id);
    }
    return await this.client.delete(`/transfers/${id}`);
  }

  // Enhanced propagation order endpoints
  async transferOrderToNextStage(orderId, transferData) {
    if (this.useMockAPI) {
      return await this.mockAPI.transferOrderToNextStage(orderId, transferData);
    }
    return await this.client.post(`/orders/${orderId}/transfer`, transferData);
  }

  async recordHealthAssessment(orderId, healthData) {
    if (this.useMockAPI) {
      return await this.mockAPI.recordHealthAssessment(orderId, healthData);
    }
    return await this.client.post(`/orders/${orderId}/health`, healthData);
  }

  async validateStage(orderId) {
    if (this.useMockAPI) {
      return await this.mockAPI.validateStage(orderId);
    }
    return await this.client.get(`/orders/${orderId}/validate`);
  }

  async resolveBlocker(orderId, blockerData) {
    if (this.useMockAPI) {
      return await this.mockAPI.resolveBlocker(orderId, blockerData);
    }
    return await this.client.post(`/orders/${orderId}/resolve-blocker`, blockerData);
  }

  // Enhanced analytics endpoints
  async getDashboardStats() {
    if (this.useMockAPI) {
      return await this.mockAPI.getDashboardStats();
    }
    return await this.client.get('/analytics/dashboard');
  }

  async getPerformanceMetrics(dateRange = '30d') {
    if (this.useMockAPI) {
      return await this.mockAPI.getPerformanceMetrics(dateRange);
    }
    return await this.client.get(`/analytics/performance`, { params: { range: dateRange } });
  }

  async getSuccessRateAnalysis() {
    if (this.useMockAPI) {
      return await this.mockAPI.getSuccessRateAnalysis();
    }
    return await this.client.get('/analytics/success-rates');
  }

  async getWorkerPerformanceAnalytics(timeFrame = 'month') {
    if (this.useMockAPI) {
      return await this.mockAPI.getWorkerPerformanceAnalytics(timeFrame);
    }
    return await this.client.get('/analytics/worker-performance', { params: { timeFrame } });
  }

  async getSurvivalRateAnalytics() {
    if (this.useMockAPI) {
      return await this.mockAPI.getSurvivalRateAnalytics();
    }
    return await this.client.get('/analytics/survival-rates');
  }

  async getVarietyAnalytics() {
    if (this.useMockAPI) {
      return await this.mockAPI.getVarietyAnalytics();
    }
    return await this.client.get('/analytics/varieties');
  }

  async getDispatchAnalytics() {
    if (this.useMockAPI) {
      return await this.mockAPI.getDispatchAnalytics();
    }
    return await this.client.get('/analytics/dispatch');
  }

  async getCostAnalytics() {
    if (this.useMockAPI) {
      return await this.mockAPI.getCostAnalytics();
    }
    return await this.client.get('/analytics/costs');
  }

  async getWorkflowEfficiencyAnalytics() {
    if (this.useMockAPI) {
      return await this.mockAPI.getWorkflowEfficiencyAnalytics();
    }
    return await this.client.get('/analytics/workflow-efficiency');
  }

  // User and team management
  async getTeamMembers() {
    return await this.client.get('/users/team');
  }

  async updateUserProfile(userData) {
    return await this.client.put('/users/profile', userData);
  }

  // Data export/import
  async exportData(options = {}) {
    return await this.client.post('/data/export', options);
  }

  async importData(data) {
    return await this.client.post('/data/import', data);
  }

  // Health check
  async healthCheck() {
    return await this.client.get('/health');
  }

  // Data mapping functions (adapt app data structure to API)
  mapCropToAPI(crop) {
    return {
      id: crop.id,
      name: crop.name,
      variety: crop.variety,
      propagation_method: crop.propagationMethod,
      current_stage: crop.currentStage,
      location: crop.location,
      planted_date: crop.plantedDate,
      expected_germination: crop.expectedGermination,
      temperature: crop.temperature,
      humidity: crop.humidity,
      watered: crop.watered,
      notes: crop.notes,
      last_updated: crop.lastUpdated
    };
  }

  mapTaskToAPI(task) {
    return {
      id: task.id,
      crop_id: task.cropId,
      task: task.task,
      due_date: task.dueDate,
      completed: task.completed,
      priority: task.priority,
      last_updated: task.lastUpdated
    };
  }

  mapOrderToAPI(order) {
    return {
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      current_section: order.currentSection,
      client_name: order.clientName,
      contact_person: order.contactPerson,
      phone: order.phone,
      email: order.email,
      order_date: order.orderDate,
      requested_delivery: order.requestedDelivery,
      crop_type: order.cropType,
      variety: order.variety,
      total_quantity: order.totalQuantity,
      completed_quantity: order.completedQuantity,
      current_stage_quantity: order.currentStageQuantity,
      propagation_method: order.propagationMethod,
      unit_price: order.unitPrice,
      total_value: order.totalValue,
      priority: order.priority,
      notes: order.notes,
      specifications: order.specifications,
      stage_history: order.stageHistory,
      budwood_calculation: order.budwoodCalculation,
      worker_assignments: order.workerAssignments,
      stage_validation: order.stageValidation,
      last_updated: order.lastUpdated
    };
  }

  // Reverse mapping (API to app data structure)
  mapCropFromAPI(apiCrop) {
    return {
      id: apiCrop.id,
      name: apiCrop.name,
      variety: apiCrop.variety,
      propagationMethod: apiCrop.propagation_method,
      currentStage: apiCrop.current_stage,
      location: apiCrop.location,
      plantedDate: apiCrop.planted_date,
      expectedGermination: apiCrop.expected_germination,
      temperature: apiCrop.temperature,
      humidity: apiCrop.humidity,
      watered: apiCrop.watered,
      notes: apiCrop.notes,
      lastUpdated: apiCrop.last_updated
    };
  }

  mapTaskFromAPI(apiTask) {
    return {
      id: apiTask.id,
      cropId: apiTask.crop_id,
      task: apiTask.task,
      dueDate: apiTask.due_date,
      completed: apiTask.completed,
      priority: apiTask.priority,
      lastUpdated: apiTask.last_updated
    };
  }

  mapOrderFromAPI(apiOrder) {
    return {
      id: apiOrder.id,
      orderNumber: apiOrder.order_number,
      status: apiOrder.status,
      currentSection: apiOrder.current_section,
      clientName: apiOrder.client_name,
      contactPerson: apiOrder.contact_person,
      phone: apiOrder.phone,
      email: apiOrder.email,
      orderDate: apiOrder.order_date,
      requestedDelivery: apiOrder.requested_delivery,
      cropType: apiOrder.crop_type,
      variety: apiOrder.variety,
      totalQuantity: apiOrder.total_quantity,
      completedQuantity: apiOrder.completed_quantity,
      currentStageQuantity: apiOrder.current_stage_quantity,
      propagationMethod: apiOrder.propagation_method,
      unitPrice: apiOrder.unit_price,
      totalValue: apiOrder.total_value,
      priority: apiOrder.priority,
      notes: apiOrder.notes,
      specifications: apiOrder.specifications,
      stageHistory: apiOrder.stage_history,
      budwoodCalculation: apiOrder.budwood_calculation,
      workerAssignments: apiOrder.worker_assignments,
      stageValidation: apiOrder.stage_validation,
      lastUpdated: apiOrder.last_updated
    };
  }
}

// Create API instance
export const floraAPI = new FloraAPI();

// Export for testing and mocking
export default FloraAPI;