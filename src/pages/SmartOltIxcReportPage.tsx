import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Activity, AlertTriangle, RefreshCcw, ArrowLeft } from "lucide-react";

type ReportKind = "ONU_OFF" | "ONU_LOS";

type SmartOltIxcReportItem = {
  usuario_monitoramento?: string;
  onu_id?: string;
  status_monitoramento?: string;
  power_fail?: string | null;

  mac_onu?: string | null;
  id_cliente?: string | null;
  id_contrato?: string | null;

  radius_id?: string | null;
  radius_login?: string | null;
  radius_ativo?: boolean | null;
  radius_online?: boolean | null;

  cliente_nome?: string | null;
  cliente_ativo?: boolean | null;
  cliente_email?: string | null;
  cliente_fone?: string | null;

  contrato_status?: string | null;
  contrato_status_internet?: string | null;
  contrato_plano_desc?: string | null;

  sinal_rx?: string | null;
  sinal_tx?: string | null;
  causa_ultima_queda?: string | null;

  ixc_ok?: boolean;
  ixc_erro?: string | null;
};

type ApiResponse = {
  ok: boolean;
  total: number;
  relatorioIxc: SmartOltIxcReportItem[];
};

function formatContratoStatus(code?: string | null): string {
  const map: Record<string, string> = {
    P: "Pré-contrato",
    A: "Ativo",
    I: "Inativo",
    N: "Negativado",
    D: "Desistiu",
  };
  return code ? map[code] ?? code : "—";
}

function formatInternetStatus(code?: string | null): string {
  const map: Record<string, string> = {
    A: "Ativo",
    D: "Desativado",
    CM: "Bloqueio manual",
    CA: "Bloqueio automático",
    FA: "Financeiro em atraso",
    AA: "Aguardando assinatura",
  };
  return code ? map[code] ?? code : "—";
}

// 🔒 bloqueio esperado, não é problema
function internetStatusIsBlocked(code?: string | null): boolean {
  return code === "CM" || code === "CA" || code === "FA";
}

// problema de internet (sem ser bloqueio esperado)
function internetStatusIsProblem(code?: string | null): boolean {
  return !!code && code !== "A" && !internetStatusIsBlocked(code);
}

function contratoStatusIsProblem(code?: string | null): boolean {
  return !!code && code !== "A";
}

// SmartOLT dizendo que está desligada
function isOnuOff(r: SmartOltIxcReportItem): boolean {
  return (
    r.status_monitoramento === "offline" ||
    (!!r.power_fail && r.power_fail.toLowerCase().includes("power"))
  );
}

