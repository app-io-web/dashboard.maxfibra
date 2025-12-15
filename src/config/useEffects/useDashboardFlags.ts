import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useSession } from "../../contexts/SessionContext";
import {
  DASHBOARD_SYSTEM_SETTINGS,
  getDashboardDefaultForKey,
  type DashboardSystemSettingKey,
} from "../dashboardSettings";

type UseDashboardFlagsResult = {
  showNotificationTestButton: boolean;
  showShortcutsSection: boolean;
  showNotesSection: boolean;
  showBirthdayModal: boolean;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

type FlagsState = {
  showNotificationTestButton: boolean;
  showShortcutsSection: boolean;
  showNotesSection: boolean;
  showBirthdayModal: boolean;
};

function getDefaults(): FlagsState {
  return {
    showNotificationTestButton: getDashboardDefaultForKey(
      DASHBOARD_SYSTEM_SETTINGS.showNotificationTestButton.key
    ),
    showShortcutsSection: getDashboardDefaultForKey(
      DASHBOARD_SYSTEM_SETTINGS.showShortcutsSection.key
    ),
    showNotesSection: getDashboardDefaultForKey(
      DASHBOARD_SYSTEM_SETTINGS.showNotesSection.key
    ),
    showBirthdayModal: getDashboardDefaultForKey(
      DASHBOARD_SYSTEM_SETTINGS.showBirthdayModal.key
    ),
  };
}

export function useDashboardFlags(): UseDashboardFlagsResult {
  const { empresaId } = useSession();
  const [flags, setFlags] = useState<FlagsState>(() => getDefaults());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keys = useMemo<DashboardSystemSettingKey[]>(
    () => [
      DASHBOARD_SYSTEM_SETTINGS.showNotificationTestButton.key,
      DASHBOARD_SYSTEM_SETTINGS.showShortcutsSection.key,
      DASHBOARD_SYSTEM_SETTINGS.showNotesSection.key,
      DASHBOARD_SYSTEM_SETTINGS.showBirthdayModal.key,
    ],
    []
  );

  const reload = useCallback(async () => {
    // sem empresa? volta pro default
    if (!empresaId) {
      setFlags(getDefaults());
      setLoading(false);
      setError(null);
      return;
    }

    // AbortController pra cancelar chamadas se trocar empresa rápido
    const controller = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const results = await Promise.all(
        keys.map((key) =>
          api
            .get<{ key: string; value: boolean | null }>(`/system-settings/${key}`, {
              signal: controller.signal,
              headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
              params: { _ts: Date.now() },
            })
            .then((res) => res.data)
            .catch((err) => {
              // 404 = setting não existe -> usa default
              if (err?.response?.status !== 404 && err?.name !== "CanceledError") {
                console.error("Erro ao carregar flag", key, err);
              }
              return { key, value: null };
            })
        )
      );

      const resolveFlag = (settingKey: DashboardSystemSettingKey) => {
        const found = results.find((r) => r.key === settingKey);
        if (typeof found?.value === "boolean") return found.value;
        return getDashboardDefaultForKey(settingKey);
      };

      setFlags({
        showNotificationTestButton: resolveFlag(
          DASHBOARD_SYSTEM_SETTINGS.showNotificationTestButton.key
        ),
        showShortcutsSection: resolveFlag(
          DASHBOARD_SYSTEM_SETTINGS.showShortcutsSection.key
        ),
        showNotesSection: resolveFlag(
          DASHBOARD_SYSTEM_SETTINGS.showNotesSection.key
        ),
        showBirthdayModal: resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showBirthdayModal.key),
      });
    } catch (err: any) {
      // se foi cancelado, ignora
      if (err?.name === "CanceledError") return;

      console.error("Erro ao carregar flags do dashboard:", err);
      setError("Erro ao carregar flags do dashboard.");
      setFlags(getDefaults());
    } finally {
      setLoading(false);
    }

    // se quiser cancelar manualmente (raramente precisa), expõe controller.abort fora
  }, [empresaId, keys]);

  // mudou empresa -> recarrega flags
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive) return;
      await reload();
    })();

    return () => {
      alive = false;
    };
  }, [reload]);

  return { ...flags, loading, error, reload };
}
