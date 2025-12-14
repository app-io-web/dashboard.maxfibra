// src/components/internal-services/ServicosAdicionaisConfiguracoesSection.tsx
import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import {
  Wrench,
  RefreshCcw,
  Save,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
} from "lucide-react";

type PlanoServApiRecord = {
  id: string;
  title: string | null;
  tagMaisVendido: string | null;
  planos: {
    turbo: any;
    gold: any;
    infinity: any;
  };
};

type SimpleService = {
  nome: string;
  url: string;
};

type FormState = {
  id: string | null;
  title: string;
  tagMaisVendido: string;
  turboServices: SimpleService[];
  goldServices: SimpleService[];
  infinityServices: SimpleService[];
};

type PlanoKey = "turboServices" | "goldServices" | "infinityServices";

function ensureAtLeastOne(list: SimpleService[]): SimpleService[] {
  if (!list || list.length === 0) {
    return [{ nome: "", url: "" }];
  }
  return list;
}

// converte JSON vindo do Noco pra lista simples {nome, url}
function parsePlanoFromNoco(raw: any): SimpleService[] {
  if (!raw) return [];

  try {
    // geralmente vem como array
    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0];

      // formato: [{ Plano: "Turbo", Serviços: [ { nome, Foto: [{url}] } ] }]
      if (first && Array.isArray(first.Serviços)) {
        return first.Serviços.map((srv: any) => ({
          nome: srv?.nome ?? "",
          url: srv?.Foto?.[0]?.url ?? "",
        }));
      }

      // fallback: array direto de serviços
      return raw.map((srv: any) => ({
        nome: srv?.nome ?? "",
        url: srv?.Foto?.[0]?.url ?? srv?.url ?? "",
      }));
    }
  } catch (err) {
    console.error("[SERV_ADIC_CONFIG] Erro ao parsear plano NocoDB:", err);
  }

  return [];
}

// monta JSON naquele formato bonitinho pro Noco
function buildPlanoJson(services: SimpleService[], planoNome: string) {
  const clean = (services || [])
    .filter((s) => s.nome.trim() || s.url.trim())
    .map((s) => ({
      nome: s.nome.trim(),
      Foto: s.url.trim() ? [{ url: s.url.trim() }] : [],
    }));

  if (!clean.length) return [];

  return [
    {
      Plano: planoNome,
      Serviços: clean,
    },
  ];
}

