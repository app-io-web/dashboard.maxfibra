// src/components/system-config/AreaPermissionsModal.tsx
import { useMemo, useState } from "react";
import { KeyRound, X, Search } from "lucide-react";

type AreaPermission = {
  id: string;
  key: string;
  label: string;
  description: string | null;
};

type AreaPermissionsModalProps = {
  isOpen: boolean;
  areaName: string | null;
  permissions: AreaPermission[];
  onClose: () => void;
  onSelectPermission: (permissionKey: string) => void;
};

export function AreaPermissionsModal({
  isOpen,
  areaName,
  permissions,
  onClose,
  onSelectPermission,
}: AreaPermissionsModalProps) {
  const [search, setSearch] = useState("");

  const filteredPermissions = useMemo(() => {
    if (!search.trim()) return permissions;
    const term = search.toLowerCase();

    return permissions.filter((p) => {
      return (
        p.key.toLowerCase().includes(term) ||
        p.label.toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term)
      );
    });
  }, [permissions, search]);

  if (!isOpen || !areaName) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 px-3">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-900">
              Permissões da área
            </p>
            <p className="text-sm font-bold text-cyan-600 truncate max-w-xs">
              {areaName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Busca */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="h-6 flex-1 border-none bg-transparent text-xs text-slate-900 outline-none"
              placeholder="Buscar por label, key ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de permissões */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {filteredPermissions.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">
              Nenhuma permissão encontrada para este filtro.
            </p>
          ) : (
            <table className="min-w-full table-fixed border-separate border-spacing-0 text-xs">
              <thead className="sticky top--9 z-10 bg-white">
                <tr>
                  <th className="w-[26%] border-b border-slate-200 px-2 py-2 text-left text-[11px] font-medium text-slate-700">
                    Label
                  </th>
                  <th className="w-[26%] border-b border-slate-200 px-2 py-2 text-left text-[11px] font-medium text-slate-700">
                    Key
                  </th>
                  <th className="w-[34%] border-b border-slate-200 px-2 py-2 text-left text-[11px] font-medium text-slate-700">
                    Descrição
                  </th>
                  <th className="w-[14%] border-b border-slate-200 px-2 py-2 text-right text-[11px] font-medium text-slate-700">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-2 py-1.5 text-slate-900">
                      <span className="line-clamp-2 break-words">
                        {p.label}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1.5 font-mono text-[11px] text-slate-700">
                      <span className="line-clamp-2 break-all">{p.key}</span>
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-[11px] text-slate-600">
                      {p.description ? (
                        <span className="line-clamp-2 break-words">
                          {p.description}
                        </span>
                      ) : (
                        <span className="text-slate-400">Sem descrição</span>
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => onSelectPermission(p.key)}
                        className="inline-flex items-center justify-end gap-1 rounded-full bg-cyan-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-cyan-400"
                      >
                        <KeyRound className="h-3 w-3" />
                        Usar essa permissão
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
          <span>{filteredPermissions.length} permissão(ões) exibida(s).</span>
          <span>Selecione uma para preencher o select de atribuição.</span>
        </div>
      </div>
    </div>
  );
}
