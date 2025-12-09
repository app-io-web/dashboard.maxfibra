// src/components/notifications/SmartOltAutomationPopup.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, X } from "lucide-react";
import { useNotificationSound } from "./../../hooks/useNotificationSound";
import { useGlobalSettingsPermissions } from "../../config/useEffects/useGlobalSettingsPermissions";
import { useMonitoringPermissions } from "../../config/useEffects/useMonitoringPermissions";

type AutomationKind = "ONU_OFF" | "ONU_LOS";

type SmartOltPayload = {
  totalOnus?: number;
  offlineCount?: number;
  losCount?: number;
  startedAt?: string;
  finishedAt?: string;
};

type PopupState = {
  open: boolean;
  kind: AutomationKind;
  title: string;
  body: string;
  payload?: SmartOltPayload;
};

type SmartOltMessageData = {
  source?: string;
  type?: "smart_olt_onu_finished" | "smart_olt_los_finished" | string;
  payload?: SmartOltPayload;
  data?: {
    type?: "smart_olt_onu_finished" | "smart_olt_los_finished" | string;
    payload?: SmartOltPayload;
    [key: string]: any;
  };
  [key: string]: any;
};

export function SmartOltAutomationPopup() {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const navigate = useNavigate();

  // 🔊 som para ONUs desligadas
  const { play: playOnuOffSound } = useNotificationSound(
    "/sounds/notification.mp3",
    0.9
  );

  // 🔊 som para ONUs com LOS
  const { play: playLosSound } = useNotificationSound(
    "/sounds/notification.mp3",
    0.9
  );

  // 🔐 permissões globais: LOS e PowerOff (notificação)
  const { can: canGlobal, keys } = useGlobalSettingsPermissions();

  // 🔐 permissões de monitoramento (botão de relatório detalhado)
  const { canViewIxcReportButton, canEditIxcReportButton } =
    useMonitoringPermissions();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.log("[SmartOltPopup] Service Worker não suportado.");
      return;
    }

    const handler = (event: MessageEvent) => {
      console.log("[SmartOltPopup] Mensagem recebida do SW:", event.data);

      const raw: SmartOltMessageData = (event.data as any) || {};

      if (raw?.source !== "web-push") {
        console.log("[SmartOltPopup] Ignorando mensagem (source != web-push)");
        return;
      }

      const type = raw?.data?.type || raw?.type;
      const payload: SmartOltPayload =
        raw?.data?.payload || raw?.payload || {};

      console.log("[SmartOltPopup] Tipo da notificação:", type);
      console.log("[SmartOltPopup] Payload recebido:", payload);

      // 👇 se NÃO existir nenhuma permissão global cadastrada ainda,
      // a gente libera geral (fallback de desenvolvimento)
      const hasGlobalConfig = Array.isArray(keys) && keys.length > 0;

      if (type === "smart_olt_onu_finished") {
        const allowed = hasGlobalConfig ? canGlobal("notify_power_off") : true;

        console.log("[SmartOltPopup] Check notify_power_off =>", {
          hasGlobalConfig,
          allowed,
        });

        if (!allowed) {
          console.log(
            "[SmartOltPopup] Usuário sem permissão notify_power_off, ignorando notificação de ONUs desligadas."
          );
          return;
        }

        const offline = payload.offlineCount ?? 0;
        const total = payload.totalOnus ?? 0;

        setPopup({
          open: true,
          kind: "ONU_OFF",
          title: "SmartOLT – Verificação de ONUs desligadas finalizada",
          body:
            total > 0
              ? `Foram verificadas ${total} ONUs. ${offline} encontradas desligadas.`
              : `Automação de ONUs desligadas finalizada.`,
          payload,
        });

        playOnuOffSound();
        return;
      }

      if (type === "smart_olt_los_finished") {
        const allowed = hasGlobalConfig ? canGlobal("notify_los") : true;

        console.log("[SmartOltPopup] Check notify_los =>", {
          hasGlobalConfig,
          allowed,
        });

        if (!allowed) {
          console.log(
            "[SmartOltPopup] Usuário sem permissão notify_los, ignorando notificação de LOS."
          );
          return;
        }

        const los = payload.losCount ?? 0;
        const total = payload.totalOnus ?? 0;

        setPopup({
          open: true,
          kind: "ONU_LOS",
          title: "SmartOLT – Verificação de ONUs com LOS finalizada",
          body:
            total > 0
              ? `Foram verificadas ${total} ONUs. ${los} com LOS ativo.`
              : `Automação de ONUs com LOS finalizada.`,
          payload,
        });

        playLosSound();
        return;
      }

      console.log(
        "[SmartOltPopup] Ignorando mensagem (type desconhecido):",
        type
      );
    };

    console.log("[SmartOltPopup] Registrando listener de message do SW");
    navigator.serviceWorker.addEventListener("message", handler);

    return () => {
      console.log("[SmartOltPopup] Removendo listener de message do SW");
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [playOnuOffSound, playLosSound, canGlobal, keys]);

  useEffect(() => {
    if (!popup?.open) return;
    const timer = setTimeout(() => {
      setPopup((prev) => (prev ? { ...prev, open: false } : prev));
    }, 8000);
    return () => clearTimeout(timer);
  }, [popup?.open]);

  if (!popup || !popup.open) return null;

  const isLos = popup.kind === "ONU_LOS";

  const handleClose = () => {
    setPopup((prev) => (prev ? { ...prev, open: false } : prev));
  };

  const handleViewDetails = () => {
    // segurança extra: se não puder editar / acessar relatório, não navega
    if (!canEditIxcReportButton) {
      console.log(
        "[SmartOltPopup] Usuário sem permissão de escrita no relatório IXC, bloqueando navegação."
      );
      return;
    }

    const search =
      popup.kind === "ONU_OFF" ? "?tipo=power_off" : "?tipo=los";

    navigate(`/monitoramento/smart-olt-relatorio${search}`);
    handleClose();
  };

  const showReportButton = canViewIxcReportButton;
  const reportDisabled = !canEditIxcReportButton;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm animate-[slide-up_0.25s_ease-out]">
      <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm">
        <div className="flex items-start gap-3 p-4">
          <div
            className={
              "mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl " +
              (isLos
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : "bg-emerald-50 text-emerald-600 border border-emerald-100")
            }
          >
            {isLos ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Activity className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Notificação de Automação
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {popup.title}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1.5 text-xs text-slate-600">{popup.body}</p>

            {popup.payload && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                {typeof popup.payload.totalOnus === "number" && (
                  <span className="rounded-full bg-slate-50 px-2 py-0.5 border border-slate-100">
                    Total ONUs: {popup.payload.totalOnus}
                  </span>
                )}
                {typeof popup.payload.offlineCount === "number" && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 border border-rose-100 text-rose-600">
                    Desligadas: {popup.payload.offlineCount}
                  </span>
                )}
                {typeof popup.payload.losCount === "number" && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 border border-amber-100 text-amber-700">
                    Com LOS: {popup.payload.losCount}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Fechar
              </button>

              {showReportButton && (
                <button
                  type="button"
                  onClick={handleViewDetails}
                  disabled={reportDisabled}
                  className={
                    "rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition " +
                    (reportDisabled
                      ? "bg-emerald-100 text-emerald-300 cursor-not-allowed"
                      : "bg-emerald-500 text-white hover:bg-emerald-600")
                  }
                >
                  Ver relatório detalhado
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
