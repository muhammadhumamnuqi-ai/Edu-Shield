import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('school');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const schools = {
  getProfile: () => api.get('/schools/profile'),
  updateProfile: (data) => api.put('/schools/profile', data),
  getStats: () => api.get('/schools/stats'),
};

export const students = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

export const predictions = {
  create: (data) => api.post('/predictions', data),
  getAll: () => api.get('/predictions'),
};

export const analytics = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getFeatureImportance: () => api.get('/analytics/feature-importance'),
};

export const interventions = {
  getAll: (params) => api.get('/interventions', { params }),
  create: (data) => api.post('/interventions', data),
  update: (id, data) => api.put(`/interventions/${id}`, data),
  delete: (id) => api.delete(`/interventions/${id}`),
};

export const reports = {
  getAll: () => api.get('/reports'),
  generate: (type) => api.post('/reports/generate', { type }),
  getById: (id) => api.get(`/reports/${id}`),
};

export default api;
