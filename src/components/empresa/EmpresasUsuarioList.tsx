// src/components/empresa/EmpresasUsuarioList.tsx
import { api } from "../../lib/api";

type EmpresaListItem = {
  id: string;
  display_name: string | null;
  auth_empresa_id: string;
  logo_url?: string | null; // 🔥 pega logo da empresa
  role?: string;
};

type Props = {
  empresas: EmpresaListItem[];
  onSwitchEmpresa: (empresaId: string) => void;
  canUseEmpresa?: boolean;      // writer
  canViewUseEmpresa?: boolean;  // viewer
};

// mesmo helper que usamos nos outros lugares
function buildLogoUrl(raw?: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const base = api.defaults.baseURL || "";
  return base.replace(/\/$/, "") + (raw.startsWith("/") ? raw : `/${raw}`);
}

export function EmpresasUsuarioList({
  empresas,
  onSwitchEmpresa,
  canUseEmpresa = false,
  canViewUseEmpresa = false,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">
        Outras empresas vinculadas a este usuário
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Estas são todas as empresas em que seu usuário está vinculado.
        Agora você pode alternar rapidamente entre elas.
      </p>

      <div className="space-y-2">
        {empresas.map((e) => {
          const logoUrl = buildLogoUrl(e.logo_url);

          return (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#FEFCFB] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#1282A2]/10 border border-[#1282A2]/30 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={e.display_name || "Logo da empresa"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#034078] text-sm font-semibold">
                      {e.display_name?.[0]?.toUpperCase() || "E"}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {e.display_name || "Empresa sem nome"}
                    </p>
                    {e.role && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-[1px] text-[10px] font-semibold uppercase tracking-wide">
                        {e.role}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {e.auth_empresa_id}
                  </p>
                </div>
              </div>

              {canViewUseEmpresa && (
                <button
                  onClick={() =>
                    canUseEmpresa && onSwitchEmpresa(e.auth_empresa_id)
                  }
                  disabled={!canUseEmpresa}
                  className="rounded-lg bg-[#1282A2] text-white text-xs font-semibold px-3 py-1.5 hover:bg-[#034078] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Usar esta empresa
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
