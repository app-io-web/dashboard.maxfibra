// src/components/layout/EmpresaSwitcher.tsx
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { api, ACCESS_TOKEN_KEY, EMPRESA_ID_KEY } from "../../lib/api"; // ✅ importa o EMPRESA_ID_KEY

import { useSession } from "../../contexts/SessionContext";

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
  const { empresaId, setEmpresaId } = useSession();

  const [empresaInfo, setEmpresaInfo] = useState<EmpresaMiniInfo | null>(null);
  const [empresasUsuario, setEmpresasUsuario] = useState<EmpresaSwitcherItem[]>(
    []
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  // ✅ "Verdade" atual é o empresaId do contexto
  const currentEmpresaId = empresaId || empresaInfo?.auth_empresa_id || null;

  // ✅ pega a empresa atual da LISTA (instantâneo), fallback pro /empresa/settings
  const currentEmpresa = useMemo(() => {
    if (currentEmpresaId) {
      const hit = empresasUsuario.find(
        (e) => e.auth_empresa_id === currentEmpresaId
      );
      if (hit) {
        return {
          auth_empresa_id: hit.auth_empresa_id,
          display_name: hit.display_name,
          logo_url: hit.logo_url,
        } satisfies EmpresaMiniInfo;
      }
    }
    return empresaInfo;
  }, [currentEmpresaId, empresasUsuario, empresaInfo]);

  const outrasEmpresas = useMemo(
    () =>
      empresasUsuario.filter(
        (e) => e.is_enabled !== false && e.auth_empresa_id !== currentEmpresaId
      ),
    [empresasUsuario, currentEmpresaId]
  );

  const empresaNome = currentEmpresa?.display_name || "Empresa atual";
  const empresaLogoUrl = buildLogoUrl(currentEmpresa?.logo_url);

  // ✅ Recarrega dados do switcher sempre que empresaId mudar
  //    + anti-cache (pra não ficar preso no 304 / resposta velha)
  useEffect(() => {
    let isMounted = true;

    async function loadEmpresas() {
      try {
        setLoading(true);

        const noCache = {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          params: { _ts: Date.now() }, // cache-buster
        };

        const [resEmpresa, resEmpresas] = await Promise.all([
          api.get<EmpresaSettingsResponse>("/empresa/settings", noCache),
          api.get<EmpresasUsuarioResponse>("/usuario/empresas", noCache),
        ]);

        if (!isMounted) return;

        setEmpresaInfo(resEmpresa.data.empresaSettings ?? null);
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
  }, [empresaId]);

    async function handleSwitchEmpresa(nextEmpresaId: string) {
      if (switching) return;

      if (!nextEmpresaId || nextEmpresaId === currentEmpresaId) {
        setOpen(false);
        return;
      }

      try {
        setSwitching(true);
        setOpen(false);
        setEmpresaInfo(null);

        const res = await api.post(
          "/auth/switch-empresa",
          {
            empresaId: nextEmpresaId, // ✅ backend exige isso
          },
          {
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            params: { _ts: Date.now() },
          }
        );

        const newToken = res.data?.accessToken || res.data?.token;
        if (!newToken) throw new Error("Token não retornado em /auth/switch-empresa");

        localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        localStorage.setItem(EMPRESA_ID_KEY, nextEmpresaId);
        setEmpresaId(nextEmpresaId);
      } catch (err: any) {
        console.error("[EmpresaSwitcher] erro ao trocar empresa:", err);
        alert(
          err?.response?.data?.error ||
            err?.message ||
            "Erro ao trocar de empresa."
        );
      } finally {
        setSwitching(false);
      }
    }


  return (
    <div className="border-b border-slate-800 bg-slate-900">
      <button
        type="button"
        onClick={() => {
          if (!loading && !switching && outrasEmpresas.length > 0) {
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

            {switching && (
              <>
                <span>•</span>
                <span className="text-amber-300 font-medium">trocando…</span>
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
                    disabled={switching}
                    onClick={() => handleSwitchEmpresa(e.auth_empresa_id)}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-100 transition",
                      switching
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-slate-800/90",
                    ].join(" ")}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
