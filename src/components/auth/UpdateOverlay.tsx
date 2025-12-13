import { useEffect, useRef, useState } from "react";

type Step = {
  label: string;
  done: boolean;
};

type Props = {
  open: boolean;
  title?: string;
  steps: Step[];
  minDurationMs?: number;
};

export function UpdateOverlay({
  open,
  title,
  steps,
  minDurationMs = 1400, // tempo psicológico profissional™
}: Props) {
  const [visible, setVisible] = useState(false);
  const openedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
      setVisible(true);
      return;
    }

    if (!open && openedAtRef.current) {
      const elapsed = Date.now() - openedAtRef.current;
      const remaining = Math.max(minDurationMs - elapsed, 0);

      const timer = setTimeout(() => {
        setVisible(false);
        openedAtRef.current = null;
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [open, minDurationMs]);

  if (!visible) return null;

  // 🔢 progresso real
  const doneCount = steps.filter((s) => s.done).length;
  const pctRaw = Math.round(
    (doneCount / Math.max(steps.length, 1)) * 100
  );

  // ✅ quando open=false, força finalização visual
  const pct = open ? pctRaw : 100;
  const displaySteps = open
    ? steps
    : steps.map((s) => ({ ...s, done: true }));

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {title ?? "Atualizando a Central…"}
            </div>
            <div className="text-xs text-slate-500">
              Não fecha a aba — isso pode levar alguns minutos.
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500">{pct}%</div>
        </div>

        <div className="mt-4 space-y-2">
          {displaySteps.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
            >
              <span className="text-xs text-slate-700">{s.label}</span>
              <span
                className={`text-[11px] font-medium ${
                  s.done ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {s.done ? "OK" : "…"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