export function SmartOltIxcReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialKind = (searchParams.get("tipo") === "los"
    ? "ONU_LOS"
    : "ONU_OFF") as ReportKind;

  const [kind, setKind] = useState<ReportKind>(initialKind);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SmartOltIxcReportItem[]>([]);

  const isLos = kind === "ONU_LOS";

  const endpoint = isLos
    ? "/monitoring/smart-short-olt-los/report"
    : "/monitoring/smart-short-olt/report";

  const title = isLos
    ? "Relatório SmartOLT – ONUs com LOS"
    : "Relatório SmartOLT – ONUs desligadas";

  const subtitle = isLos
    ? "Situação detalhada no IXC das ONUs em LOS no último monitoramento."
    : "Situação detalhada no IXC das ONUs desligadas no último monitoramento.";

  const resumo = useMemo(() => {
    const total = items.length;

    const semDadosIxc = items.filter((r) => !r.ixc_ok).length;

    const bloqueadosInternet = items.filter((r) =>
      internetStatusIsBlocked(r.contrato_status_internet)
    ).length;

    const desligadas = items.filter((r) => isOnuOff(r)).length;

    const comProblema = items.filter((r) => {
      if (!r.ixc_ok) return true;
      if (r.radius_ativo === false) return true;
      if (r.cliente_ativo === false) return true;
      if (internetStatusIsProblem(r.contrato_status_internet)) return true;
      if (contratoStatusIsProblem(r.contrato_status)) return true;

      const internetAtiva = r.contrato_status_internet === "A";

      if (isLos && internetAtiva) return true;
      if (!isLos && isOnuOff(r) && internetAtiva) return true;

      return false;
    }).length;

    return {
      total,
      comProblema,
      semDadosIxc,
      bloqueadosInternet,
      desligadas,
    };
  }, [items, isLos]);

  async function fetchReport() {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get<ApiResponse>(endpoint);
      setItems(res.data.relatorioIxc || []);
    } catch (err: any) {
      console.error("Erro ao carregar relatório SmartOLT IXC:", err);
      setError(
        err?.response?.data?.error ||
          "Erro ao carregar relatório detalhado. Tente novamente."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, [endpoint]);

  const handleChangeKind = (nextKind: ReportKind) => {
    setKind(nextKind);
    setSearchParams({
      tipo: nextKind === "ONU_LOS" ? "los" : "power_off",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            {isLos ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : (
              <Activity className="h-5 w-5 text-blue-500" />
            )}
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate("/monitoramento")}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para monitoramento
          </button>

          <button
            type="button"
            onClick={() => handleChangeKind("ONU_OFF")}
            className={
              "rounded-xl px-3 py-1.5 text-xs font-medium border transition " +
              (kind === "ONU_OFF"
                ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
            }
          >
            ONUs desligadas
          </button>
          <button
            type="button"
            onClick={() => handleChangeKind("ONU_LOS")}
            className={
              "rounded-xl px-3 py-1.5 text-xs font-medium border transition " +
              (kind === "ONU_LOS"
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
            }
          >
            ONUs com LOS
          </button>
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        </div>
      </header>

      {/* Cards de resumo */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total de ONUs</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {resumo.total}
          </p>
        </div>

        {isLos ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 shadow-sm">
            <p className="text-xs font-medium text-amber-700">
              ONUs com possível problema
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">
              {resumo.comProblema}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 shadow-sm">
            <p className="text-xs font-medium text-amber-700">
              ONUs desligadas
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">
              {resumo.desligadas}
            </p>
          </div>
        )}

        {resumo.semDadosIxc > 0 ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-3 shadow-sm">
            <p className="text-xs font-medium text-rose-700">
              Sem dados no IXC
            </p>
            <p className="mt-1 text-2xl font-semibold text-rose-800">
              {resumo.semDadosIxc}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-3 shadow-sm">
            <p className="text-xs font-medium text-violet-700">
              Clientes com bloqueio de internet
            </p>
            <p className="mt-1 text-2xl font-semibold text-violet-800">
              {resumo.bloqueadosInternet}
            </p>
          </div>
        )}
      </section>

      {/* Tabela */}
      {!loading && !error && items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left">ONU / Usuário</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Contrato</th>
                  <th className="px-3 py-2 text-left">Radius</th>
                  <th className="px-3 py-2 text-left">Status SmartOLT</th>
                  <th className="px-3 py-2 text-left">Status Internet</th>
                  <th className="px-3 py-2 text-left">Plano</th>
                </tr>
              </thead>

              <tbody>
                {items.map((r, idx) => {
                  const internetCode = r.contrato_status_internet || "";
                  const contratoCode = r.contrato_status || "";

                  const internetLabel = formatInternetStatus(
                    r.contrato_status_internet
                  );
                  const contratoLabel = formatContratoStatus(
                    r.contrato_status
                  );

                  const off = isOnuOff(r);
                  const internetAtiva = internetCode === "A";

                  const problema =
                    !r.ixc_ok ||
                    r.radius_ativo === false ||
                    r.cliente_ativo === false ||
                    internetStatusIsProblem(r.contrato_status_internet) ||
                    contratoStatusIsProblem(r.contrato_status) ||
                    (kind === "ONU_LOS" && internetAtiva) ||
                    (kind === "ONU_OFF" && off && internetAtiva);

                  // ===== Status SmartOLT (PowerOff / LOS) =====
                  let smartLabel = "OK";
                  let smartClass =
                    "bg-blue-50 text-blue-700 border-blue-100";

                  if (kind === "ONU_OFF") {
                    if (off) {
                      smartLabel = "Desligada";
                      smartClass =
                        "bg-amber-50 text-amber-700 border-amber-100";
                    }
                  } else {
                    smartLabel = "LOS ativo";
                    smartClass =
                      "bg-amber-50 text-amber-700 border-amber-100";
                  }

                  return (
                    <tr
                      key={idx}
                      className={
                        "border-b border-slate-100 last:border-0 " +
                        (problema ? "bg-amber-50/40" : "")
                      }
                    >
                      {/* ONU */}
                      <td className="px-3 py-2 align-top">
                        <div className="font-semibold text-slate-900">
                          {r.onu_id || "-"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {r.usuario_monitoramento || "-"}
                        </div>
                        {r.mac_onu && (
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            MAC: {r.mac_onu}
                          </div>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="px-3 py-2 align-top">
                        <div className="text-[11px] font-medium text-slate-900">
                          {r.cliente_nome || "-"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {r.cliente_email || r.cliente_fone || "—"}
                        </div>
                        <div className="mt-0.5 text-[10px]">
                          {r.cliente_ativo === false ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 border border-rose-100">
                              Cliente inativo
                            </span>
                          ) : r.cliente_ativo === true ? (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 border-blue-100">
                              Cliente ativo
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Contrato */}
                      <td className="px-3 py-2 align-top text-[11px]">
                        <div>ID: {r.id_contrato || "—"}</div>
                        {r.contrato_status && (
                          <div className="mt-0.5">
                            <span
                              className={
                                "inline-flex rounded-full px-2 py-0.5 border text-[10px] " +
                                (contratoCode === "A"
                                  ? "bg-blue-50 text-blue-700 border-blue-100"
                                  : contratoCode === "P"
                                  ? "bg-sky-50 text-sky-700 border-sky-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100")
                              }
                            >
                              {contratoLabel}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Radius */}
                      <td className="px-3 py-2 align-top text-[11px]">
                        <div>{r.radius_login || "—"}</div>
                        <div className="mt-0.5 text-[10px]">
                          {r.radius_ativo === false ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 border-rose-100">
                              Radius inativo
                            </span>
                          ) : r.radius_ativo === true ? (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 border-blue-100">
                              Radius ativo
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Status SmartOLT */}
                      <td className="px-3 py-2 align-top text-[11px]">
                        <span
                          className={
                            "inline-flex rounded-full px-2 py-0.5 border text-[10px] " +
                            smartClass
                          }
                        >
                          {smartLabel}
                        </span>
                      </td>

                      {/* Internet */}
                      <td className="px-3 py-2 align-top text-[11px]">
                        {r.contrato_status_internet ? (
                          <span
                            className={
                              "inline-flex rounded-full px-2 py-0.5 border text-[10px] " +
                              (internetCode === "A"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : internetCode === "D"
                                ? "bg-slate-50 text-slate-700 border-slate-200"
                                : internetCode === "FA"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : internetStatusIsBlocked(internetCode)
                                ? "bg-violet-50 text-violet-700 border-violet-100"
                                : "bg-amber-50 text-amber-700 border-amber-100")
                            }
                          >
                            {internetLabel}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Plano */}
                      <td className="px-3 py-2 align-top text-[11px]">
                        {r.contrato_plano_desc || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Carregando relatório...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
