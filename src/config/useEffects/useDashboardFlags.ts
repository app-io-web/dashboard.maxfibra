import { useEffect, useState } from "react";
import { api } from "../../lib/api";
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
};

export function useDashboardFlags(): UseDashboardFlagsResult {
  const [showNotificationTestButton, setShowNotificationTestButton] =
    useState<boolean>(
      getDashboardDefaultForKey(
        DASHBOARD_SYSTEM_SETTINGS.showNotificationTestButton.key
      )
    );

  const [showShortcutsSection, setShowShortcutsSection] = useState<boolean>(
    getDashboardDefaultForKey(
      DASHBOARD_SYSTEM_SETTINGS.showShortcutsSection.key
    )
  );

  const [showNotesSection, setShowNotesSection] = useState<boolean>(
    getDashboardDefaultForKey(DASHBOARD_SYSTEM_SETTINGS.showNotesSection.key)
  );

  const [showBirthdayModal, setShowBirthdayModal] = useState<boolean>(
    getDashboardDefaultForKey(
      DASHBOARD_SYSTEM_SETTINGS.showBirthdayModal.key
    )
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFlags() {
      const keys: DashboardSystemSettingKey[] = [
        DASHBOARD_SYSTEM_SETTINGS.showNotificationTestButton.key,
        DASHBOARD_SYSTEM_SETTINGS.showShortcutsSection.key,
        DASHBOARD_SYSTEM_SETTINGS.showNotesSection.key,
        DASHBOARD_SYSTEM_SETTINGS.showBirthdayModal.key,
      ];

      try {
        setLoading(true);
        setError(null);

        const results = await Promise.all(
          keys.map((key) =>
            api
              .get<{ key: string; value: boolean | null }>(
                `/system-settings/${key}`
              )
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
          if (typeof found?.value === "boolean") {
            return found.value;
          }
          return getDashboardDefaultForKey(settingKey);
        };

        if (!isMounted) return;

        setShowNotificationTestButton(
          resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showNotificationTestButton.key)
        );
        setShowShortcutsSection(
          resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showShortcutsSection.key)
        );
        setShowNotesSection(
          resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showNotesSection.key)
        );
        setShowBirthdayModal(
          resolveFlag(DASHBOARD_SYSTEM_SETTINGS.showBirthdayModal.key)
        );

      } catch (err) {
        console.error("Erro ao carregar flags do dashboard:", err);
        if (isMounted) {
          setError("Erro ao carregar flags do dashboard.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFlags();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    showNotificationTestButton,
    showShortcutsSection,
    showNotesSection,
    showBirthdayModal,
    loading,
    error,
  };
}