export function ServicosAdicionaisConfiguracoesSection() {
  const [form, setForm] = useState<FormState>({
    id: null,
    title: "",
    tagMaisVendido: "",
    turboServices: [{ nome: "", url: "" }],
    goldServices: [{ nome: "", url: "" }],
    infinityServices: [{ nome: "", url: "" }],
  });

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function fetchConfig(showReloadSpinner = false) {
    try {
      setError(null);
      setSuccessMsg(null);
      if (showReloadSpinner) setReloading(true);
      setLoading(true);

      const res = await api.get("/site/plano-servico-adicional");
      const data = res.data;

      const records: PlanoServApiRecord[] = data?.records || [];

      if (!records.length) {
        // não tem nada ainda -> deixa o form com uma linha vazia em cada plano
        setForm({
          id: null,
          title: "",
          tagMaisVendido: "",
          turboServices: [{ nome: "", url: "" }],
          goldServices: [{ nome: "", url: "" }],
          infinityServices: [{ nome: "", url: "" }],
        });
      } else {
        const first = records[0];

        const turboServices = ensureAtLeastOne(
          parsePlanoFromNoco(first.planos?.turbo)
        );
        const goldServices = ensureAtLeastOne(
          parsePlanoFromNoco(first.planos?.gold)
        );
        const infinityServices = ensureAtLeastOne(
          parsePlanoFromNoco(first.planos?.infinity)
        );

        setForm({
          id: first.id,
          title: first.title || "",
          tagMaisVendido: first.tagMaisVendido || "",
          turboServices,
          goldServices,
          infinityServices,
        });
      }
    } catch (err: any) {
      console.error("[SERV_ADIC_CONFIG] Erro ao buscar configs", err);
      setError(
        err.response?.data?.error ||
          "Erro ao carregar configuração de serviços adicionais"
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

    const payload = {
      title: form.title || null,
      tagMaisVendido: form.tagMaisVendido || null,
      planos: {
        turbo: buildPlanoJson(form.turboServices, "Turbo"),
        gold: buildPlanoJson(form.goldServices, "Gold"),
        infinity: buildPlanoJson(form.infinityServices, "Infinity"),
      },
    };

    try {
      setSaving(true);

      if (form.id) {
        await api.patch(`/site/plano-servico-adicional/${form.id}`, payload);
      } else {
        const res = await api.post(`/site/plano-servico-adicional`, payload);
        const created = res.data?.records?.[0];
        if (created?.id) {
          setForm((prev) => ({ ...prev, id: created.id }));
        }
      }

      setSuccessMsg("Configurações de serviços adicionais salvas com sucesso!");
    } catch (err: any) {
      console.error("[SERV_ADIC_CONFIG] Erro ao salvar", err);
      setError(
        err.response?.data?.error ||
          "Erro ao salvar configuração de serviços adicionais"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleChangeField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateServices(
    planoKey: PlanoKey,
    updater: (list: SimpleService[]) => SimpleService[]
  ) {
    setForm((prev) => ({
      ...prev,
      [planoKey]: updater(prev[planoKey]),
    }));
  }

  function handleServiceChange(
    planoKey: PlanoKey,
    index: number,
    field: keyof SimpleService,
    value: string
  ) {
    updateServices(planoKey, (list) =>
      list.map((srv, i) =>
        i === index
          ? {
              ...srv,
              [field]: value,
            }
          : srv
      )
    );
  }

  function handleAddService(planoKey: PlanoKey) {
    updateServices(planoKey, (list) => [
      ...list,
      { nome: "", url: "" } as SimpleService,
    ]);
  }

  function handleRemoveService(planoKey: PlanoKey, index: number) {
    updateServices(planoKey, (list) => {
      const newList = list.filter((_, i) => i !== index);
      return ensureAtLeastOne(newList);
    });
  }

  function PlanoCard({
    planoKey,
    title,
    colorClass,
    campoLabel,
  }: {
    planoKey: PlanoKey;
    title: string;
    colorClass: string;
    campoLabel: string;
  }) {
    const services = form[planoKey];

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${colorClass}`}>
            {title}
          </span>
          <span className="text-[10px] text-slate-400">{campoLabel}</span>
        </div>

        <div className="space-y-2">
          {services.map((srv, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-600">
                  Serviço #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(planoKey, index)}
                  className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-500">
                  Nome do serviço
                </label>
                <input
                  type="text"
                  value={srv.nome}
                  onChange={(e) =>
                    handleServiceChange(planoKey, index, "nome", e.target.value)
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Estuda, UbookPlus, PlayKids..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-500">
                  URL da imagem (Foto)
                </label>
                <input
                  type="text"
                  value={srv.url}
                  onChange={(e) =>
                    handleServiceChange(planoKey, index, "url", e.target.value)
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://s3.nexusnerds.com.br/maxfibra/..."
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleAddService(planoKey)}
          className="inline-flex items-center justify-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <Plus className="w-3 h-3" />
          Adicionar serviço
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/90 text-white shadow">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Configurações de Serviços Adicionais
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchConfig(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          disabled={reloading || loading}
        >
          <RefreshCcw
            className={`w-3 h-3 ${reloading ? "animate-spin" : ""}`}
          />
          Recarregar
        </button>
      </div>

      {/* Mensagens de erro/sucesso */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <CheckCircle2 className="w-4 h-4 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Card principal */}
      <div className="rounded-2xl bg-white/90 border border-slate-200 shadow-sm p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Carregando configurações...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Linha: título + tag mais vendido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Título da configuração
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChangeField("title", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Serviços adicionais Max Fibra"
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <label className="text-xs font-medium text-slate-600">
                  Tag &quot;Mais vendido&quot;
                </label>
                <select
                  value={form.tagMaisVendido}
                  onChange={(e) =>
                    handleChangeField("tagMaisVendido", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Nenhum</option>
                  <option value="Turbo">Turbo</option>
                  <option value="Gold">Gold</option>
                  <option value="Infinity">Infinity</option>
                </select>
              </div>

              {form.id && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    ID do registro 
                  </label>
                  <input
                    value={form.id}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"
                  />
                </div>
              )}
            </div>

            {/* Trinca de planos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PlanoCard
                planoKey="turboServices"
                title="Plano Turbo"
                colorClass="text-blue-700"
                campoLabel='Campo: "Plano - Turbo - Serviço Adicional"'
              />
              <PlanoCard
                planoKey="goldServices"
                title="Plano Gold"
                colorClass="text-amber-700"
                campoLabel='Campo: "Plano - Gold - Serviço Adicional"'
              />
              <PlanoCard
                planoKey="infinityServices"
                title="Plano Infinity"
                colorClass="text-sky-700"
                campoLabel='Campo: "Plano - Infinity - Serviço Adicional"'
              />
            </div>

            {/* Botão salvar */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-600 transition disabled:opacity-60"
              >
                <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                {saving ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
