// src/lib/api.ts
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_CENTRAL_API_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:4200"
).replace(/\/$/, ""); // remove barra no final, se tiver

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// nome ÚNICO da chave do token
export const ACCESS_TOKEN_KEY = "central_access_token";

// Interceptor de REQUEST: antes de cada request, pega o token atual
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor de RESPONSE: se der 401, limpa o token e manda pro /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACCESS_TOKEN_KEY);

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
