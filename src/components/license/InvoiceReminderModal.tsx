import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { api } from "../../lib/api";

const DUE_DAY = 15;
const REMIND_DAYS = [5, 2, 1, 0] as const;

type LicenseStatus = {
  has_license: boolean;
  is_paid: boolean;
  expires_at?: string | null;
  grace_until?: string | null;
};

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
  if (startOfDay(now).getTime() <= startOfDay(dueThisMonth).getTime()) return dueThisMonth;
  return new Date(y, m + 1, DUE_DAY);
}

function toMs(dateIso?: string | null) {
  if (!dateIso) return 0;
  const t = new Date(dateIso).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function InvoiceReminderModal() {
  const { empresaId } = useSession() as any;
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dueLabel, setDueLabel] = useState<string>("");

  const skip = useMemo(() => pathname.startsWith("/login"), [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skip) return;
    if (!empresaId) return;

    let alive = true;

    async function run() {
      const now = new Date();
      const due = getNextDueDate(now);
      const left = daysBetween(now, due);

      // só nos dias configurados
      if (!REMIND_DAYS.includes(left as any)) return;

      // ciclo (YYYY-MM)
      const cycle = `${due.getFullYear()}-${pad2(due.getMonth() + 1)}`;

      // ✅ "lido" (persistente)
      const kRead = `mx_invoice_reminder_read_${empresaId}_${cycle}_d${left}`;
      // ✅ "pendente" (sobrevive a reload)
      const kPending = `mx_invoice_reminder_pending_${empresaId}_${cycle}_d${left}`;

      // se já foi marcado como lido, não mostra
      if (localStorage.getItem(kRead)) return;

      // 🔥 BUSCA STATUS DA LICENÇA (pra não lembrar quem já pagou)
      let status: LicenseStatus | null = null;
      try {
        const res = await api.get("/system/license/status", {
          params: { empresa_id: empresaId },
        });
        status = (res.data?.licenseStatus ?? res.data) as LicenseStatus;
      } catch {
        // se falhar, melhor NÃO spammar modal; mas se você preferir, pode deixar cair e abrir.
        return;
      }

      if (!alive) return;

      // Regra prática:
      // - se não tem licença, ou tem mas NÃO está paga => pode lembrar
      // - se está paga e a expiração cobre pelo menos até o vencimento do ciclo => NÃO lembra
      const paid = !!status?.is_paid;

      const expiresMs = toMs(status?.expires_at);
      const dueMs = startOfDay(due).getTime();

      const isCoveredThisCycle =
        paid && expiresMs >= dueMs; // pago + expira depois do vencimento do ciclo

      if (isCoveredThisCycle) {
        // já tá pago/coberto, não incomoda
        sessionStorage.removeItem(kPending);
        return;
      }

      // se já estava pendente (rolou reload antes do ok), reabre
      if (sessionStorage.getItem(kPending)) {
        setDaysLeft(left);
        setDueLabel(due.toLocaleDateString("pt-BR"));
        setOpen(true);
        return;
      }

      // primeira vez no dia certo: abre e marca como pendente (NÃO como lido)
      sessionStorage.setItem(kPending, "1");
      setDaysLeft(left);
      setDueLabel(due.toLocaleDateString("pt-BR"));
      setOpen(true);
    }

    run();

    return () => {
      alive = false;
    };
  }, [empresaId, skip]);

  function markAsReadAndClose() {
    if (!empresaId || daysLeft == null) {
      setOpen(false);
      return;
    }

    const now = new Date();
    const due = getNextDueDate(now);
    const cycle = `${due.getFullYear()}-${pad2(due.getMonth() + 1)}`;

    const kRead = `mx_invoice_reminder_read_${empresaId}_${cycle}_d${daysLeft}`;
    const kPending = `mx_invoice_reminder_pending_${empresaId}_${cycle}_d${daysLeft}`;

    localStorage.setItem(kRead, "1");
    sessionStorage.removeItem(kPending);
    setOpen(false);
  }

  if (!open || skip) return null;

  const title =
    daysLeft === 5
      ? "Lembrete de vencimento (faltam 5 dias)"
      : daysLeft === 2
      ? "Atenção: vencimento próximo (faltam 2 dias)"
      : daysLeft === 1
      ? "Última chamada: vence amanhã"
      : "Vence hoje";

  const desc = `A fatura vence dia 15 (próximo vencimento em ${dueLabel}). Para evitar bloqueio, já dá pra abrir a tela da licença e renovar agora.`;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/30 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-30px_rgba(2,6,23,0.35)]">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600">{desc}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  markAsReadAndClose();
                  navigate("/system/licenses");
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700"
              >
                Ver licença / Renovar
              </button>

              <button
                type="button"
                onClick={markAsReadAndClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Agora não
              </button>
            </div>

            <p className="pt-3 text-[11px] text-slate-500">
              Esse lembrete aparece só no dia certo (faltando 5/2/1/0) e só some depois que você clicar em um botão.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
