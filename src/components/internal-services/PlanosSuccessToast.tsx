// src/components/internal-services/PlanosSuccessToast.tsx
import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

type PlanosSuccessToastProps = {
  open: boolean;
  message?: string;
  onClose: () => void;
};

export function PlanosSuccessToast({
  open,
  message = "Informações salvas com sucesso.",
  onClose,
}: PlanosSuccessToastProps) {
  // auto-fechar depois de alguns segundos
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
      <div className="pointer-events-auto flex w-72 items-start gap-3 rounded-2xl border border-blue-100 bg-white/95 p-3 shadow-lg shadow-blue-500/10">
        <div className="mt-0.5 rounded-full bg-blue-50 p-1.5">
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
        </div>

        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-700">
            Site atualizado com sucesso
          </p>
          <p className="mt-0.5 text-[11px] text-slate-600">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ml-1 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
