// src/contexts/SessionContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../lib/api";

type EmpresaBranding = {
  display_name: string | null;
  logo_url: string | null;
};

type LicenseStatus = {
  has_license: boolean;
  is_paid: boolean;
  is_expired: boolean;
  is_valid_now: boolean;
  expires_at: string | null;
  starts_at?: string | null;
  license?: {
    id: string;
    name: string;
    duration_days: number;
    price_cents: number;
  } | null;
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

  // ✅ LICENÇA
  licenseStatus: LicenseStatus | null;
  licenseLoading: boolean;

  // ✅ bypass só pro "dev / dono" (pra você não aparecer o bloqueio)
  licenseBypass: boolean;

  // ✅ já considera o bypass
  licenseBlocked: boolean;

  refreshLicenseStatus: () => Promise<LicenseStatus | null>;
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
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const [empresaBranding, setEmpresaBranding] = useState<EmpresaBranding | null>(
    null
  );
  const [brandingLoading, setBrandingLoading] = useState(false);

  // ✅ LICENÇA
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);

  // ✅ bypass (dev)
  const [licenseBypass, setLicenseBypass] = useState(false);

  // ✅ padrão: toda request vai “saber” a empresa atual
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

  /**
   * ✅ PERMISSÕES NÃO PODEM DEPENDER DE empresaId,
   * senão no primeiro login o menu nasce travado.
   *
   * Usa /me como fonte de verdade e, se vier uma empresa padrão,
   * seta automaticamente.
   */
  const refreshPermissions = useCallback(async () => {
    try {
      setPermissionsLoading(true);

      const res = await api.get("/me");

      const user = res.data?.user ?? {};
      const perms = user?.permissions;
      setPermissions(Array.isArray(perms) ? perms : []);

      // ✅ BYPASS DE LICENÇA SÓ PRA VOCÊ (dev/dono)
      // Critério principal: can_manage_system_config (é o teu "modo antigo" que só você tem)
      // + alguns fallbacks seguros caso teu backend use outro campo
      const bypass =
        !!user?.can_manage_system_config ||
        !!user?.is_system_owner ||
        user?.role === "OWNER" ||
        user?.role === "SYSTEM_OWNER";

      setLicenseBypass(bypass);

      // ✅ tenta descobrir empresa padrão/atual pelo /me
      const suggestedEmpresaId =
        user?.empresa_id ??
        user?.auth_empresa_id ??
        res.data?.empresa_id ??
        res.data?.empresaId ??
        null;

      // só seta se ainda não tem empresa definida
      if (!empresaId && suggestedEmpresaId) {
        setEmpresaId(String(suggestedEmpresaId));
      }
    } catch (err) {
      console.error("[Session] erro ao atualizar permissions via /me:", err);
      setPermissions([]);
      setLicenseBypass(false);
    } finally {
      setPermissionsLoading(false);
    }
  }, [empresaId, setEmpresaId]);

  /**
   * Branding (usa /empresa/settings) — só faz sentido com empresaId.
   */
  const refreshBranding = useCallback(async () => {
    if (!empresaId) {
      setEmpresaBranding(null);
      document.title = "Central Admin";
      updateFavicon("/vite.svg");
      return;
    }

    try {
      setBrandingLoading(true);

      const res = await api.get<{ empresaSettings: EmpresaBranding | null }>(
        "/empresa/settings"
      );

      const b = res.data?.empresaSettings ?? null;
      setEmpresaBranding(b);

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
  }, [empresaId]);

  /**
   * ✅ LICENÇA (depende de empresaId por causa do x-empresa-id)
   */
  const refreshLicenseStatus = useCallback(async () => {
    if (!empresaId) {
      setLicenseStatus(null);
      return null;
    }

    try {
      setLicenseLoading(true);

      const res = await api.get<LicenseStatus>("/system/license/status");
      const data = res.data ?? null;

      setLicenseStatus(data);
      return data;
    } catch (err) {
      console.error("[Session] erro ao atualizar licença:", err);

      const fallback: LicenseStatus = {
        has_license: false,
        is_paid: false,
        is_expired: true,
        is_valid_now: false,
        expires_at: null,
        license: null,
      };
      setLicenseStatus(fallback);
      return fallback;
    } finally {
      setLicenseLoading(false);
    }
  }, [empresaId]);

  // ✅ 1) na primeira montagem: busca permissões logo de cara
  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  // ✅ 2) mudou empresa -> refaz branding + permissões + licença
  useEffect(() => {
    refreshBranding();
    refreshPermissions();
    refreshLicenseStatus();
  }, [empresaId, refreshBranding, refreshPermissions, refreshLicenseStatus]);

  const licenseBlocked = useMemo(() => {
    // se ainda nem carregou (null), não bloqueia de cara
    if (!licenseStatus) return false;

    // ✅ se você é "dev/dono", não bloqueia nunca (não mostra o modal/overlay)
    if (licenseBypass) return false;

    return !licenseStatus.is_valid_now;
  }, [licenseStatus, licenseBypass]);

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

      // ✅ licença
      licenseStatus,
      licenseLoading,
      licenseBypass,
      licenseBlocked,
      refreshLicenseStatus,
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
      licenseStatus,
      licenseLoading,
      licenseBypass,
      licenseBlocked,
      refreshLicenseStatus,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error("useSession precisa estar dentro de <SessionProvider />");
  return ctx;
}
