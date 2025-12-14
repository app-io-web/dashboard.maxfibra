import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import {
  Wrench,
  RefreshCcw,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type ServicoAdicional = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
};

type ConfigPlanos = {
  id: string | null;      // id do registro no NocoDB (noco_record_id)
  title: string;
  planoTurbo: string[] | null | undefined;
  planoInfinity: string[] | null | undefined;
  planoGold: string[] | null | undefined;
};

type FormState = {
  id: string | null; // id do NocoDB
  title: string;
  planoTurbo: string[];
  planoInfinity: string[];
  planoGold: string[];
};

// fallback, só se não tiver nada no banco
const BASE_SERVICOS = [
  "Ubook Plus",
  "Estuda+",
  "PlayKids",
  "NoPing",
  "Kaspesky",
  "Deezer",
  "O Jornalista",
  "Queima Diaria",
  "HBO - MAX",
  "Sky+ Globo Lite",
  "NBA - Esportes",
];

function normalizeField(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return [];
}

export function ServicosAdicionaisPlanosSection() {
  const [form, setForm] = useState<FormState>({
    id: null,
    title: "",
    planoTurbo: [],
    planoInfinity: [],
    planoGold: [],
  });

  const [allServicos, setAllServicos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function fetchConfig(showReloadSpinner = false) {
    try {
      setError(null);
      if (showReloadSpinner) setReloading(true);
      else setLoading(true);

      // agora o back responde { services, config }
      const { data } = await api.get("/site/servicos-planos");

      const services: ServicoAdicional[] = data?.services ?? [];
      const config: ConfigPlanos | undefined = data?.config;

      // nomes cadastrados no Postgres (catálogo oficial)
      const nomesDb = services.map((s) => s.nome).filter(Boolean);
      const nomesDbSet = new Set(nomesDb);

      // normaliza o que veio da config (espelho)
      const turboRaw = normalizeField(config?.planoTurbo);
      const infinityRaw = normalizeField(config?.planoInfinity);
      const goldRaw = normalizeField(config?.planoGold);

      // 🔒 GARANTIR QUE SÓ O QUE EXISTE NO CATÁLOGO FICA NO FORM
      const turbo = turboRaw.filter((nome) => nomesDbSet.has(nome));
      const infinity = infinityRaw.filter((nome) => nomesDbSet.has(nome));
      const gold = goldRaw.filter((nome) => nomesDbSet.has(nome));

      // só pra debug: ver o que ficou de fora
      const extrasInvalidos = [
        ...turboRaw.filter((n) => !nomesDbSet.has(n)),
        ...infinityRaw.filter((n) => !nomesDbSet.has(n)),
        ...goldRaw.filter((n) => !nomesDbSet.has(n)),
      ];

      if (extrasInvalidos.length) {
        console.warn(
          "[SERVICOS_PLANOS] Serviços encontrados na config mas não existem no catálogo e serão ignorados:",
          extrasInvalidos
        );
      }

      // lista exibida nas checkboxes = catálogo oficial
      let unique = Array.from(new Set(nomesDb)).sort((a, b) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" })
      );

      // fallback pra não ficar vazio se o banco estiver zerado
      if (unique.length === 0) {
        unique = BASE_SERVICOS;
      }

      setAllServicos(unique);

      // configura o formulário com o que veio do espelho (já filtrado)
      setForm({
        id: config?.id ?? null, // esse id é o noco_record_id que o back manda
        title: config?.title ?? "",
        planoTurbo: turbo,
        planoInfinity: infinity,
        planoGold: gold,
      });
    } catch (err: any) {
      console.error("[SERVICOS_PLANOS] erro ao buscar:", err);
      setError(
        "Não foi possível carregar as configurações de serviços por plano."
      );
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }

  useEffect(() => {
    fetchConfig(false);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const payload = {
        title: form.title || "Configuração Serviços x Planos",
        planoTurbo: form.planoTurbo,
        planoInfinity: form.planoInfinity,
        planoGold: form.planoGold,
      };

      if (form.id) {
        // quando já tem id, a rota PATCH usa o id do NocoDB
        await api.patch(`/site/servicos-planos/${form.id}`, payload);
      } else {
        // primeira vez: POST (back faz UPSERT + cria no NocoDB)
        const { data } = await api.post("/site/servicos-planos", payload);
        const newId: string | null = data?.config?.id ?? null;

        setForm((prev) => ({
          ...prev,
          id: newId,
        }));
      }

      setSuccessMsg("Vínculo de serviços com planos atualizado com sucesso!");
      await fetchConfig(false);
    } catch (err: any) {
      console.error("[SERVICOS_PLANOS] erro ao salvar:", err);

      // se o back ainda devolver mensagem bonitinha, mostra ela
      const msgBack =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Erro ao salvar vínculos de serviços com planos.";

      setError(msgBack);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  }

  function toggleServico(
    field: "planoTurbo" | "planoGold" | "planoInfinity",
    servico: string
  ) {
    setForm((prev) => {
      const current = new Set(prev[field]);
      if (current.has(servico)) current.delete(servico);
      else current.add(servico);
      return {
        ...prev,
        [field]: Array.from(current),
      };
    });
  }

  function renderServicosList(
    field: "planoTurbo" | "planoGold" | "planoInfinity"
  ) {
    const selected = form[field];

    if (!allServicos.length) {
      return (
        <p className="text-[11px] text-slate-400">
          Nenhum serviço cadastrado.
        </p>
      );
    }

    return (
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {allServicos.map((servico) => {
          const checked = selected.includes(servico);
          return (
            <label
              key={servico}
              className="flex items-center gap-2 text-xs rounded-lg px-2 py-1 hover:bg-white cursor-pointer"
            >
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                checked={checked}
                onChange={() => toggleServico(field, servico)}
              />
              <span className="text-slate-700">{servico}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-white/90 border border-slate-200 shadow-md p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Vínculo de Serviços Adicionais por Plano
            </h2>
            <p className="text-xs text-slate-500">
              Defina quais serviços adicionais estarão disponíveis em cada plano
              (Turbo, Gold e Infinity).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchConfig(true)}
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
          disabled={reloading || loading}
        >
          <RefreshCcw
            className={`w-3 h-3 ${reloading ? "animate-spin" : ""}`}
          />
          Recarregar
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <p className="text-sm text-slate-500">Carregando configurações...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* mensagens */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Nome da configuração
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Ex: Config padrão de serviços por plano"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Apenas um registro já resolve (padrão global), mas você pode
                criar diferentes configs se precisar no futuro.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Plano Turbo */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-700 uppercase">
                  Plano Turbo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Marque os serviços adicionais disponíveis neste plano.
              </p>
              {renderServicosList("planoTurbo")}
            </div>

            {/* Plano Gold */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-yellow-700 uppercase">
                  Plano Gold
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Essa lista é sincronizada com o campo &quot;Plano Gold&quot; no
                NocoDB.
              </p>
              {renderServicosList("planoGold")}
            </div>

            {/* Plano Infinity */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-sky-700 uppercase">
                  Plano Infinity
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Campo vinculado ao &quot;Plano Infinity&quot; no NocoDB.
              </p>
              {renderServicosList("planoInfinity")}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium shadow hover:bg-blue-600 transition disabled:opacity-60"
            >
              <Save
                className={["w-4 h-4", saving ? "animate-spin" : ""].join(" ")}
              />
              {saving ? "Salvando..." : "Salvar configurações"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
