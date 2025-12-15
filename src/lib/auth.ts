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

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

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
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return false;

  if (isTokenExpired(token)) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem("central_user");
    localStorage.removeItem("central_admin_empresa_id");
    return false;
  }

  return true;
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


export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp; // em segundos
  if (!exp || typeof exp !== "number") return false; // se não tiver exp, não crava expiração
  return Date.now() >= exp * 1000;
}

