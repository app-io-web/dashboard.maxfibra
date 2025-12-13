import { Clock, PartyPopper } from "lucide-react";
import type { BirthdayWithInfo } from "../types";
import { BirthdayItemRow } from "./BirthdayItemRow";

type Props = {
  title: string;
  subtitle: string;
  variant: "today" | "upcoming";
  items: BirthdayWithInfo[];
  canDeleteManual: boolean;
  onDeleteManual: (id: string) => void;
};

export function BirthdaySectionCard({
  title,
  subtitle,
  variant,
  items,
  canDeleteManual,
  onDeleteManual,
}: Props) {
  const isToday = variant === "today";

  return (
    <div className="rounded-2xl border border-slate-200 bg-[#FEFCFB] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        {isToday ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-100">
            <PartyPopper size={14} strokeWidth={2} />
            {items.length} {items.length === 1 ? "aniversário" : "aniversários"}
          </span>
        ) : (
          items.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <Clock size={14} strokeWidth={2} />
              {items.length} {items.length === 1 ? "próximo" : "próximos"}
            </span>
          )
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {isToday ? "Ninguém faz aniversário hoje." : "Nenhum aniversário cadastrado para os próximos dias."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((b) => (
            <BirthdayItemRow
              key={b.id}
              item={b}
              variant={variant}
              canDeleteManual={canDeleteManual}
              onDeleteManual={onDeleteManual}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
