// src/config/useEffects/useGlobalSettingsPermissions.ts
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import {
  canAccessGlobalSettings,
  type GlobalSettingsActionId,
} from "../globalSettingsPermissions";
import { getCurrentUser } from "../../lib/auth";

type EmpresaSettings = {
  global_permission_keys?: string[];
  // outros campos se quiser tipar
};

type EmpresaSettingsApiResponse = {
  empresaSettings?: EmpresaSettings | null;
  global_permission_keys?: string[];
};

export function useGlobalSettingsPermissions() {
  const [keys, setKeys] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 👇 começa pelas permissões que JÁ vieram no login (/login ou /me)
        const currentUser = getCurrentUser();
        let incoming: string[] = Array.isArray(currentUser?.permissions)
          ? currentUser!.permissions
          : [];

        // 🔎 tenta complementar com o que vier do /empresa/settings
        const res = await api.get<EmpresaSettingsApiResponse>("/empresa/settings");
        if (!isMounted) return;

        // topo direto
        if (Array.isArray(res.data.global_permission_keys)) {
          incoming = incoming.concat(res.data.global_permission_keys);
        }

        // dentro de empresaSettings
        const fromEmpresa = res.data.empresaSettings?.global_permission_keys;
        if (Array.isArray(fromEmpresa)) {
          incoming = incoming.concat(fromEmpresa);
        }

        // remove duplicadas
        const unique = Array.from(new Set(incoming));


        setKeys(unique);
      } catch (err) {
        console.error("[GLOBAL SETTINGS] erro ao carregar permissões:", err);
        if (!isMounted) return;
        setError("Erro ao carregar permissões globais.");
        setKeys([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const can = (action: GlobalSettingsActionId) =>
    canAccessGlobalSettings(keys || [], action);

  return {
    loading,
    error,
    keys: keys || [],
    can,
  };
}
