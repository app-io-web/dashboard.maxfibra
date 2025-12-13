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
  const { empresaId } = useSession(); // 👈 CONTEXTO (troca empresa = refetch)
  const [flags, setFlags] = useState<FlagsState>(() => getDefaults());
  const [loading, setLoading] = useState<boolean>(true);
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
    let active = true;

    try {
      setLoading(true);
      setError(null);

      // se não tem empresa selecionada, volta pro default e pronto
      if (!empresaId) {
        setFlags(getDefaults());
        return;
      }

      const results = await Promise.all(
        keys.map((key) =>
          api
            .get<{ key: string; value: boolean | null }>(`/system-settings/${key}`)
            .then((res) => res.data)
            .catch((err) => {
              if (err?.response?.status !== 404) {
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

      if (!active) return;

      setFlags({
        showNotificationTestButton: resolveFlag(
          DASHBOARD_SYSTEM_SETTINGS.showNotificationTestButton.key
        ),
        showShortcutsSection: resolveFlag(
          DASHBOARD_SYSTEM_SETTINGS.showShortcutsSection.key
        ),
        showNotesSection: resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showNotesSection.key),
        showBirthdayModal: resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showBirthdayModal.key),
      });
    } catch (err) {
      console.error("Erro ao carregar flags do dashboard:", err);
      setError("Erro ao carregar flags do dashboard.");
      setFlags(getDefaults());
    } finally {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [empresaId, keys]);

  // 👇 o ponto: mudou empresaId (contexto) -> recarrega flags
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (!empresaId) {
          if (isMounted) setFlags(getDefaults());
          return;
        }

        const results = await Promise.all(
          keys.map((key) =>
            api
              .get<{ key: string; value: boolean | null }>(`/system-settings/${key}`)
              .then((res) => res.data)
              .catch((err) => {
                if (err?.response?.status !== 404) {
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

        if (!isMounted) return;

        setFlags({
          showNotificationTestButton: resolveFlag(
            DASHBOARD_SYSTEM_SETTINGS.showNotificationTestButton.key
          ),
          showShortcutsSection: resolveFlag(
            DASHBOARD_SYSTEM_SETTINGS.showShortcutsSection.key
          ),
          showNotesSection: resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showNotesSection.key),
          showBirthdayModal: resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showBirthdayModal.key),
        });
      } catch (err) {
        console.error("Erro ao carregar flags do dashboard:", err);
        if (isMounted) {
          setError("Erro ao carregar flags do dashboard.");
          setFlags(getDefaults());
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [empresaId, keys]);

  return {
    ...flags,
    loading,
    error,
    reload,
  };
}
