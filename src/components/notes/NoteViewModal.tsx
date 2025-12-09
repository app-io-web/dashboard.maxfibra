import { NoteContentRenderer } from "./NoteContentRenderer";

type NoteViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | null;
  content: string;
  createdAt?: Date;
  expiresAt?: Date | null;
  isUrgent?: boolean;
};

export function NoteViewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  content,
  createdAt,
  expiresAt,
  isUrgent = false,
}: NoteViewModalProps) {
  if (!isOpen) return null;

  const expired =
    expiresAt && !Number.isNaN(expiresAt.getTime())
      ? expiresAt.getTime() < Date.now()
      : false;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl">
        <header className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {title || "Sem título"}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
              {isUrgent && (
                <span className="inline-flex items-center rounded-full bg-red-50 border border-red-300 px-2 py-[1px] text-[10px] font-medium text-red-700">
                  Urgente
                </span>
              )}
              {expiresAt && !Number.isNaN(expiresAt.getTime()) && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-[1px] text-[10px] font-medium ${
                    expired
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-amber-300 bg-amber-50 text-amber-700"
                  }`}
                >
                  Validade: {expiresAt.toLocaleDateString("pt-BR")}
                  {expired ? " (vencida)" : ""}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {/* X icon simples */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M6 6l8 8M14 6l-8 8"
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="mt-3 max-h-[60vh] overflow-y-auto pr-1">
          <NoteContentRenderer content={content} variant="full" />
        </div>

        <footer className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
          <p className="text-[11px] text-slate-400">
            {createdAt
              ? `Criada em ${createdAt.toLocaleString("pt-BR")}`
              : null}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
