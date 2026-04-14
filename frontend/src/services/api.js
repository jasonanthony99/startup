import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ───────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ─── Applications API ───────────────────────────────────────────────
export const applicationsAPI = {
  list: (params) => api.get('/applications', { params }),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/applications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  show: (id) => api.get(`/applications/${id}`),
  track: (refId) => api.get(`/applications/track/${refId}`),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  assistanceTypes: () => api.get('/assistance-types'),
};

// ─── Queue API ──────────────────────────────────────────────────────
export const queueAPI = {
  list: (params) => api.get('/queue', { params }),
  updatePosition: (id, position) => api.put(`/queue/${id}/position`, { position }),
  next: () => api.get('/queue/next'),
  resort: () => api.post('/queue/resort'),
};

// ─── Admin API ──────────────────────────────────────────────────────
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  reports: (params) => api.get('/admin/reports', { params }),
  monthlySummary: (year) => api.get('/admin/reports/monthly', { params: { year } }),
  createAssistanceType: (data) => api.post('/admin/assistance-types', data),
  updateAssistanceType: (id, data) => api.put(`/admin/assistance-types/${id}`, data),
};

// ─── Tenant API ─────────────────────────────────────────────────────
export const tenantsAPI = {
  list: () => api.get('/tenants'),
  create: (data) => api.post('/tenants', data),
  show: (id) => api.get(`/tenants/${id}`),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  destroy: (id) => api.delete(`/tenants/${id}`),
};

// ─── Notification API ───────────────────────────────────────────────
export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// ─── Transparency API ───────────────────────────────────────────────
export const transparencyAPI = {
  barangayList: () => api.get('/transparency/barangays'),
  stats: (code) => api.get(`/transparency/${code}/stats`),
  released: (code, params) => api.get(`/transparency/${code}/released`, { params }),
  monthly: (code) => api.get(`/transparency/${code}/monthly`),
};

export default api;
