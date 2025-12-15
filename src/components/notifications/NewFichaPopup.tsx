// src/components/notifications/NewFichaPopup.tsx
import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, X } from "lucide-react";
import { useNotificationSound } from "../../hooks/useNotificationSound";
import { useGlobalSettingsPermissions } from "../../config/useEffects/useGlobalSettingsPermissions";

type FichaPayload = {
  protocolo?: string;
  fichaId?: string;
  plano?: string | null;
  cidade?: string | null;
  url?: string | null;
  nome?: string | null;
};

type PopupState = {
  open: boolean;
  title: string;
  body: string;
  payload: FichaPayload;
};

export function NewFichaPopup() {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const navigate = useNavigate();

  const { play: playFichaSound } = useNotificationSound(
    "/sounds/ficha-notification.mp3"
  );

  // 🔐 permissão global
  const { can: canGlobal } = useGlobalSettingsPermissions();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      //console.log("[NewFichaPopup] Service Worker não suportado.");
      return;
    }

    const handler = (event: MessageEvent) => {
      //console.log("[NewFichaPopup] Mensagem recebida do SW:", event.data);

      const data: any = event.data || {};

      if (data?.source !== "web-push") {
        //console.log("[NewFichaPopup] Ignorando mensagem (source != web-push)");
        return;
      }

      const type = data?.data?.type || data?.type;
      //console.log("[NewFichaPopup] Tipo da notificação:", type);

      if (type !== "cadastro_ficha") {
        //console.log(
          //"[NewFichaPopup] Ignorando mensagem (type != cadastro_ficha)"
        //);
        return;
      }

      // ✅ USA A ACTION, NÃO A KEY CRUA
      if (!canGlobal("notify_new_register")) {
        //console.log(
          //"[NewFichaPopup] Usuário sem permissão notify_new_register, ignorando popup."
       // );
        return;
      }



      const title = data.title || "Nova ficha cadastrada";
      const body = data.body || "";

      const urlFromMessage: string | undefined =
        data.url ||
        data.data?.url ||
        data.data?.redirectUrl ||
        undefined;

      const payload: FichaPayload = {
        protocolo: data.data?.protocolo,
        fichaId: data.data?.fichaId,
        plano: data.data?.plano,
        cidade: data.data?.cidade,
        url: urlFromMessage || null,
        nome: data.data?.nome,
      };

      //console.log("[NewFichaPopup] Payload da ficha recebido no popup:", payload);

      setPopup({
        open: true,
        title,
        body,
        payload,
      });

      playFichaSound();
    };

    //console.log("[NewFichaPopup] Registrando listener de message do SW");
    navigator.serviceWorker.addEventListener("message", handler);

    return () => {
      //console.log("[NewFichaPopup] Removendo listener de message do SW");
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [playFichaSound, canGlobal]); // pode recompor, sem problema

  useEffect(() => {
    if (!popup?.open) return;
    const timer = setTimeout(() => {
      setPopup((prev) => (prev ? { ...prev, open: false } : prev));
    }, 8000);
    return () => clearTimeout(timer);
  }, [popup?.open]);

  if (!popup?.open) return null;

  const goToFicha = () => {
    if (!popup) return;

    const { payload } = popup;
    let dest: string | null = null;

    if (payload.fichaId) {
      dest = `/services/clientes/${payload.fichaId}`;
    } else if (payload.url) {
      dest = payload.url;

      if (/^https?:\/\//i.test(dest)) {
        //console.log(
        //  "[NewFichaPopup] Navegando (full) para URL absoluta da ficha:",
          dest
       // );
        setPopup((prev) => (prev ? { ...prev, open: false } : prev));
        window.location.href = dest;
        return;
      }

      if (!dest.startsWith("/")) {
        dest = "/" + dest;
      }
    }

    if (!dest) {
      dest = "/cadastro-fichas";
    }

    //console.log("[NewFichaPopup] Navegando via React Router para:", dest);

    setPopup((prev) => (prev ? { ...prev, open: false } : prev));
    navigate(dest);
  };

  const close = (e?: MouseEvent<HTMLButtonElement>) => {
    if (e) e.stopPropagation();
    setPopup((prev) => (prev ? { ...prev, open: false } : prev));
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div
        role="button"
        tabIndex={0}
        onClick={goToFicha}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            goToFicha();
          }
        }}
        className="group flex w-80 items-start gap-3 rounded-2xl border border-blue-100 bg-white/95 p-4 text-left shadow-lg shadow-blue-100/40 ring-1 ring-blue-50 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl cursor-pointer"
      >
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
          <FileText className="h-5 w-5 text-blue-500" />
        </div>

        <div className="flex-1 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
            Nova ficha recebida
          </p>

          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
            {popup.title}
          </p>

          <p className="text-xs text-slate-600 line-clamp-2">{popup.body}</p>

          {(popup.payload.protocolo ||
            popup.payload.plano ||
            popup.payload.cidade) && (
            <p className="text-[11px] text-slate-500">
              {popup.payload.protocolo && (
                <span className="font-mono">{popup.payload.protocolo}</span>
              )}
              {popup.payload.plano && <> · Plano {popup.payload.plano}</>}
              {popup.payload.cidade && <> · {popup.payload.cidade}</>}
            </p>
          )}

          <span className="inline-flex items-center text-[11px] font-medium text-blue-500">
            Ver ficha
            <span className="ml-1 text-[13px]">↗</span>
          </span>
        </div>

        <div className="ml-2">
          <button
            type="button"
            onClick={close}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
