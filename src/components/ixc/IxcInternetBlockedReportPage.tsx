import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Filter,
  Loader2,
  Search,
  WifiOff,
  FileDown,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../lib/api";

type IxcBlockedRecord = {
  contrato_id: string | number;
  id_cliente: string | number;
  status_contrato: string;
  status_internet: string;

  cliente_nome: string | null;
  cliente_ativo: string | null;
  cliente_cpf_cnpj: string | null;
  cliente_cidade: string | null;

  cliente_telefone_1: string | null;
  cliente_telefone_2: string | null;
};

type IxcBlockedResponse = {
  totalBloqueados: number;
  registros: IxcBlockedRecord[];
};

type LastReportMetadata = {
  fileName: string;
  generatedAt: string;
  expiresAt: string;
};

const ITEMS_PER_PAGE = 10;

type IxcInternetBlockedReportPageProps = {
  canViewGenerateButton?: boolean;
  canGenerate?: boolean;
  canViewDownloadButton?: boolean;
  canDownload?: boolean;
  canViewTable?: boolean;
};

export function IxcInternetBlockedReportPage({
  canViewGenerateButton = true,
  canGenerate = true,
  canViewDownloadButton = true,
  canDownload = true,
  canViewTable = true,
}: IxcInternetBlockedReportPageProps) {
  const [data, setData] = useState<IxcBlockedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CM" | "CA" | "FA">(
    "ALL"
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastReport, setLastReport] = useState<LastReportMetadata | null>(null);

  const [showGenerateSuccessModal, setShowGenerateSuccessModal] =
    useState(false);

  // Busca JSON detalhado
  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get<IxcBlockedResponse>(
          "/ixc/contracts/internet-blocked-report"
        );

        if (!isMounted) return;
        setData(res.data);
      } catch (err: any) {
        console.error("Erro ao buscar relatório IXC (bloqueados):", err);
        if (!isMounted) return;
        setError(
          "Erro ao carregar relatório de clientes com internet bloqueada. Tente novamente mais tarde."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, []);

  // Busca metadata do último relatório Excel gerado
  useEffect(() => {
    let isMounted = true;

    async function fetchLastMetadata() {
      try {
        const res = await api.get<{ lastReport: LastReportMetadata | null }>(
          "/ixc/contracts/internet-blocked-report/last-metadata"
        );
        if (!isMounted) return;
        setLastReport(res.data.lastReport);
      } catch (err) {
        console.error(
          "Erro ao buscar metadata do relatório Excel (bloqueados):",
          err
        );
      }
    }

    fetchLastMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

  // sempre que mudar busca ou filtro, volta pra primeira página
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];

    const term = search.trim().toLowerCase();

    return data.registros.filter((item) => {
      if (statusFilter !== "ALL") {
        if (item.status_internet !== statusFilter) return false;
      }

      if (!term) return true;

      const haystack = [
        item.cliente_nome || "",
        item.cliente_cpf_cnpj || "",
        String(item.contrato_id || ""),
        String(item.id_cliente || ""),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [data, search, statusFilter]);

  function getStatusInternetLabel(code: string) {
    const upper = (code || "").toUpperCase();
    switch (upper) {
      case "CM":
        return "Corte Manual (CM)";
      case "CA":
        return "Corte Automático (CA)";
      case "FA":
        return "Financeiro (FA)";
      default:
        return upper || "-";
    }
  }

  function statusInternetBadgeClass(code: string) {
    const upper = (code || "").toUpperCase();
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
    switch (upper) {
      case "CM":
        return `${base} border-amber-200 bg-amber-50 text-amber-700`;
      case "CA":
        return `${base} border-orange-200 bg-orange-50 text-orange-700`;
      case "FA":
        return `${base} border-red-200 bg-red-50 text-red-700`;
      default:
        return `${base} border-slate-200 bg-slate-50 text-slate-600`;
    }
  }

  // POST para gerar o relatório e salvar no cache (24h)
  async function handleGenerateReport() {
    if (!canGenerate) return;

    try {
      setGenerating(true);

      const res = await api.post<LastReportMetadata>(
        "/ixc/contracts/internet-blocked-report/generate"
      );

      setLastReport(res.data);
      setShowGenerateSuccessModal(true);
    } catch (err: any) {
      console.error("Erro ao gerar relatório de internet bloqueada:", err);
      alert(
        "Erro ao gerar o relatório. Verifique o console para mais detalhes."
      );
    } finally {
      setGenerating(false);
    }
  }

  // GET para baixar o último relatório gerado (do cache)
  async function handleDownloadReport() {
    if (!canDownload) return;

    try {
      setDownloading(true);

      const response = await api.get(
        "/ixc/contracts/internet-blocked-report/export",
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileName =
        lastReport?.fileName ||
        `relatorio_internet_bloqueada_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;

      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Erro ao baixar relatório de internet bloqueada:", err);

      const status = err?.response?.status;
      if (status === 404) {
        alert(
          "Nenhum relatório disponível. Gere um novo relatório antes de tentar baixar."
        );
      } else {
        alert(
          "Erro ao baixar o relatório. Verifique o console para mais detalhes."
        );
      }
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="h-8 w-48 rounded-md bg-slate-200 animate-pulse" />
            <div className="h-8 w-24 rounded-md bg-slate-200 animate-pulse" />
          </div>
          <div className="h-4 w-80 rounded-md bg-slate-200 animate-pulse" />
          <div className="h-10 w-full max-w-md rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-64 w-full rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Problema ao carregar relatório de bloqueados
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
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-sm text-slate-500">
            Nenhum dado retornado pelo IXC para o relatório de bloqueados.
          </p>
        </div>
      </div>
    );
  }

  const totalFiltrado = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltrado / ITEMS_PER_PAGE));
  const currentSafePage = Math.min(currentPage, totalPages);

  const startIndex = (currentSafePage - 1) * ITEMS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const from = totalFiltrado === 0 ? 0 : startIndex + 1;
  const to = startIndex + paginatedRecords.length;

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Cabeçalho */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <WifiOff className="w-5 h-5 text-amber-500" />
                Clientes com Internet Bloqueada – IXC
              </h1>
              <p className="text-sm text-slate-500">
                Listagem detalhada dos contratos com internet bloqueada no IXC,
                considerando apenas contratos ativos/pré e clientes ativos.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5 flex flex-col items-end">
                <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">
                  Total bloqueados
                </span>
                <span className="text-2xl font-semibold text-amber-700 leading-none">
                  {data.totalBloqueados.toLocaleString("pt-BR")}
                </span>
              </div>

              {/* Botão GERAR relatório */}
              {canViewGenerateButton && (
                <button
                  type="button"
                  onClick={canGenerate ? handleGenerateReport : undefined}
                  disabled={generating || !canGenerate}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Gerando relatório...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3 h-3" />
                      Gerar relatório (Excel)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Filtros / busca */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Busca */}
              <div className="w-full md:max-w-md">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                  <Search className="w-3 h-3" />
                  Buscar por cliente, CPF/CNPJ, ID contrato ou ID cliente
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Digite para filtrar..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  {loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              {/* Filtro status_internet */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 uppercase">
                  <Filter className="w-3 h-3" />
                  Status internet
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "ALL", label: "Todos" },
                    { value: "CM", label: "CM" },
                    { value: "CA", label: "CA" },
                    { value: "FA", label: "FA" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setStatusFilter(opt.value as typeof statusFilter)
                      }
                      className={`px-2.5 py-1 rounded-full text-xs border transition ${
                        statusFilter === opt.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
              <span>
                Exibindo{" "}
                <span className="font-semibold">
                  {from.toLocaleString("pt-BR")}–{to.toLocaleString("pt-BR")}
                </span>{" "}
                de{" "}
                <span className="font-semibold">
                  {totalFiltrado.toLocaleString("pt-BR")}
                </span>{" "}
                contratos filtrados (de{" "}
                <span className="font-semibold">
                  {data.totalBloqueados.toLocaleString("pt-BR")}
                </span>{" "}
                bloqueados no total).
              </span>
            </div>
          </div>

          {/* Card do relatório Excel disponível por 24h */}
          {canViewDownloadButton && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-emerald-900">
                <p className="font-semibold flex items-center gap-1">
                  <FileDown className="w-3 h-3" />
                  Relatório Excel disponível por 24 horas
                </p>

                {lastReport ? (
                  <>
                    <p className="mt-0.5">
                      Último gerado em{" "}
                      <span className="font-mono">
                        {new Date(
                          lastReport.generatedAt
                        ).toLocaleString("pt-BR")}
                      </span>
                    </p>
                    <p className="text-[11px] opacity-80">
                      Expira em{" "}
                      <span className="font-mono">
                        {new Date(lastReport.expiresAt).toLocaleString(
                          "pt-BR"
                        )}
                      </span>
                      .
                    </p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Nome do arquivo:{" "}
                      <span className="font-mono">{lastReport.fileName}</span>
                    </p>
                  </>
                ) : (
                  <p className="mt-0.5">
                    Nenhum relatório gerado nas últimas 24 horas. Clique em{" "}
                    <span className="font-semibold">Gerar relatório</span> no
                    topo da página para criar um novo.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={canDownload ? handleDownloadReport : undefined}
                  disabled={!lastReport || downloading || !canDownload}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3 h-3" />
                      Baixar último relatório
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tabela */}
          {canViewTable ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Cliente
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Status Internet / Contrato
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Contrato / Cliente
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Telefones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-6 text-center text-sm text-slate-500"
                          >
                            Nenhum contrato encontrado com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        paginatedRecords.map((item) => (
                          <tr
                            key={`${item.contrato_id}-${item.id_cliente}`}
                          >
                            {/* Cliente */}
                            <td className="px-3 py-2 align-top text-sm text-slate-900">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {item.cliente_nome || "-"}
                                </span>
                                {item.cliente_cpf_cnpj && (
                                  <span className="text-xs text-slate-500">
                                    {item.cliente_cpf_cnpj}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status internet / contrato */}
                            <td className="px-3 py-2 align-top text-sm">
                              <span
                                className={statusInternetBadgeClass(
                                  item.status_internet
                                )}
                              >
                                {getStatusInternetLabel(
                                  item.status_internet
                                )}
                              </span>
                              <div className="mt-1 text-[11px] text-slate-400">
                                Status contrato:{" "}
                                <span className="font-medium">
                                  {item.status_contrato || "-"}
                                </span>
                              </div>
                            </td>

                            {/* Contrato / Cliente IDs */}
                            <td className="px-3 py-2 align-top text-sm text-slate-700">
                              <div className="flex flex-col text-xs">
                                <span>
                                  Contrato:{" "}
                                  <span className="font-mono font-medium">
                                    {item.contrato_id}
                                  </span>
                                </span>
                                <span className="text-slate-500 mt-0.5">
                                  Cliente ID:{" "}
                                  <span className="font-mono">
                                    {item.id_cliente}
                                  </span>
                                </span>
                              </div>
                            </td>

                            {/* Telefones */}
                            <td className="px-3 py-2 align-top text-sm text-slate-700">
                              <div className="flex flex-col gap-0.5 text-xs">
                                <span>
                                  Telefone comercial:{" "}
                                  {item.cliente_telefone_1 || "-"}
                                </span>
                                <span>
                                  Telefone celular:{" "}
                                  {item.cliente_telefone_2 || "-"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalFiltrado > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5 text-xs text-slate-500">
                    <span>
                      Página{" "}
                      <span className="font-semibold">
                        {currentSafePage}
                      </span>{" "}
                      de{" "}
                      <span className="font-semibold">{totalPages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentSafePage === 1}
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        className={`px-2.5 py-1 rounded-full border text-xs inline-flex items-center gap-1 ${
                          currentSafePage === 1
                            ? "border-slate-200 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={currentSafePage === totalPages}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        className={`px-2.5 py-1 rounded-full border text-xs inline-flex items-center gap-1 ${
                          currentSafePage === totalPages
                            ? "border-slate-200 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Legendinha dos códigos */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                <span className="font-semibold uppercase tracking-wide">
                  Legenda status internet:
                </span>
                <span>
                  <span className="font-semibold">CM</span>: corte manual
                </span>
                <span>
                  <span className="font-semibold">CA</span>: corte automático
                </span>
                <span>
                  <span className="font-semibold">FA</span>: bloqueio
                  financeiro
                </span>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-500">
              Você não tem permissão para visualizar a tabela de clientes
              bloqueados.
            </div>
          )}
        </div>
      </div>

      {/* Modal de sucesso ao gerar relatório */}
      {showGenerateSuccessModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowGenerateSuccessModal(false)}
          />
          <div className="relative z-50 w-full max-w-sm mx-4 rounded-2xl bg-white shadow-xl border border-emerald-100 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  Relatório gerado com sucesso
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  O relatório Excel foi gerado e ficará disponível para download
                  neste painel pelos próximos{" "}
                  <span className="font-semibold">24 horas</span>.
                </p>
                {lastReport && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Gerado em{" "}
                    <span className="font-mono">
                      {new Date(
                        lastReport.generatedAt
                      ).toLocaleString("pt-BR")}
                    </span>
                    .
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGenerateSuccessModal(false)}
                className="inline-flex items-center justify-center rounded-full border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Beleza, entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
