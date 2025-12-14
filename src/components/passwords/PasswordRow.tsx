// src/components/passwords/PasswordRow.tsx
import { useState } from "react";
import type { ApiPassword } from "../../pages/PasswordsPage";

type PasswordRowProps = {
  item: ApiPassword;
  revealedPassword?: string;
  isVisible: boolean;
  revealLoading: boolean;
  onToggleVisible: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PasswordRow({
  item,
  revealedPassword,
  isVisible,
  revealLoading,
  onToggleVisible,
  onCopy,
  onEdit,
  onDelete,
}: PasswordRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    onDelete();
    setConfirmingDelete(false);
  }

  function handleCancelDelete() {
    setConfirmingDelete(false);
  }

  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="px-3 py-2 font-medium text-slate-900">
        {item.nome || "Sem nome"}
        {item.anotacao && (
          <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
            {item.anotacao}
          </div>
        )}
      </td>
      <td className="px-3 py-2 text-slate-700">
        {item.email ? (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            {item.email}
          </code>
        ) : (
          <span className="text-xs text-slate-400">
            — sem usuário —
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-slate-700">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-700 underline underline-offset-2"
          >
            Abrir
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-slate-700">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
          {isVisible && revealedPassword
            ? revealedPassword
            : item.senha_status
            ? "••••••••••••"
            : "—"}
        </code>
      </td>
      <td className="px-3 py-2 text-right space-x-2">
        {item.senha_status && (
          <button
            type="button"
            onClick={onToggleVisible}
            className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline disabled:opacity-60"
            disabled={revealLoading}
          >
            {revealLoading
              ? "Carregando..."
              : isVisible
              ? "Ocultar"
              : "Mostrar"}
          </button>
        )}

        {isVisible && revealedPassword && (
          <button
            type="button"
            onClick={onCopy}
            className="text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            Copiar
          </button>
        )}

        {!confirmingDelete && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
          >
            Editar
          </button>
        )}

        {!confirmingDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="text-xs font-medium text-rose-600 underline-offset-2 hover:underline"
          >
            Excluir
          </button>
        )}

        {confirmingDelete && (
          <>
            <span className="text-[11px] text-slate-500 mr-1">
              Confirmar?
            </span>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="text-xs font-semibold text-rose-700 underline-offset-2 hover:underline"
            >
              Sim
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline ml-1"
            >
              Cancelar
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
