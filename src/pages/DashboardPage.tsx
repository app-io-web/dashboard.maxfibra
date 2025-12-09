import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { DashboardNoteCard } from "../components/notes/DashboardNoteCard";
import { DashboardShortcutCard } from "../components/shortcuts/DashboardShortcutCard";
import { BirthdayAlertModal } from "../components/birthdays/BirthdayAlertModal";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { BellRing } from "lucide-react";

import { useDashboardFlags } from "../config/useEffects/useDashboardFlags";
import { useDashboardPinnedNotes } from "../config/useEffects/useDashboardPinnedNotes";
import { useDashboardShortcuts } from "../config/useEffects/useDashboardShortcuts";
import { useDashboardBirthdays } from "../config/useEffects/useDashboardBirthdays";

// 👇 novo hook pra permissões globais
import { useGlobalSettingsPermissions } from "../config/useEffects/useGlobalSettingsPermissions";

// 👇 card novo de monitoramento SmartOLT
import { MonitoringEquipmentSummaryCard } from "../components/monitoramento/MonitoringEquipmentSummaryCard";

type ServerStatus = {
  id: string;
  name: string;
  status: "online" | "warning" | "offline";
  latencyMs: number;
};

// se quiser, depois esses também podem virar API
const mockServers: ServerStatus[] = [
  { id: "1", name: "VPS Principal", status: "online", latencyMs: 42 },
  { id: "2", name: "Servidor Backup", status: "warning", latencyMs: 180 },
];

export function DashboardPage() {
  const totalOnline = mockServers.filter((s) => s.status === "online").length;

  // 👉 contadores reais do SmartOLT (desligados / LOS)
  const [offlineCount, setOfflineCount] = useState(0);
  const [losCount, setLosCount] = useState(0);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSmartOltSummary() {
      try {
        setMonitoringError(null);

        const [offRes, losRes] = await Promise.all([
          api.get("/monitoring/smart-short-olt"),
          api.get("/monitoring/smart-short-olt-los"),
        ]);

        if (cancelled) return;

        const off = Array.isArray(offRes.data?.onus)
          ? offRes.data.onus.length
          : 0;

        const los = Array.isArray(losRes.data?.onus)
          ? losRes.data.onus.length
          : 0;

        setOfflineCount(off);
        setLosCount(los);
      } catch (err) {
        console.error("Erro ao carregar resumo SmartOLT:", err);
        if (!cancelled) {
          setMonitoringError("Não foi possível carregar o resumo do SmartOLT.");
          setOfflineCount(0);
          setLosCount(0);
        }
      }
    }

    loadSmartOltSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  // 👉 registra SW + subscription
  usePushNotifications();

  // FLAGS (config do sistema)
  const {
    showNotificationTestButton,
    showShortcutsSection,
    showNotesSection,
    showBirthdayModal,
  } = useDashboardFlags();

  // NOTAS
  const { notes, notesLoading, notesError } = useDashboardPinnedNotes();

  // ATALHOS
  const { shortcuts, shortcutsLoading, shortcutsError } =
    useDashboardShortcuts();

  // ANIVERSARIANTES
  const { birthdaysToday, birthdaysError } = useDashboardBirthdays();

  // PERMISSÕES GLOBAIS (RBAC) – inclui notify_birthday
  const { can: canGlobal } = useGlobalSettingsPermissions();
  const canSeeBirthdayNotification = canGlobal("notify_birthday");

  // estado local da ação de teste de notificação
  const [testNotifLoading, setTestNotifLoading] = useState(false);
  const [testNotifError, setTestNotifError] = useState<string | null>(null);

  async function handleTestNotification() {
    try {
      setTestNotifLoading(true);
      setTestNotifError(null);

      await api.post("/notifications/test", {
        title: "Central Admin - Teste",
        body: "Se você está vendo isso, as notificações estão funcionando 😎",
        url: window.location.origin,
      });

      console.log("Requisição de teste de notificação enviada.");
    } catch (err) {
      console.error("Erro ao disparar notificação de teste:", err);
      setTestNotifError("Erro ao disparar notificação de teste.");
    } finally {
      setTestNotifLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Modal de alerta de aniversariante */}
      {showBirthdayModal &&
        canSeeBirthdayNotification &&
        birthdaysToday.length > 0 && (
          <BirthdayAlertModal birthdaysToday={birthdaysToday} />
        )}

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Visão geral</h2>
          <p className="text-sm text-slate-600 mt-1">
            Resumo rápido da saúde da infraestrutura, informações do dia e notas
            destacadas.
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 md:items-end">
          {testNotifError && (
            <p className="text-xs text-red-500">{testNotifError}</p>
          )}

          {showNotificationTestButton && (
            <button
              onClick={handleTestNotification}
              disabled={testNotifLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 transition disabled:opacity-60"
            >
              <BellRing className="h-4 w-4" />
              {testNotifLoading ? "Enviando..." : "Testar notificação"}
            </button>
          )}
        </div>
      </header>

      {/* Cards rápidos */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Servidores online */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Servidores online
          </p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">
            {totalOnline}/{mockServers.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Monitorando servidores cadastrados na central.
          </p>
        </div>

        {/* Monitoramento de equipamentos (SmartOLT) */}
        <div className="flex flex-col gap-1">
          <MonitoringEquipmentSummaryCard
            offlineCount={offlineCount}
            losCount={losCount}
          />
          {monitoringError && (
            <p className="text-[11px] text-red-500 mt-1">{monitoringError}</p>
          )}
        </div>

        {/* Aniversariantes de hoje */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Aniversariantes de hoje
          </p>
          <p className="mt-2 text-3xl font-semibold text-sky-600">
            {birthdaysToday.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Equipe sempre lembrada, clima organizacional agradece.
          </p>
          {birthdaysError && (
            <p className="mt-1 text-xs text-red-500">{birthdaysError}</p>
          )}
        </div>
      </div>

      {/* Últimos servidores + Aniversariantes */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* aqui entram seus cards de servidores e lista de aniversariantes, igual antes */}
      </section>

      {/* Atalhos rápidos (dashboard) – controlado pela flag */}
      {showShortcutsSection && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Atalhos rápidos (dashboard)
            </h3>
          </div>

          {shortcutsLoading ? (
            <p className="text-sm text-slate-500">
              Carregando atalhos do dashboard...
            </p>
          ) : shortcutsError ? (
            <p className="text-sm text-red-500">{shortcutsError}</p>
          ) : shortcuts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum atalho marcado para aparecer no dashboard ainda.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {shortcuts.map((shortcut) => (
                <DashboardShortcutCard key={shortcut.id} shortcut={shortcut} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Notas rápidas (dashboard) – controlado pela flag */}
      {showNotesSection && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Notas rápidas (dashboard)
            </h3>
          </div>

          {notesLoading ? (
            <p className="text-sm text-slate-500">
              Carregando notas destacadas...
            </p>
          ) : notesError ? (
            <p className="text-sm text-red-500">{notesError}</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma nota marcada para aparecer no dashboard ainda.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => (
                <DashboardNoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
