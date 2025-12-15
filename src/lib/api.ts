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

// ✅ chaves únicas e centralizadas
export const ACCESS_TOKEN_KEY = "central_access_token";
export const USER_KEY = "central_user";
export const EMPRESA_ID_KEY = "central_admin_empresa_id";

// src/lib/api.ts
api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  // garante headers
  config.headers = config.headers || {};

  // token
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  const url = String(config.url || "");

  // 🔥 /auth/switch-empresa PRECISA de empresa id (mesmo sendo /auth)
  const isSwitchEmpresa =
    url.includes("/auth/switch-empresa") || url.includes("/auth/switch");

  // não injeta empresa nas outras rotas de auth
  const isAuthRoute =
    !isSwitchEmpresa &&
    (url.startsWith("/auth") ||
      url.includes("/auth/") ||
      url.startsWith("/login") ||
      url.startsWith("/me"));

  // ✅ detecta header já setado (funciona com objeto e com AxiosHeaders)
  const hasEmpresaHeader = (() => {
    const h: any = config.headers;

    // AxiosHeaders (axios v1+)
    if (typeof h?.get === "function") {
      return Boolean(h.get("x-empresa-id"));
    }

    // objeto normal (case-insensitive)
    return Boolean(h["x-empresa-id"] || h["X-Empresa-Id"] || h["x-empresa-Id"]);
  })();

  if (!isAuthRoute && !hasEmpresaHeader) {
    const empresaId = localStorage.getItem(EMPRESA_ID_KEY);
    if (empresaId) {
      const h: any = config.headers;

      // AxiosHeaders
      if (typeof h?.set === "function") h.set("x-empresa-id", empresaId);
      else h["x-empresa-id"] = empresaId;
    }
  }

  // ✅ se for switch-empresa, garante header MESMO se alguém esqueceu de setar
  if (isSwitchEmpresa && !hasEmpresaHeader) {
    const empresaId = localStorage.getItem(EMPRESA_ID_KEY);
    if (empresaId) {
      const h: any = config.headers;
      if (typeof h?.set === "function") h.set("x-empresa-id", empresaId);
      else h["x-empresa-id"] = empresaId;
    }
  }

  return config;
});



// ✅ Interceptor de RESPONSE:
// - em DEV: não apaga token nem redireciona (pra não virar inferno)
// - em PROD: apaga token e manda pro /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;

    if (status === 401 && typeof window !== "undefined") {
      const isDev = import.meta.env.DEV;

      if (isDev) {
        // 👇 ajuda MUITO a achar a causa real
        // (ex.: token expirado, secret mudou, request sem login, etc.)
        console.warn("[API] 401 em DEV:", url);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(EMPRESA_ID_KEY);

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
