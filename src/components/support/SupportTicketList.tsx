// src/components/support/SupportTicketList.tsx
import { Clock } from "lucide-react";
import {
  CATEGORY_OPTIONS,
  STATUS_LABEL,
  type SupportTicket,
  type SupportTicketStatus,
} from "../../types/support";

type Props = {
  tickets: SupportTicket[];
  loading: boolean;
  selectedTicketId: string | null;
  onSelectTicket: (ticket: SupportTicket) => void;
};

function statusBadgeClass(status: SupportTicketStatus) {
  switch (status) {
    case "ENVIADO":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "PENDENTE":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "ATRIBUIDO":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "SOLUCIONADO":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "FECHADO":
      return "bg-slate-200 text-slate-700 border border-slate-300";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export function SupportTicketList({
  tickets,
  loading,
  selectedTicketId,
  onSelectTicket,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" />
          Meus chamados
        </h2>
        {!loading && (
          <span className="text-xs text-slate-500">
            {tickets.length} registro(s)
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-slate-100" />

      {loading ? (
        <div className="py-8 text-sm text-slate-500 text-center">
          Carregando chamados...
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-8 text-sm text-slate-500 text-center">
          Você ainda não abriu nenhum chamado.
        </div>
      ) : (
        <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className={[
                "w-full text-left rounded-xl border px-3.5 py-2.5 text-sm",
                "border-slate-200 bg-slate-50/80 hover:bg-slate-100",
                "transition-colors flex flex-col gap-1.5",
                selectedTicketId === ticket.id
                  ? "ring-2 ring-brand-100 border-brand-300"
                  : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900 line-clamp-1">
                  {ticket.title}
                </span>
                <span
                  className={[
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    statusBadgeClass(ticket.status),
                  ].join(" ")}
                >
                  {STATUS_LABEL[ticket.status]}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  {CATEGORY_OPTIONS.find((c) => c.value === ticket.category)
                    ?.label ?? ticket.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  Atualizado em{" "}
                  {new Date(ticket.updated_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
