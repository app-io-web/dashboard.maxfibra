import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { ApiShortcut } from "../../types/shortcut";

type UseDashboardShortcutsResult = {
  shortcuts: ApiShortcut[];
  shortcutsLoading: boolean;
  shortcutsError: string | null;
};

export function useDashboardShortcuts(
  empresaId: string | null
): UseDashboardShortcutsResult {
  const [shortcuts, setShortcuts] = useState<ApiShortcut[]>([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(true);
  const [shortcutsError, setShortcutsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardShortcuts() {
      if (!empresaId) {
        setShortcuts([]);
        setShortcutsLoading(false);
        setShortcutsError(null);
        return;
      }

      try {
        setShortcutsLoading(true);
        setShortcutsError(null);

        const res = await api.get("/shortcuts", {
          params: { onlyDashboard: true, _ts: Date.now() }, // cache-buster
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const apiShortcuts: ApiShortcut[] =
          res.data?.shortcuts || res.data || [];

        if (isMounted) {
          setShortcuts(apiShortcuts);
        }
      } catch (err) {
        console.error("Erro ao carregar atalhos do dashboard:", err);
        if (isMounted) {
          setShortcuts([]);
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
  }, [empresaId]);

  return { shortcuts, shortcutsLoading, shortcutsError };
}
