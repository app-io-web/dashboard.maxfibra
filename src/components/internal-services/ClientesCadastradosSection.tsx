// src/components/internal-services/ClientesCadastradosSection.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { FileText, Search, RefreshCcw } from "lucide-react";

type CadastroFicha = {
  id: string;
  protocolo: string;
  data_hora: string;
  nome: string;
  cpf: string;
  cidade: string | null;
  bairro: string | null;
  plano: string | null;
  streaming: string | null;
  vencimento: string | null;
  vendedor: string | null;
  vendedor_email: string | null;
  created_at: string;
};

export function ClientesCadastradosSection() {
  const [fichas, setFichas] = useState<CadastroFicha[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  async function fetchFichas(showReload = false) {
    try {
      setError(null);
      if (showReload) setReloading(true);
      else setLoading(true);

      const res = await api.get<CadastroFicha[]>("/cadastro-fichas");
      setFichas(res.data);
    } catch (err) {
      console.error("Erro ao buscar fichas:", err);
      setError("Não foi possível carregar as fichas cadastradas.");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }

  useEffect(() => {
    fetchFichas(false);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fichas;

    return fichas.filter((f) => {
      return (
        f.protocolo.toLowerCase().includes(term) ||
        f.nome.toLowerCase().includes(term) ||
        f.cpf.toLowerCase().includes(term) ||
        (f.plano || "").toLowerCase().includes(term)
      );
    });
  }, [fichas, search]);

  function formatDateTime(value: string | null) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("pt-BR");
  }

  function formatShortDate(value: string | null) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("pt-BR");
  }

  function openFichaDetail(id: string) {
    // Ajusta essa rota se no seu router estiver diferente
    navigate(`/services/clientes/${id}`);
  }

  return (
    <div className="space-y-4">
      {/* Headerzinho da seção */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Clientes cadastrados / Fichas
            </h2>
            <p className="text-xs text-slate-500">
              Pesquise pelas fichas usando protocolo, nome, CPF ou plano.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchFichas(true)}
          disabled={loading || reloading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-500 disabled:opacity-50"
        >
          <RefreshCcw className={`w-3 h-3 ${reloading ? "animate-spin" : ""}`} />
          Recarregar
        </button>
      </div>

      {/* Filtro simples */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Buscar ficha
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Protocolo, nome, CPF ou plano..."
              className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 sm:w-40 sm:text-right">
          {loading
            ? "Carregando fichas..."
            : `${filtered.length} de ${fichas.length} fichas`}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm overflow-hidden">
        {error && (
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            Carregando dados dos clientes cadastrados...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            Nenhuma ficha encontrada com os critérios atuais.
          </div>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 text-left">Protocolo</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Plano</th>
                  <th className="px-4 py-2 text-left">Cidade / Bairro</th>
                  <th className="px-4 py-2 text-left">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ficha) => (
                  <tr
                    key={ficha.id}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    {/* PROTOCOLO */}
                    <td className="px-4 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => openFichaDetail(ficha.id)}
                        className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {ficha.protocolo}
                      </button>
                      <div className="text-[11px] text-slate-500">
                        {formatDateTime(ficha.data_hora)}
                      </div>
                    </td>

                    {/* CLIENTE */}
                    <td className="px-4 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => openFichaDetail(ficha.id)}
                        className="text-xs font-medium text-slate-800 hover:text-blue-700 hover:underline text-left"
                      >
                        {ficha.nome}
                      </button>
                      <div className="text-[11px] text-slate-500">
                        CPF: {ficha.cpf}
                      </div>
                    </td>

                    {/* PLANO */}
                    <td className="px-4 py-2 align-top">
                      <div className="text-xs font-medium text-blue-700">
                        {ficha.plano || "-"}
                      </div>
                      {ficha.streaming && (
                        <div className="text-[11px] text-slate-500">
                          {ficha.streaming}
                        </div>
                      )}
                    </td>

                    {/* CIDADE / BAIRRO */}
                    <td className="px-4 py-2 align-top">
                      <div className="text-xs text-slate-800">
                        {ficha.cidade || "-"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ficha.bairro || ""}
                      </div>
                    </td>

                    {/* CRIADO EM */}
                    <td className="px-4 py-2 align-top">
                      <div className="text-[11px] text-slate-500">
                        {formatShortDate(ficha.created_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
