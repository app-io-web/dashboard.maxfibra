import { Cake, Trash2 } from "lucide-react";
import { BirthdayAvatar } from "./BirthdayAvatar";
import { formatDate } from "../utils/birthdayDate";
import type { BirthdayWithInfo } from "../types";

type Props = {
  item: BirthdayWithInfo;
  variant: "today" | "upcoming";
  canDeleteManual: boolean;
  onDeleteManual?: (id: string) => void;
};

export function BirthdayItemRow({ item, variant, canDeleteManual, onDeleteManual }: Props) {
  const isToday = item.info.daysUntil === 0;

  const showDelete = canDeleteManual && item.is_manual === true;

  if (variant === "today") {
    return (
      <li className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2.5 shadow-[0_1px_0_rgba(16,185,129,0.15)]">
        <div className="flex items-center gap-3">
          <BirthdayAvatar name={item.name} avatarUrl={item.avatarUrl} variant="today" />
          <div>
            <p className="text-sm font-semibold text-blue-950">{item.name}</p>
            <p className="text-xs text-blue-900/80">
              {item.role}
              {item.sector ? ` • ${item.sector}` : null}
              {` • Faz ${item.info.ageAtNext} anos`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800 border border-blue-100">
              <Cake size={12} strokeWidth={2} />
              Hoje
            </span>
            <span className="text-[11px] font-medium text-blue-900/80">{formatDate(item.date)}</span>
          </div>

          {showDelete && (
            <button
              type="button"
              onClick={() => onDeleteManual?.(item.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
              title="Remover aniversariante manual"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </li>
    );
  }

  // upcoming
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <BirthdayAvatar name={item.name} avatarUrl={item.avatarUrl} variant="upcoming" />
        <div>
          <p className="text-sm font-medium text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-600">
            {item.role}
            {item.sector ? ` • ${item.sector}` : null}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Em{" "}
            <span className="font-semibold text-[#034078]">
              {item.info.daysUntil} dia{item.info.daysUntil === 1 ? "" : "s"}
            </span>{" "}
            • Vai fazer{" "}
            <span className="font-semibold text-[#034078]">{item.info.ageAtNext} anos</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
            {formatDate(item.date)}
          </span>
        </div>

        {showDelete && (
          <button
            type="button"
            onClick={() => onDeleteManual?.(item.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
            title="Remover aniversariante manual"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </li>
  );
}
