import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../contexts/SessionContext";
import { Clock3, ShieldCheck, X, ChevronLeft } from "lucide-react";

function toMs(dateIso: string) {
  const t = new Date(dateIso).getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function formatEndsAtBR(dateIso: string) {
  const d = new Date(dateIso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GraceNoticeToast() {
  const { licenseStatus } = useSession();

  const graceUntilIso: string | null =
    (licenseStatus as any)?.grace_until ??
    (licenseStatus as any)?.grace_expires_at ??
    (licenseStatus as any)?.grace?.expires_at ??
    null;

  const graceHours: number | null =
    (licenseStatus as any)?.grace_hours ??
    (licenseStatus as any)?.grace?.hours ??
    null;

  const graceReason: string | null =
    (licenseStatus as any)?.grace_reason ??
    (licenseStatus as any)?.grace?.reason ??
    null;

  const untilMs = useMemo(() => (graceUntilIso ? toMs(graceUntilIso) : 0), [graceUntilIso]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // ✅ chave única por grace (assim um grace novo abre “normal”)
  const storageKey = useMemo(() => {
    const k = graceUntilIso ? toMs(graceUntilIso) : 0;
    return `mx_grace_toast_state_${k}`;
  }, [graceUntilIso]);

  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(storageKey) === "min";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(storageKey, isMinimized ? "min" : "open");
  }, [storageKey, isMinimized]);

  const isActive = useMemo(() => {
    if (!graceUntilIso || !untilMs) return false;
    return untilMs > nowMs;
  }, [graceUntilIso, untilMs, nowMs]);

  useEffect(() => {
    if (!isActive) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isActive]);

  const remainingSeconds = useMemo(() => {
    if (!isActive) return 0;
    return Math.ceil((untilMs - nowMs) / 1000);
  }, [isActive, untilMs, nowMs]);

  const progressPct = useMemo(() => {
    if (!isActive) return 0;
    const hours = graceHours && Number.isFinite(graceHours) ? graceHours : null;
    if (!hours) return 0;
    const total = hours * 3600;
    const done = Math.min(total, Math.max(0, total - remainingSeconds));
    return Math.round((done / total) * 100);
  }, [isActive, graceHours, remainingSeconds]);

  if (!isActive) return null;

    // ✅ MODO MINIMIZADO — SOMENTE O ÍCONE
    if (isMinimized) {
    return (
        <div className="fixed bottom-4 right-2 z-[60]">
        <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className={[
            "group",
            "w-12 h-12",
            "grid place-items-center",
            "rounded-xl",
            "border border-amber-200",
            "bg-amber-50",
            "shadow-lg shadow-amber-500/20",
            // deixa só uma pontinha pra fora
            "translate-x-3 hover:translate-x-0",
            "transition-transform duration-200",
            ].join(" ")}
            aria-label="Liberação temporária ativa"
            title="Liberação temporária ativa"
        >
            <ShieldCheck className="w-5 h-5 text-amber-700" />
        </button>
        </div>
    );
    }


  // ✅ MODO ABERTO (modal/toast completo)
  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[320px] max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 grid place-items-center w-10 h-10 rounded-xl bg-amber-50 border border-amber-100">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 leading-5">
                  Liberação temporária ativa
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {graceHours
                    ? `Utilizando liberação temporária de ${graceHours}h`
                    : "Utilizando liberação temporária"}
                </p>
              </div>

              {/* agora o X MINIMIZA */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="shrink-0 rounded-lg p-1.5 hover:bg-slate-100 text-slate-500"
                aria-label="Minimizar aviso"
                title="Minimizar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-500" />
              <span className="font-mono text-sm text-slate-900">
                {formatHMS(remainingSeconds)}
              </span>
              {graceUntilIso ? (
                <span className="text-xs text-slate-500 ml-2 truncate">
                  até {formatEndsAtBR(graceUntilIso)}
                </span>
              ) : null}
            </div>

            {progressPct > 0 ? (
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${progressPct}%` }}
                    aria-label="Progresso da liberação temporária"
                  />
                </div>
              </div>
            ) : null}

            {graceReason ? (
              <p className="mt-3 text-xs text-slate-600 line-clamp-2">
                Motivo: <span className="text-slate-700">{graceReason}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
