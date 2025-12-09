// src/config/useEffects/useUserSettingsPermissionFlags.ts
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { buildUserSettingsPermissionFlags } from "../userSettingsPermissions";

export function useUserSettingsPermissionFlags() {
  // começa tudo falso
  const [flags, setFlags] = useState(
    () => buildUserSettingsPermissionFlags([])
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchPermissions() {
      try {
        // 🔧 AJUSTA ESSE ENDPOINT PRO QUE VOCÊ JÁ TIVER AÍ
        // ideia: rota que retorna as permission_keys do usuário
        // SÓ PRA ÁREA "user_settings"
        const res = await api.get<{ permission_keys: string[] }>(
          "/me/permissions/user-settings"
        );

        if (!isMounted) return;
        const keys = res.data.permission_keys || [];
        setFlags(buildUserSettingsPermissionFlags(keys));
      } catch (err) {
        console.error("[UserSettings] erro ao carregar permissões:", err);
        if (!isMounted) return;
        // se der erro, deixa tudo falso mesmo
        setFlags(buildUserSettingsPermissionFlags([]));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  return { ...flags, loading };
}
