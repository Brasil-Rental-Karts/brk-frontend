import axios from "axios";

import { AuthService } from "./services/auth.service";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Always send cookies
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, tokenRefreshed: boolean) => {
  failedQueue.forEach((prom) => {
    if (tokenRefreshed) {
      prom.resolve();
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

const unprotectedRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/confirm-email",
  "/auth/google",
  "/auth/google/url",
  "/auth/google/callback",
  "/auth/login-success",
  "/auth/login-error",
  "/login-success",
  "/login-error",
];

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefresh =
      originalRequest.url &&
      originalRequest.url.includes("/auth/refresh-token");
    const isUnprotected =
      originalRequest.url &&
      unprotectedRoutes.some((route) => originalRequest.url.includes(route));

    // For 401 errors, only attempt token refresh if it's not a login attempt or other unprotected route
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isRefresh &&
      !isUnprotected
    ) {
      if (isRefreshing) {
        // Se já está tentando refresh, aguarda na fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
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

    // For all other errors (including 401 on login attempts), just pass them through
    return Promise.reject(error);
  },
);

export default api;
