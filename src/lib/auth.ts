// src/lib/auth.ts
import { api } from "./api";

const ACCESS_TOKEN_KEY = "central_access_token";
const USER_KEY = "central_user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;

  // payload extra que o backend já manda
  isCentralAdmin?: boolean;
  empresaId?: string | null;
  empresaRole?: string | null;
  empresaName?: string | null;

  // vem do backend já com a regra (OWNER + Desenvolvedor, etc.)
  can_manage_system_config?: boolean;

  // 🔑 **principal pra Serviços Internos**
  permissions?: string[]; // <- AQUI
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/login", { email, password });

  const { user, accessToken } = res.data;

  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

  return { user, accessToken };
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  delete api.defaults.headers.common["Authorization"];
}
