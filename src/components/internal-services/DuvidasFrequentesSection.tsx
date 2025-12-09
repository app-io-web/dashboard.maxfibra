import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import {
  HelpCircle,
  RefreshCcw,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DuvidaRecord = {
  id: string;
  Duvidas: string;
  DuvidasJson?: any;
  CreatedAt?: string;
  UpdatedAt?: string;
};

export function DuvidasFrequentesSection() {
  const [items, setItems] = useState<DuvidaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const navigate = useNavigate();

  // =============== HELPER: título do item =================

  function getItemTitle(item: DuvidaRecord): string {
    const fromField = (item.Duvidas || "").trim();
    if (fromField) return fromField;

    const data = item.DuvidasJson;

    // tenta pegar a primeira pergunta do JSON
    if (Array.isArray(data)) {
      const primeiroGrupo = data[0];
      if (primeiroGrupo) {
        const perguntas = Array.isArray(primeiroGrupo.Perguntas)
          ? primeiroGrupo.Perguntas
          : [];
        const primeiraPergunta = perguntas[0];
        if (primeiraPergunta?.Pergunta) {
          return String(primeiraPergunta.Pergunta);
        }
      }
    }

    if (data && typeof data === "object") {
      if (typeof data.pergunta === "string" && data.pergunta.trim()) {
        return data.pergunta.trim();
      }
    }

    return "Dúvidas frequentes";
  }

  // ================== FETCH LIST ==================

  async function fetchDuvidas(showReload = false) {
    try {
      if (showReload) setReloading(true);
      setError(null);

      const res = await api.get("/site/duvidas-frequentes");
      const data = res.data;

      const records: DuvidaRecord[] = (data.records || []).map((item: any) => ({
        id: item.id,
        Duvidas: item.Duvidas,
        DuvidasJson: item.DuvidasJson,
        CreatedAt: item.CreatedAt,
        UpdatedAt: item.UpdatedAt,
      }));

      setItems(records);
    } catch (err) {
      console.error("[FAQ] Erro ao listar dúvidas:", err);
      setError("Não foi possível carregar as dúvidas frequentes.");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }

  useEffect(() => {
    fetchDuvidas(false);
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      getItemTitle(item).toLowerCase().includes(term)
    );
  }, [items, search]);

  // ================== DELETE ==================

  async function handleDelete(item: DuvidaRecord) {
    const confirmMsg = `Tem certeza que deseja excluir a dúvida:\n\n"${getItemTitle(
      item
    )}" ?`;
    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    try {
      await api.delete(`/site/duvidas-frequentes/${item.id}`);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      if (expandedId === item.id) setExpandedId(null);
    } catch (err) {
      console.error("[FAQ] Erro ao excluir dúvida:", err);
      window.alert("Não foi possível excluir a dúvida. Tente novamente.");
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  // ================== HELPER: Markdown ==================

  function MarkdownText({ text }: { text: string }) {
    if (!text) return null;

    return (
      <div className="text-sm text-slate-700 whitespace-pre-line">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, ...props }) => <p {...props} className="mb-2" />,
            li: ({ node, ...props }) => (
              <li {...props} className="ml-4 list-disc" />
            ),
            strong: ({ node, ...props }) => (
              <strong {...props} className="font-semibold" />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  }

  // ================== RENDER JSON (LISTA) ==================

  function renderDuvidasJson(data: any) {
    if (!data) {
      return (
        <p className="text-sm text-slate-500">
          Nenhum conteúdo adicional cadastrado.
        </p>
      );
    }

    // Vamos transformar CADA pergunta em um card separado:
    if (Array.isArray(data)) {
      let perguntaIndex = 0;
      const cards: JSX.Element[] = [];

      data.forEach((grupo: any, idxGrupo: number) => {
        const perguntas = Array.isArray(grupo.Perguntas)
          ? grupo.Perguntas
          : [];

        perguntas.forEach((p: any) => {
          const respostasArr = Array.isArray(p.Resposta) ? p.Resposta : [];
          const numero = `Pergunta ${++perguntaIndex}`;

          cards.push(
            <div
              key={`${idxGrupo}-${perguntaIndex}`}
              className="rounded-xl border border-emerald-100 bg-white px-3 py-3"
            >
              <p className="text-[11px] font-semibold text-emerald-700 mb-2">
                {numero}
              </p>

              <div className="space-y-1.5">
                {p.Pergunta && (
                  <p className="text-sm font-medium text-slate-900">
                    {p.Pergunta}
                  </p>
                )}

                {respostasArr.map((r: any, idxResp: number) => {
                  const txt = r.Resposta_Pergunta || String(r);
                  return <MarkdownText key={idxResp} text={txt} />;
                })}
              </div>
            </div>
          );
        });
      });

      if (cards.length === 0) {
        return (
          <p className="text-sm text-slate-500">
            Nenhuma pergunta cadastrada nesse bloco.
          </p>
        );
      }

      return <div className="space-y-4">{cards}</div>;
    }

    if (typeof data === "object" && (data.pergunta || data.resposta)) {
      return (
        <div className="space-y-2">
          {data.pergunta && (
            <div>
              <p className="text-xs font-medium text-slate-500">Pergunta</p>
              <p className="text-sm text-slate-900">{data.pergunta}</p>
            </div>
          )}
          {data.resposta && (
            <div>
              <p className="text-xs font-medium text-slate-500">Resposta</p>
              <MarkdownText text={data.resposta} />
            </div>
          )}
        </div>
      );
    }

    return (
      <pre className="text-xs bg-slate-950/90 text-slate-50 rounded-lg p-3 overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  // ================== UI ==================

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Dúvidas Frequentes
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie o conteúdo de FAQ exibido no site.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchDuvidas(true)}
            disabled={reloading || loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            {reloading ? "Atualizando..." : "Recarregar"}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/internal-services/duvidas-frequentes/new")
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova dúvida
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="text"
          placeholder="Buscar por título da dúvida..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <span className="text-xs text-slate-400">
          {filteredItems.length} registro(s)
        </span>
      </div>

      {/* Erro */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Carregando...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            Nenhuma dúvida cadastrada ainda.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isOpen = expandedId === item.id;
              const titulo = getItemTitle(item);

              return (
                <li key={item.id} className="px-4">
                  <div className="flex items-center justify-between gap-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="flex-1 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                          <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {titulo}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            ID: {item.id}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-400">
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/internal-services/duvidas-frequentes/${item.id}`
                          )
                        }
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="pb-3">
                      <div className="rounded-xl bg-slate-50 px-3 py-3 mb-2">
                        {renderDuvidasJson(item.DuvidasJson)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                        {item.CreatedAt && (
                          <span>
                            Criado em:{" "}
                            {new Date(item.CreatedAt).toLocaleString()}
                          </span>
                        )}
                        {item.UpdatedAt && (
                          <span>
                            Atualizado em:{" "}
                            {new Date(item.UpdatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
