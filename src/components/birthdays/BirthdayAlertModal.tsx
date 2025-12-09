// src/components/birthdays/BirthdayAlertModal.tsx
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Gift,
  PartyPopper,
} from "lucide-react"; // <--- AGORA SIM, CHEFIA!

export type BirthdayAlertItem = {
  id: string;
  name: string;
  role: string;
  date: string | null;
  sector?: string;
  avatarUrl?: string | null;
};

type BirthdayAlertModalProps = {
  birthdaysToday: BirthdayAlertItem[];
};

function isToday(dateStr?: string | null) {
  if (!dateStr) return false;

  const [datePart] = dateStr.split("T");
  if (!datePart) return false;

  const [_, m, d] = datePart.split("-").map(Number);
  if (!m || !d) return false;

  const today = new Date();
  return m === today.getMonth() + 1 && d === today.getDate();
}

export function filterBirthdaysToday(items: BirthdayAlertItem[]) {
  return items.filter((b) => isToday(b.date));
}

export function BirthdayAlertModal({ birthdaysToday }: BirthdayAlertModalProps) {
  const [open, setOpen] = useState(false);

  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = "central:birthdayAlert:lastDismissed";

  useEffect(() => {
    if (!birthdaysToday || birthdaysToday.length === 0) {
      setOpen(false);
      return;
    }

    try {
      const lastDismissed = localStorage.getItem(storageKey);
      if (lastDismissed === todayKey) {
        setOpen(false);
        return;
      }
    } catch {}

    setOpen(true);
  }, [birthdaysToday]);

  function handleClose() {
    try {
      localStorage.setItem(storageKey, todayKey);
    } catch {}

    setOpen(false);
  }

  if (!open) return null;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-lg w-[90%] p-6 border border-emerald-500/20">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
            Atenção!
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
              Aniversariante{birthdaysToday.length > 1 ? "s" : ""} do dia
            </span>
          </h2>

          <p className="mt-1 text-sm text-slate-600 flex items-center gap-1">
            Hoje tem{" "}
            <span className="font-semibold text-slate-900">
              {birthdaysToday.length} colaborador
              {birthdaysToday.length > 1 ? "es" : ""} de aniversário.
            </span>
            <PartyPopper className="h-4 w-4 text-emerald-600" />
          </p>

          <div className="mt-4 space-y-2">
            {birthdaysToday.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {b.avatarUrl ? (
                    <img
                      src={b.avatarUrl}
                      alt={b.name}
                      className="h-9 w-9 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
                      {b.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {b.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {b.role}
                      {b.sector ? ` • ${b.sector}` : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <Gift className="h-4 w-4" />
                  hoje
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition text-slate-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

}
