import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Attach token to every request automatically
API.interceptors.request.use(config => {
  const token = localStorage.getItem('liza_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token expired, clear and redirect to login
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('liza_access');
      localStorage.removeItem('liza_refresh');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────
export const login = (username, password) =>
  API.post('/token/', { username, password });

export const refreshToken = (refresh) =>
  API.post('/token/refresh/', { refresh });

export const getMe = () => API.get('/me/');

// ── Products ──────────────────────────────────────
export const getProducts = () => API.get('/products/');
export const createProduct = (data) => API.post('/products/', data);
export const updateProduct = (id, data) => API.put(`/products/${id}/`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}/`);

// ── Invoices ──────────────────────────────────────
export const getInvoices = () => API.get('/invoices/');
export const createInvoice = (data) => API.post('/invoices/', data);
export const updateInvoice = (id, data) => API.put(`/invoices/${id}/`, data);
export const deleteInvoice = (id) => API.delete(`/invoices/${id}/`);

export default API;