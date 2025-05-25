import axios from 'axios';
import { AuthService } from './services/auth.service';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always send cookies
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, tokenRefreshed: boolean) => {
  failedQueue.forEach(prom => {
    if (tokenRefreshed) {
      prom.resolve();
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefresh = originalRequest.url && originalRequest.url.includes('/auth/refresh-token');
    if (error.response && error.response.status === 401 && !originalRequest._retry && !isRefresh) {
      if (isRefreshing) {
        // Se já está tentando refresh, aguarda na fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(() => api(originalRequest));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await AuthService.refreshToken();
        processQueue(null, true);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, false);
        // Opcional: aqui pode-se disparar logout global
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    if (error.response && error.response.status === 403) {
      // Handle forbidden errors
      console.error('Access forbidden:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api; 