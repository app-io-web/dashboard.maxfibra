import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { ApiShortcut } from "../../types/shortcut";

type UseDashboardShortcutsResult = {
  shortcuts: ApiShortcut[];
  shortcutsLoading: boolean;
  shortcutsError: string | null;
};

export function useDashboardShortcuts(): UseDashboardShortcutsResult {
  const [shortcuts, setShortcuts] = useState<ApiShortcut[]>([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(true);
  const [shortcutsError, setShortcutsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardShortcuts() {
      try {
        const res = await api.get("/shortcuts", {
          params: { onlyDashboard: true },
        });

        const apiShortcuts: ApiShortcut[] =
          res.data.shortcuts || res.data || [];

        if (isMounted) {
          setShortcuts(apiShortcuts);
        }
      } catch (err) {
        console.error("Erro ao carregar atalhos do dashboard:", err);
        if (isMounted) {
          setShortcutsError("Erro ao carregar atalhos.");
        }
      } finally {
        if (isMounted) {
          setShortcutsLoading(false);
        }
      }
    }

    loadDashboardShortcuts();

    return () => {
      isMounted = false;
    };
  }, []);

  return { shortcuts, shortcutsLoading, shortcutsError };
}
