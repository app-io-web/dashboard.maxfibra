// src/lib/auth.ts
import { api, ACCESS_TOKEN_KEY, USER_KEY, EMPRESA_ID_KEY } from "./api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;

  isCentralAdmin?: boolean;
  empresaId?: string | null;
  empresaRole?: string | null;
  empresaName?: string | null;

  can_manage_system_config?: boolean;
  permissions?: string[];
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

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/login", { email, password });
  const { user, accessToken } = res.data;

  if (typeof window !== "undefined") {
    // ✅ salva token
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    // ✅ salva user
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // ✅ salva empresa atual (pra não depender de timing do SessionContext)
    if (user?.empresaId) {
      localStorage.setItem(EMPRESA_ID_KEY, String(user.empresaId));
    } else {
      localStorage.removeItem(EMPRESA_ID_KEY);
    }
  }

  // ok manter, mas o interceptor já garante
  api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

  return { user, accessToken };
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EMPRESA_ID_KEY);
  }
  delete api.defaults.headers.common["Authorization"];
}
