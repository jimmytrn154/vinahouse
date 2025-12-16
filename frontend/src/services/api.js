import axios from 'axios';

// ⚠️ IMPORTANT: If you moved your backend to port 5000, change this URL to 'http://localhost:5000/api'
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Attaches token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },
};

// --- PROPERTY SERVICE ---
export const propertyService = {
  getAll: (params) => api.get('/properties', { params }), // Updated to accept params
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  // Note: Your properties.js route for rooms is router.post('/:id/rooms', ...)
  createRoom: (propertyId, data) => api.post(`/properties/${propertyId}/rooms`, data),
};

// --- LISTING SERVICE ---
export const listingService = {
  // Supports filters like: getAll({ status: 'verified', min_price: 1000 })
  getAll: (params) => api.get('/listings', { params }), 
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
};

// --- RENTAL REQUEST SERVICE ---
export const requestService = {
  getAll: () => api.get('/rental-requests'),
  getById: (id) => api.get(`/rental-requests/${id}`),
  create: (data) => api.post('/rental-requests', data),
  updateStatus: (id, status) => api.put(`/rental-requests/${id}/status`, { status }),
};

export default api;