import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useSession } from "../../contexts/SessionContext";
import {
  canAccessGlobalSettings,
  type GlobalSettingsActionId,
} from "../globalSettingsPermissions";

type EmpresaSettings = {
  global_permission_keys?: string[];
};

type EmpresaSettingsApiResponse = {
  empresaSettings?: EmpresaSettings | null;
  global_permission_keys?: string[];
};

export function useGlobalSettingsPermissions() {
  const { empresaId, permissions, permissionsLoading } = useSession();

  const [extraKeys, setExtraKeys] = useState<string[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseKeys = useMemo(
    () => (Array.isArray(permissions) ? permissions : []),
    [permissions]
  );

  const reloadExtra = useCallback(async () => {
    try {
      setLoadingExtra(true);
      setError(null);

      // Sem empresa selecionada, não tem o que buscar de /empresa/settings
      if (!empresaId) {
        setExtraKeys([]);
        return;
      }

      const res = await api.get<EmpresaSettingsApiResponse>("/empresa/settings");

      const incoming: string[] = [];

      if (Array.isArray(res.data.global_permission_keys)) {
        incoming.push(...res.data.global_permission_keys);
      }

      const fromEmpresa = res.data.empresaSettings?.global_permission_keys;
      if (Array.isArray(fromEmpresa)) {
        incoming.push(...fromEmpresa);
      }

      setExtraKeys(Array.from(new Set(incoming)));
    } catch (err) {
      console.error("[GLOBAL SETTINGS] erro ao carregar permissões extras:", err);
      setError("Erro ao carregar permissões globais.");
      setExtraKeys([]);
    } finally {
      setLoadingExtra(false);
    }
  }, [empresaId]);

  // 🔥 mudou empresa (contexto) -> refaz o extra (porque /empresa/settings depende da empresa)
  useEffect(() => {
    reloadExtra();
  }, [reloadExtra]);

  // merge final (contexto + extras)
  const keys = useMemo(() => {
    return Array.from(new Set([...baseKeys, ...extraKeys]));
  }, [baseKeys, extraKeys]);

  const can = useCallback(
    (action: GlobalSettingsActionId) => canAccessGlobalSettings(keys, action),
    [keys]
  );

  return {
    loading: permissionsLoading || loadingExtra,
    error,
    keys,
    can,
    reload: reloadExtra, // caso você altere settings e queira refletir na hora
  };
}
