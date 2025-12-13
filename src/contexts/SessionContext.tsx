// src/contexts/SessionContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type EmpresaBranding = {
  display_name: string | null;
  logo_url: string | null;
};

type SessionState = {
  empresaId: string | null;
  setEmpresaId: (id: string | null) => void;

  permissions: string[];
  permissionsLoading: boolean;
  refreshPermissions: () => Promise<void>;

  empresaBranding: EmpresaBranding | null;
  brandingLoading: boolean;
  refreshBranding: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

const LS_EMPRESA_KEY = "central_admin_empresa_id";

// helper: url absoluta pra favicon/logo
function buildAbsoluteUrl(raw?: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const base = api.defaults.baseURL || "";
  return base.replace(/\/$/, "") + (raw.startsWith("/") ? raw : `/${raw}`);
}

function updateFavicon(url: string) {
  let link =
    document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
    document.createElement("link");

  link.rel = "icon";
  link.href = url;

  if (!link.parentNode) document.head.appendChild(link);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [empresaId, _setEmpresaId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LS_EMPRESA_KEY);
  });

  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const [empresaBranding, setEmpresaBranding] = useState<EmpresaBranding | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(false);

  // ✅ padrão: toda request vai “saber” a empresa atual (sem gambiarras em cada chamada)
  useEffect(() => {
    if (empresaId) {
      api.defaults.headers.common["x-empresa-id"] = empresaId;
    } else {
      delete api.defaults.headers.common["x-empresa-id"];
    }
  }, [empresaId]);

  const setEmpresaId = useCallback((id: string | null) => {
    _setEmpresaId(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(LS_EMPRESA_KEY, id);
      else localStorage.removeItem(LS_EMPRESA_KEY);
    }
  }, []);

  // sincroniza troca de empresa entre abas
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === LS_EMPRESA_KEY) {
        _setEmpresaId(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 🔥 endpoint sugerido: GET /auth/permissions?empresaId=...
  // se você já tiver outro (ex: /empresa/permissions), troca aqui.
  // 🔥 tenta múltiplos endpoints até achar o que existe
        const refreshPermissions = useCallback(async () => {
        try {
            setPermissionsLoading(true);

            // sem empresa definida, zera e pronto
            if (!empresaId) {
            setPermissions([]);
            return;
            }

            // ✅ usa /me como fonte de verdade
            const res = await api.get("/me");

            const perms = res.data?.user?.permissions;
            setPermissions(Array.isArray(perms) ? perms : []);
        } catch (err) {
            console.error("[Session] erro ao atualizar permissions via /me:", err);
            setPermissions([]);
        } finally {
            setPermissionsLoading(false);
        }
        }, [empresaId]);



  // Branding (usa teu endpoint atual /empresa/settings)
  const refreshBranding = useCallback(async () => {
    try {
      setBrandingLoading(true);

      // se sua API já usa x-empresa-id, beleza.
      const res = await api.get<{ empresaSettings: EmpresaBranding | null }>("/empresa/settings");

      const b = res.data?.empresaSettings ?? null;
      setEmpresaBranding(b);

      // título + favicon já ficam acoplados aqui (global de verdade)
      if (b?.display_name) document.title = `${b.display_name} • Central Admin`;
      else document.title = "Central Admin";

      if (b?.logo_url) updateFavicon(buildAbsoluteUrl(b.logo_url));
      else updateFavicon("/vite.svg");
    } catch (err) {
      console.error("[Session] erro ao atualizar branding:", err);
      setEmpresaBranding(null);
      document.title = "Central Admin";
      updateFavicon("/vite.svg");
    } finally {
      setBrandingLoading(false);
    }
  }, []);

  // ✅ efeito GLOBAL: mudou empresa -> refaz permissions + branding
  useEffect(() => {
    refreshPermissions();
    refreshBranding();
  }, [empresaId, refreshPermissions, refreshBranding]);

  const value = useMemo<SessionState>(
    () => ({
      empresaId,
      setEmpresaId,

      permissions,
      permissionsLoading,
      refreshPermissions,

      empresaBranding,
      brandingLoading,
      refreshBranding,
    }),
    [
      empresaId,
      setEmpresaId,
      permissions,
      permissionsLoading,
      refreshPermissions,
      empresaBranding,
      brandingLoading,
      refreshBranding,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession precisa estar dentro de <SessionProvider />");
  return ctx;
}
