import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Required for cookies/sessions
});

// Request interceptor removed — browser handles cookies automatically

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
  csrfCookie: () => axios.get('/sanctum/csrf-cookie'), // Base URL is not /api for this
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'is_senior_citizen' || key === 'is_pwd' || key === 'is_low_income') {
          formData.append(key, data[key] ? '1' : '0');
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    // Add _method property for Laravel to treat POST as PUT for file upload support
    formData.append('_method', 'PUT');
    return api.post('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (data) => api.put('/auth/change-password', data),
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
  trackSearch: (params) => api.get('/applications/track-search', { params }),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  assistanceTypes: () => api.get('/assistance-types'),
  publicAssistanceTypes: () => api.get('/public/assistance-types'),
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
  listAssistanceTypes: () => api.get('/admin/assistance-types'),
  createAssistanceType: (data) => api.post('/admin/assistance-types', data),
  updateAssistanceType: (id, data) => api.put(`/admin/assistance-types/${id}`, data),
  listUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getUserApplications: (id) => api.get(`/admin/users/${id}/applications`),
};

// ─── Tenant API ─────────────────────────────────────────────────────
export const tenantsAPI = {
  list: () => api.get('/tenants'),
  create: (data) => api.post('/tenants', data),
  show: (id) => api.get(`/tenants/${id}`),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  getSubscriptionHistory: (id) => api.get(`/tenants/${id}/subscription-history`),
  destroy: (id) => api.delete(`/tenants/${id}`),
};

// ─── Notification API ───────────────────────────────────────────────
export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  clearAll: () => api.delete('/notifications/clear-all'),
};

// ─── Transparency API ───────────────────────────────────────────────
export const transparencyAPI = {
  barangayList: () => api.get('/transparency/barangays'),
  stats: (code) => api.get(`/transparency/${code}/stats`),
  released: (code, params) => api.get(`/transparency/${code}/released`, { params }),
  monthly: (code) => api.get(`/transparency/${code}/monthly`),
};

// ─── Chat API ───────────────────────────────────────────────────────
export const chatAPI = {
  sendBot: (message) => api.post('/chat', { message }),
  fetchHistory: () => api.get('/chat/history'),
  sendLive: (message) => api.post('/chat/message', { message }),
  getUnreadCount: () => api.get('/chat/unread-count'),
  
  // Admin methods
  adminListSessions: () => api.get('/admin/chat/sessions'),
  adminFetchHistory: (userId) => api.get(`/admin/chat/${userId}/history`),
  adminSendMessage: (userId, message) => api.post(`/admin/chat/${userId}/message`, { message }),
  adminGetUnreadCount: () => api.get('/admin/chat/unread-count'),
};

// ─── Document API ───────────────────────────────────────────────────
export const documentAPI = {
  // Document types
  types: () => api.get('/document-types'),
  adminTypes: () => api.get('/admin/document-types'),
  createType: (data) => api.post('/admin/document-types', data),
  updateType: (id, data) => api.put(`/admin/document-types/${id}`, data),

  // Document requests
  list: (params) => api.get('/document-requests', { params }),
  create: (data) => api.post('/document-requests', data),
  simulatePayment: (id, data) => api.post(`/document-requests/${id}/pay`, data),
  updateStatus: (id, data) => api.put(`/admin/document-requests/${id}/status`, data),
  subscribe: (data) => api.post('/admin/subscribe', data),
};

export default api;
