// src/components/empresa/CreateEmpresaModal.tsx
type Props = {
  open: boolean;
  creating: boolean;
  newEmpresaName: string;
  createError: string | null;
  onClose: () => void;
  onChangeName: (value: string) => void;
  onCreate: () => void;
};

export function CreateEmpresaModal({
  open,
  creating,
  newEmpresaName,
  createError,
  onClose,
  onChangeName,
  onCreate,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !creating && onClose()}
      />
      <div className="relative z-50 w-full max-w-md mx-4 rounded-2xl bg-white shadow-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Criar nova empresa
            </h3>
            <p className="text-xs text-slate-500">
              Essa empresa será cadastrada na Central e você será vinculado a
              ela.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !creating && onClose()}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
            disabled={creating}
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome da empresa
            </label>
            <input
              type="text"
              value={newEmpresaName}
              onChange={(e) => onChangeName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1282A2]/50 focus:border-[#1282A2]"
              placeholder="Ex: Grupo Max Fibra"
            />
          </div>

          {createError && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {createError}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => !creating && onClose()}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100"
            disabled={creating}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#1282A2] hover:bg-[#034078] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? "Criando..." : "Criar empresa"}
          </button>
        </div>
      </div>
    </div>
  );
}
