import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// Create axios instance with default config
const tenantAPI = axios.create({
    baseURL: `${API_URL}/api/v1/tenants`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
tenantAPI.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('flora_auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
tenantAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear auth and redirect to login
            localStorage.removeItem('flora_auth_token');
            localStorage.removeItem('flora_user');
            localStorage.removeItem('currentTenantId');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Tenant CRUD operations
export const getTenants = async () => {
    const response = await tenantAPI.get('/');
    return response.data;
};

export const getTenant = async (tenantId) => {
    const response = await tenantAPI.get(`/${tenantId}`);
    return response.data;
};

export const createTenant = async (tenantData) => {
    const response = await tenantAPI.post('/', tenantData);
    return response.data;
};

export const registerTenant = async (registrationData) => {
    const response = await tenantAPI.post('/register', registrationData);
    return response.data;
};

export const updateTenant = async (tenantId, tenantData) => {
    const response = await tenantAPI.put(`/${tenantId}`, tenantData);
    return response.data;
};

export const deleteTenant = async (tenantId) => {
    const response = await tenantAPI.delete(`/${tenantId}`);
    return response.data;
};

// Tenant user management
export const getTenantUsers = async (tenantId) => {
    const response = await tenantAPI.get(`/${tenantId}/users`);
    return response.data;
};

export const inviteUserToTenant = async (tenantId, invitationData) => {
    const response = await tenantAPI.post(`/${tenantId}/users/invite`, invitationData);
    return response.data;
};

export const removeUserFromTenant = async (tenantId, userId) => {
    const response = await tenantAPI.delete(`/${tenantId}/users/${userId}`);
    return response.data;
};

export const updateUserRole = async (tenantId, userId, roleData) => {
    const response = await tenantAPI.patch(`/${tenantId}/users/${userId}/role`, roleData);
    return response.data;
};

// Tenant settings
export const getTenantSettings = async (tenantId) => {
    const response = await tenantAPI.get(`/${tenantId}/settings`);
    return response.data;
};

export const updateTenantSettings = async (tenantId, settings) => {
    const response = await tenantAPI.put(`/${tenantId}/settings`, settings);
    return response.data;
};

// Tenant statistics
export const getTenantStats = async (tenantId) => {
    const response = await tenantAPI.get(`/${tenantId}/stats`);
    return response.data;
};

export default tenantAPI;
