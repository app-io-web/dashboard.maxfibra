// src/pages/DuvidasFrequentesEditPage.tsx
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import {
  HelpCircle,
  ArrowLeft,
  Save,
  Trash2,
  Plus,
} from "lucide-react";

type QaItem = {
  pergunta: string;
  resposta: string;
};

type FormState = {
  id: string | null;
  duvidas: string;
  qaItems: QaItem[];
};

type DuvidaRecordApi = {
  id: string;
  Duvidas: string;
  DuvidasJson?: any;
};

const EMPTY_QA: QaItem = { pergunta: "", resposta: "" };

function parseDuvidasJsonToQaItems(data: any): QaItem[] {
  if (!data) return [EMPTY_QA];

  if (Array.isArray(data)) {
    const result: QaItem[] = [];

    data.forEach((grupo: any) => {
      const perguntas = Array.isArray(grupo?.Perguntas)
        ? grupo.Perguntas
        : [];

      perguntas.forEach((p: any) => {
        const pergunta = p?.Pergunta || "";
        let respostaText = "";

        if (Array.isArray(p?.Resposta)) {
          respostaText = p.Resposta.map((r: any) => {
            if (r && typeof r === "object" && "Resposta_Pergunta" in r) {
              return String(r.Resposta_Pergunta ?? "");
            }
            return String(r ?? "");
          }).join("\n\n");
        } else if (typeof p?.Resposta === "string") {
          respostaText = p.Resposta;
        }

        if (pergunta || respostaText) {
          result.push({ pergunta, resposta: respostaText });
        }
      });
    });

    return result.length > 0 ? result : [EMPTY_QA];
  }

  if (typeof data === "object" && (data.pergunta || data.resposta)) {
    return [
      {
        pergunta: data.pergunta || "",
        resposta: data.resposta || "",
      },
    ];
  }

  return [
    {
      pergunta: "",
      resposta: typeof data === "string" ? data : JSON.stringify(data),
    },
  ];
}

function buildDuvidasJsonFromQaItems(items: QaItem[]): any {
  const limpos = items
    .map((i) => ({
      pergunta: i.pergunta.trim(),
      resposta: i.resposta.trim(),
    }))
    .filter((i) => i.pergunta || i.resposta);

  if (limpos.length === 0) return null;

  return [
    {
      Numero_Pergunta: "Perguntas",
      Perguntas: limpos.map((i) => ({
        Pergunta: i.pergunta,
        Resposta: [
          {
            Resposta_Pergunta: i.resposta,
          },
        ],
      })),
    },
  ];
}

export function DuvidasFrequentesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNew = !id || id === "new";

  const [form, setForm] = useState<FormState>({
    id: null,
    duvidas: "",
    qaItems: [EMPTY_QA],
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega registro se for edição
  useEffect(() => {
    if (isNew) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get<DuvidaRecordApi>(
          `/site/duvidas-frequentes/${id}`
        );
        const data = res.data;

        setForm({
          id: data.id,
          duvidas: data.Duvidas || "",
          qaItems: parseDuvidasJsonToQaItems(data.DuvidasJson),
        });
      } catch (err: any) {
        console.error("[FAQ] Erro ao carregar dúvida:", err);
        setError(
          err?.response?.data?.message ||
            "Não foi possível carregar a dúvida."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, isNew]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.duvidas.trim()) {
      alert("O título da dúvida é obrigatório.");
      return;
    }

    const duvidasJson = buildDuvidasJsonFromQaItems(form.qaItems);

    try {
      setSaving(true);
      setError(null);

      if (isNew) {
        await api.post("/site/duvidas-frequentes", {
          Duvidas: form.duvidas.trim(),
          DuvidasJson: duvidasJson,
        });
      } else if (form.id) {
        await api.patch(`/site/duvidas-frequentes/${form.id}`, {
          Duvidas: form.duvidas.trim(),
          DuvidasJson: duvidasJson,
        });
      }

      // volta pra tela anterior (Serviços Internos -> Dúvidas Frequentes)
      navigate(-1);
    } catch (err: any) {
      console.error("[FAQ] Erro ao salvar:", err);
      setError(
        err?.response?.data?.message ||
          "Erro ao salvar. Verifique os dados."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header page */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {isNew ? "Nova dúvida frequente" : "Editar dúvida frequente"}
              </h1>
              <p className="text-xs text-slate-500">
                Estruture as perguntas e respostas exibidas no FAQ do site.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando dados da dúvida...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Título / texto da dúvida (grupo)
            </label>
            <input
              type="text"
              value={form.duvidas}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, duvidas: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Ex.: Informações gerais sobre a Max Fibra"
            />
            <p className="text-[11px] text-slate-400">
              Esse título representa o bloco de perguntas exibido no site.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                Perguntas e respostas
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    qaItems: [...prev.qaItems, { ...EMPTY_QA }],
                  }))
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <Plus className="h-3 w-3" />
                Adicionar pergunta
              </button>
            </div>

            {form.qaItems.map((qa, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-600">
                    Pergunta {index + 1}
                  </p>
                  {form.qaItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          qaItems: prev.qaItems.filter(
                            (_, i) => i !== index
                          ),
                        }))
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remover
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Pergunta
                  </label>
                  <input
                    type="text"
                    value={qa.pergunta}
                    onChange={(e) =>
                      setForm((prev) => {
                        const clone = [...prev.qaItems];
                        clone[index] = {
                          ...clone[index],
                          pergunta: e.target.value,
                        };
                        return { ...prev, qaItems: clone };
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Ex.: O que é fibra óptica?"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Resposta
                  </label>
                  <textarea
                    value={qa.resposta}
                    onChange={(e) =>
                      setForm((prev) => {
                        const clone = [...prev.qaItems];
                        clone[index] = {
                          ...clone[index],
                          resposta: e.target.value,
                        };
                        return { ...prev, qaItems: clone };
                      })
                    }
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Texto da resposta (pode usar **negrito**, _itálico_, etc)."
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={saving}
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70"
            >
              <Save className="h-3.5 w-3.5" />
              {saving
                ? isNew
                  ? "Criando..."
                  : "Salvando..."
                : isNew
                ? "Criar dúvida"
                : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
