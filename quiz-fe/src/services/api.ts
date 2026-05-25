import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: auto-attach Bearer token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 -> clear auth -> redirect /join ─────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      // Redirect based on role
      const role = useAuthStore.getState().role;
      window.location.href = role === "admin" ? "/admin/login" : "/join";
    }
    return Promise.reject(error);
  }
);
