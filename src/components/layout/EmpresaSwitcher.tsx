// src/components/layout/EmpresaSwitcher.tsx
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { api, ACCESS_TOKEN_KEY } from "../../lib/api";

type EmpresaMiniInfo = {
  display_name: string | null;
  logo_url: string | null;
  auth_empresa_id: string;
};

type EmpresaSwitcherItem = {
  id: string;
  auth_empresa_id: string;
  display_name: string | null;
  logo_url: string | null;
  role?: string;
  is_enabled?: boolean;
};

type EmpresaSettingsResponse = {
  empresaSettings: EmpresaMiniInfo | null;
};

type EmpresasUsuarioResponse = {
  empresas: EmpresaSwitcherItem[];
};

// helper pra montar URL absoluta da logo
function buildLogoUrl(raw?: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const base = api.defaults.baseURL || "";
  return base.replace(/\/$/, "") + (raw.startsWith("/") ? raw : `/${raw}`);
}

export function EmpresaSwitcher() {
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaMiniInfo | null>(null);
  const [empresasUsuario, setEmpresasUsuario] = useState<EmpresaSwitcherItem[]>(
    []
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEmpresas() {
      try {
        const [resEmpresa, resEmpresas] = await Promise.all([
          api.get<EmpresaSettingsResponse>("/empresa/settings"),
          api.get<EmpresasUsuarioResponse>("/usuario/empresas"),
        ]);

        if (!isMounted) return;

        if (resEmpresa.data.empresaSettings) {
          setEmpresaInfo(resEmpresa.data.empresaSettings);
        }

        setEmpresasUsuario(resEmpresas.data.empresas || []);
      } catch (err) {
        console.error("[EmpresaSwitcher] erro ao carregar empresas:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEmpresas();
    return () => {
      isMounted = false;
    };
  }, []);

  const empresaNome = empresaInfo?.display_name || "Empresa atual";
  const empresaLogoUrl = buildLogoUrl(empresaInfo?.logo_url);
  const currentEmpresaId = empresaInfo?.auth_empresa_id;

  const outrasEmpresas = empresasUsuario.filter(
    (e) => e.auth_empresa_id !== currentEmpresaId
  );

  async function handleSwitchEmpresa(authEmpresaId: string) {
    try {
      const res = await api.post("/auth/switch-empresa", {
        empresaId: authEmpresaId,
      });

      const newToken = res.data.accessToken;
      if (newToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      }

      window.location.reload();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao trocar de empresa.");
    }
  }

  return (
    <div className="border-b border-slate-800 bg-slate-900">
      <button
        type="button"
        onClick={() => {
          if (!loading && outrasEmpresas.length > 0) {
            setOpen((prev) => !prev);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-800/70 transition"
      >
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 overflow-hidden flex items-center justify-center">
          {empresaLogoUrl ? (
            <img
              src={empresaLogoUrl}
              alt={empresaNome}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-200">
              {empresaNome[0]?.toUpperCase() || "E"}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold tracking-wide truncate">
            {empresaNome}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
            <span>Empresa vinculada</span>
            {outrasEmpresas.length > 0 && (
              <>
                <span>•</span>
                <span className="text-cyan-300 font-medium">
                  {outrasEmpresas.length} outra
                  {outrasEmpresas.length > 1 ? "s" : ""} disponível(is)
                </span>
              </>
            )}
          </div>
        </div>

        {outrasEmpresas.length > 0 && (
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* DROPDOWN */}
      {open && outrasEmpresas.length > 0 && (
        <div className="px-3 pb-3">
          <div className="mt-1 rounded-xl border border-slate-800 bg-slate-900/95 shadow-lg overflow-hidden">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-500 bg-slate-900/90 border-b border-slate-800">
              Trocar de empresa
            </div>

            <div className="py-1 max-h-56 overflow-y-auto">
              {outrasEmpresas.map((e) => {
                const logo = buildLogoUrl(e.logo_url);
                const nome = e.display_name || "Empresa";

                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handleSwitchEmpresa(e.auth_empresa_id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800/90 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 overflow-hidden flex items-center justify-center">
                      {logo ? (
                        <img
                          src={logo}
                          alt={nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] font-semibold">
                          {nome[0]?.toUpperCase() || "E"}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="truncate text-[12px] font-medium">
                        {nome}
                      </div>
                      {e.role && (
                        <div className="mt-0.5">
                          <span className="inline-flex items-center rounded-full border border-slate-600 px-1.5 py-[1px] text-[9px] uppercase tracking-wide text-slate-300">
                            {e.role}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {outrasEmpresas.length === 0 && (
                <div className="px-3 py-2 text-[11px] text-slate-500">
                  Nenhuma outra empresa vinculada.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
