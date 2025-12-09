import { useEffect, useState, useMemo } from "react";
import { Activity, AlertTriangle, Wifi } from "lucide-react";
import { api } from "../../lib/api";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  CartesianGrid,
  Cell,
} from "recharts";

type InternetStatusSummary = {
  totalConsiderados: number;
  internet_normal: number;
  internet_bloqueada: number;
  outros_status_internet: number;
};

type IxcInternetStatusDashboardProps = {
  // quando clicar no card "Internet bloqueada"
  onOpenBlockedReport?: () => void;

  // permissões
  canViewContratosCard?: boolean;
  canViewInternetNormalCard?: boolean;
  canViewInternetBlockedCard?: boolean;
  canOpenBlockedFromDashboard?: boolean;
  canViewChart?: boolean;
};

export function IxcInternetStatusDashboard({
  onOpenBlockedReport,
  canViewContratosCard = true,
  canViewInternetNormalCard = true,
  canViewInternetBlockedCard = true,
  canOpenBlockedFromDashboard = true,
  canViewChart = true,
}: IxcInternetStatusDashboardProps) {
  const [data, setData] = useState<InternetStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSummary() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get<InternetStatusSummary>(
          "/ixc/contracts/internet-status-summary"
        );

        if (!isMounted) return;
        setData(res.data);
      } catch (err: any) {
        console.error("Erro ao buscar resumo IXC:", err);
        if (!isMounted) return;
        setError("Erro ao carregar dados do IXC. Tente novamente mais tarde.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const percentual = (valor: number) => {
    if (!data || data.totalConsiderados === 0) return "0%";
    const p = (valor / data.totalConsiderados) * 100;
    return `${p.toFixed(1)}%`;
  };

  const chartData = useMemo(() => {
    if (!data || data.totalConsiderados === 0) return [];

    const total = data.totalConsiderados;

    const makeItem = (name: string, value: number, color: string) => {
      const percent = (value / total) * 100;
      return {
        name,
        quantidade: value,
        percent,
        color,
      };
    };

    return [
      makeItem("Normal", data.internet_normal, "#10b981"), // emerald-500
      makeItem("Bloqueada", data.internet_bloqueada, "#f59e0b"), // amber-500
      makeItem("Outros", data.outros_status_internet, "#64748b"), // slate-500
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-10 w-40 rounded-md bg-slate-200 animate-pulse mb-4" />
          <div className="h-4 w-64 rounded-md bg-slate-200 animate-pulse mb-8" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Problema ao carregar painel IXC
              </p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-slate-500">
            Nenhum dado retornado pelo IXC.
          </p>
        </div>
      </div>
    );
  }

  const noCardsVisible =
    !canViewContratosCard &&
    !canViewInternetNormalCard &&
    !canViewInternetBlockedCard;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Activity className="w-5 h-5 text-emerald-500" />
              Painel IXC – Status de Internet
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Visão geral dos contratos ativos / pré-contrato com cliente ativo
              no IXC, separados por status de internet.
            </p>
          </div>
        </div>

        {/* Cards principais */}
        {!noCardsVisible ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Total contratos considerados */}
            {canViewContratosCard && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">
                      Contratos considerados
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {data.totalConsiderados.toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Status do contrato em{" "}
                      <span className="font-semibold">A</span> ou{" "}
                      <span className="font-semibold">P</span> e cliente ativo
                      (S)
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <Wifi className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Internet normal */}
            {canViewInternetNormalCard && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">
                      Internet normal
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-600">
                      {data.internet_normal.toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700/80">
                      {percentual(data.internet_normal)} dos contratos
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Internet bloqueada – agora respeita perm */}
            {canViewInternetBlockedCard && (
              <button
                type="button"
                onClick={
                  canOpenBlockedFromDashboard && onOpenBlockedReport
                    ? onOpenBlockedReport
                    : undefined
                }
                disabled={!canOpenBlockedFromDashboard || !onOpenBlockedReport}
                className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-left transition ${
                  canOpenBlockedFromDashboard && onOpenBlockedReport
                    ? "hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    : "cursor-not-allowed opacity-70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">
                      Internet bloqueada
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-amber-600">
                      {data.internet_bloqueada.toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-1 text-xs text-amber-700/80">
                      {percentual(data.internet_bloqueada)} dos contratos
                    </p>
                    {canOpenBlockedFromDashboard && onOpenBlockedReport && (
                      <p className="mt-2 text-[11px] text-amber-700/90 font-medium">
                        Clique para ver o relatório de clientes bloqueados
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Você não tem permissão para visualizar os cards deste painel.
            </p>
          </div>
        )}

        {/* Card gráfico */}
        {canViewChart && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Distribuição percentual por status de internet
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Percentual de contratos com internet normal, bloqueada e
                  outros status, em relação ao total considerado.
                </p>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: any, _name, props: any) => {
                      const payload = props?.payload;
                      const percent = Number(value) || payload?.percent || 0;
                      const qtd = payload?.quantidade || 0;

                      return [
                        `${percent.toFixed(1)}%`,
                        `${qtd.toLocaleString("pt-BR")} contratos`,
                      ];
                    }}
                  />
                  <Legend formatter={(value) => value} />
                  <Bar
                    dataKey="percent"
                    name="Percentual"
                    radius={[10, 10, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
