// src/components/empresa/VincularUsuarioEmpresasModal.tsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type ModalUser = {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type EmpresaOption = {
  id: string;
  display_name: string | null;
  auth_empresa_id: string;
  cnpj?: string | null;
};

type Props = {
  open: boolean;
  user: ModalUser | null;
  onClose: () => void;
  onLinked?: () => void; // opcional: pra recarregar lista no pai
};

export function VincularUsuarioEmpresasModal({
  open,
  user,
  onClose,
  onLinked,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // carrega empresas que o usuário NÃO está vinculado
  useEffect(() => {
    if (!open || !user) return;

    async function loadEmpresas() {
      setLoading(true);
      setError(null);

      try {
        // AJUSTA ESSA ROTA PRO QUE EXISTIR NO BACKEND
        // ideia: retornar empresas nas quais esse auth_user_id AINDA não está vinculado
        const res = await api.get(
          `/admin/usuarios/${user.auth_user_id}/empresas-disponiveis`
        );

        setEmpresas(res.data.empresas || []);
      } catch (err: any) {
        console.error(err);
        setError("Erro ao carregar empresas disponíveis para vínculo.");
      } finally {
        setLoading(false);
      }
    }

    loadEmpresas();
  }, [open, user]);

  async function handleVincularEmpresa(authEmpresaId: string) {
    if (!user) return;
    setLinkingId(authEmpresaId);
    setError(null);

    try {
      // AJUSTA ESSA ROTA PRO QUE EXISTIR NO BACKEND
      await api.post(`/admin/usuarios/${user.auth_user_id}/empresas`, {
        auth_empresa_id: authEmpresaId,
      });

      // some da lista local
      setEmpresas((prev) =>
        prev.filter((e) => e.auth_empresa_id !== authEmpresaId)
      );

      if (onLinked) onLinked();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Erro ao vincular empresa para o usuário."
      );
    } finally {
      setLinkingId(null);
    }
  }

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !loading && !linkingId && onClose()}
      />

      {/* conteúdo */}
      <div className="relative z-50 w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Vincular usuário a empresas
            </h3>
            <p className="text-xs text-slate-500">
              Selecione uma empresa para vincular{" "}
              <span className="font-semibold">
                {user.display_name || "Usuário"}
              </span>
              .
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              ID Global: {user.auth_user_id}
            </p>
          </div>

          <button
            type="button"
            onClick={() => !loading && !linkingId && onClose()}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
            disabled={loading || !!linkingId}
          >
            ×
          </button>
        </div>

        <div className="space-y-3 max-h-[360px] overflow-y-auto">
          {loading && (
            <div className="text-sm text-slate-600">
              Carregando empresas disponíveis...
            </div>
          )}

          {!loading && error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!loading && !error && empresas.length === 0 && (
            <p className="text-sm text-slate-600">
              Este usuário já está vinculado a todas as empresas disponíveis.
            </p>
          )}

          {!loading &&
            !error &&
            empresas.length > 0 &&
            empresas.map((empresa) => (
              <div
                key={empresa.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#FEFCFB] px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#1282A2]/10 border border-[#1282A2]/30 flex items-center justify-center text-[#034078] text-sm font-semibold">
                    {empresa.display_name?.[0]?.toUpperCase() || "E"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {empresa.display_name || "Empresa sem nome"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {empresa.auth_empresa_id}
                    </p>
                    {empresa.cnpj && (
                      <p className="text-[11px] text-slate-500 truncate">
                        CNPJ: {empresa.cnpj}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleVincularEmpresa(empresa.auth_empresa_id)
                  }
                  disabled={!!linkingId}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#1282A2] hover:bg-[#034078] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {linkingId === empresa.auth_empresa_id
                    ? "Vinculando..."
                    : "Vincular"}
                </button>
              </div>
            ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => !loading && !linkingId && onClose()}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100"
            disabled={loading || !!linkingId}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
