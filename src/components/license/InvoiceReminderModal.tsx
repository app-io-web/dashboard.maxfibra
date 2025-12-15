import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";

// vencimento fixo
const DUE_DAY = 15;

// mostrar quando faltarem exatamente esses dias
const REMIND_DAYS = [5, 2, 1] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function getNextDueDate(now: Date) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const dueThisMonth = new Date(y, m, DUE_DAY);

  if (startOfDay(now).getTime() <= startOfDay(dueThisMonth).getTime()) {
    return dueThisMonth;
  }
  return new Date(y, m + 1, DUE_DAY);
}

export function InvoiceReminderModal() {
  const { empresaId } = useSession() as any;
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dueLabel, setDueLabel] = useState<string>("");

  const skip = useMemo(() => {
    return pathname.startsWith("/login");
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skip) return;

    const now = new Date();
    const due = getNextDueDate(now);
    const left = daysBetween(now, due);

    if (!REMIND_DAYS.includes(left as any)) return;

    const cycle = `${due.getFullYear()}-${pad2(due.getMonth() + 1)}`;
    const k = `mx_invoice_reminder_${empresaId || "noempresa"}_${cycle}_d${left}`;

    if (localStorage.getItem(k)) return;

    localStorage.setItem(k, "1");

    setDaysLeft(left);
    setDueLabel(due.toLocaleDateString("pt-BR"));
    setOpen(true);
  }, [empresaId, skip]);

  if (!open || skip) return null;

  const title =
    daysLeft === 5
      ? "Lembrete de vencimento (faltam 5 dias)"
      : daysLeft === 2
      ? "Atenção: vencimento próximo (faltam 2 dias)"
      : "Última chamada: vence amanhã";

  const desc = `A fatura vence dia 15 (próximo vencimento em ${dueLabel}). Para evitar bloqueio, já dá pra abrir a tela da licença e renovar agora.`;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/30 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-30px_rgba(2,6,23,0.35)]">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {title}
            </h2>

            <p className="text-sm text-slate-600">{desc}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/system/licenses");
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700"
              >
                Ver licença / Renovar
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Agora não
              </button>
            </div>

            <p className="pt-3 text-[11px] text-slate-500">
              Esse lembrete aparece só no dia certo (10, 13 e 14) e apenas 1 vez
              por empresa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
