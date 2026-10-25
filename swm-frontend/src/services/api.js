import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
const TOKEN_KEY = 'swm_token';

// sessionStorage: cleared when the tab closes. See README for hardening options.
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (t) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn; };

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthForm && tokenStore.get()) {
      tokenStore.clear();
      onSessionExpired();
    }
    return Promise.reject(error);
  }
);

export function errorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error.request && !error.response) return 'Cannot reach the server. Check your connection and that the backend is running.';
  return error.message || 'Something went wrong.';
}

export const imageUrl = (path) => {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}/${path.replace(/^\/+/, '')}`;
};

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const publicApi = { stats: () => api.get('/stats') };

export const complaintsApi = {
  mine: () => api.get('/complaints/mine'),
  get: (id) => api.get(`/complaints/${id}`),
  create: (formData) => api.post('/complaints', formData),
};

export const adminApi = {
  list: () => api.get('/admin/complaints'),
  get: (id) => api.get(`/admin/complaints/${id}`),
  update: (id, data) => api.patch(`/admin/complaints/${id}`, data),
};

export default api;
