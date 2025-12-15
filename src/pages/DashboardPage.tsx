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

// Permissões globais
import { useGlobalSettingsPermissions } from "../config/useEffects/useGlobalSettingsPermissions";

// Card SmartOLT
import { MonitoringEquipmentSummaryCard } from "../components/monitoramento/MonitoringEquipmentSummaryCard";
import { useSession } from "../contexts/SessionContext"; // ajuste o path se necessário


export function DashboardPage() {
  // 👉 contadores reais do SmartOLT (desligados / LOS)
  const [offlineCount, setOfflineCount] = useState(0);
  const [losCount, setLosCount] = useState(0);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const { empresaId } = useSession();

  // 👉 quando a empresa NÃO tem monitoramento configurado / sem dados
  const [monitoringUnavailable, setMonitoringUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSmartOltSummary() {
      try {
        setMonitoringError(null);
        setMonitoringUnavailable(false);

        const [offRes, losRes] = await Promise.all([
          api.get("/monitoring/smart-short-olt"),
          api.get("/monitoring/smart-short-olt-los"),
        ]);

        if (cancelled) return;

        const offOnus = Array.isArray(offRes.data?.onus)
          ? offRes.data.onus
          : [];
        const losOnus = Array.isArray(losRes.data?.onus)
          ? losRes.data.onus
          : [];

        // 👉 se não veio NENHUMA ONU pra essa empresa, tratamos como
        // "monitoramento não ativo pra empresa selecionada"
        if (offOnus.length === 0 && losOnus.length === 0) {
          setMonitoringUnavailable(true);
          setOfflineCount(0);
          setLosCount(0);
          return;
        }

        setOfflineCount(offOnus.length);
        setLosCount(losOnus.length);
        setMonitoringUnavailable(false);
      } catch (err: any) {
        console.error("Erro ao carregar resumo SmartOLT:", err);

        if (cancelled) return;

        const status = err?.response?.status;

        // 👉 se o backend responder 404/403, consideramos que essa empresa
        // não tem monitoramento configurado
        if (status === 404 || status === 403) {
          setMonitoringUnavailable(true);
          setMonitoringError(null);
          setOfflineCount(0);
          setLosCount(0);
        } else {
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
  }, [empresaId]);

  // 👉 registra SW + subscription
  usePushNotifications();

  // FLAGS
  const {
    showNotificationTestButton,
    showShortcutsSection,
    showNotesSection,
    showBirthdayModal,
  } = useDashboardFlags();

  // NOTAS
  const { notes, notesLoading, notesError } = useDashboardPinnedNotes(empresaId); // ✅


  // ATALHOS
  const { shortcuts, shortcutsLoading, shortcutsError } =
    useDashboardShortcuts(empresaId);
  // ANIVERSARIANTES
  const { birthdaysToday, birthdaysError } = useDashboardBirthdays(empresaId);


  // PERMISSÕES GLOBAIS (RBAC)
  const { can: canGlobal } = useGlobalSettingsPermissions();
  const canSeeBirthdayNotification = canGlobal("notify_birthday");

  // botão testar notificação
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
      {/* Modal de alerta de aniversariantes */}
      {showBirthdayModal &&
        canSeeBirthdayNotification &&
        birthdaysToday.length > 0 && (
          <BirthdayAlertModal birthdaysToday={birthdaysToday} />
        )}

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Visão geral</h2>
          <p className="text-sm text-slate-600 mt-1">
            Resumo rápido do sistema, informações do dia e notas destacadas.
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
              className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-100 hover:bg-blue-500/20 transition disabled:opacity-60"
            >
              <BellRing className="h-4 w-4" />
              {testNotifLoading ? "Enviando..." : "Testar notificação"}
            </button>
          )}
        </div>
      </header>

      {/* Cards rápidos */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* CARD 1 – Servidores online (mock) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Servidores online
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-400">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Monitoramento de servidores ainda não está ativo
            para a empresa selecionada.
          </p>
        </div>

        {/* CARD 2 – SmartOLT */}
        <div className="flex flex-col gap-1">
          {monitoringUnavailable ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm h-full flex flex-col justify-center">
              <p className="text-xs font-medium text-slate-500 uppercase">
                Monitoramento de equipamentos
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Não há monitoramento ativo de equipamentos
                para a empresa selecionada.
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Configure o SmartOLT para esta empresa para visualizar
                os desligados e com LOS aqui.
              </p>
            </div>
          ) : (
            <>
              <MonitoringEquipmentSummaryCard
                offlineCount={offlineCount}
                losCount={losCount}
              />
              {monitoringError && (
                <p className="text-[11px] text-red-500 mt-1">
                  {monitoringError}
                </p>
              )}
            </>
          )}
        </div>

        {/* CARD 3 – Aniversariantes */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Aniversariantes de hoje
          </p>
          <p className="mt-2 text-3xl font-semibold text-sky-600">
            {birthdaysToday.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Celebrando a equipe com carinho.
          </p>
          {birthdaysError && (
            <p className="mt-1 text-xs text-red-500">{birthdaysError}</p>
          )}
        </div>
      </div>

      {/* Outras seções — seguem iguais */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Cards etc */}
      </section>

      {showShortcutsSection && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Atalhos rápidos (dashboard)
            </h3>
          </div>

          {shortcutsLoading ? (
            <p className="text-sm text-slate-500">Carregando atalhos...</p>
          ) : shortcutsError ? (
            <p className="text-sm text-red-500">{shortcutsError}</p>
          ) : shortcuts.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum atalho marcado.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {shortcuts.map((shortcut) => (
                <DashboardShortcutCard key={shortcut.id} shortcut={shortcut} />
              ))}
            </div>
          )}
        </section>
      )}

      {showNotesSection && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Notas rápidas (dashboard)
            </h3>
          </div>

          {notesLoading ? (
            <p className="text-sm text-slate-500">Carregando notas...</p>
          ) : notesError ? (
            <p className="text-sm text-red-500">{notesError}</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma nota marcada ainda.
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
