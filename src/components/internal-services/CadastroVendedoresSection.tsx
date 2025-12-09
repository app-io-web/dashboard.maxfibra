// src/components/internal-services/CadastroVendedoresSection.tsx
import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import {
  Users,
  RefreshCcw,
  Save,
  AlertCircle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Edit3,
  X,
} from "lucide-react";

type Vendedor = {
  id: string;
  ID_?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // campos do JSON "Vendedor"
  ["Classificação"]?: string;
  ["ReceberNotificação"]?: string | boolean;
  nome?: string;
  telefone?: string;
  email?: string;
  pix?: string;
  Tipo?: string;
  ["nome-cadastro"]?: string;
  ativo?: boolean;
  tipoVendedor?: string;
  Bloqueado?: boolean;
  cpf?: string;
  codigo?: string;
  metaMensal?: string;
};

type FormState = {
  nome: string;
  telefone: string;
  email: string;
  classificacao: string;
  receberNotificacao: boolean;
  pix: string;
  tipoPix: string;
  nomeCadastro: string;
  cpf: string;
  codigo: string;
  ativo: boolean;
  tipoVendedor: string;
};

const EMPTY_FORM: FormState = {
  nome: "",
  telefone: "",
  email: "",
  classificacao: "Ouro",
  receberNotificacao: true,
  pix: "",
  tipoPix: "CPF",
  nomeCadastro: "",
  cpf: "",
  codigo: "",
  ativo: true,
  tipoVendedor: "interno",
};

export function CadastroVendedoresSection() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchVendedores(showReload = false) {
    try {
      if (showReload) setReloading(true);
      setError(null);
      const res = await api.get("/site/vendedores");
      setVendedores(res.data.records || []);
    } catch (err: any) {
      console.error("[VENDEDORES][LIST] erro", err);
      setError("Erro ao carregar vendedores.");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }

  useEffect(() => {
    fetchVendedores();
  }, []);

  function handleChange(
    field: keyof FormState,
    value: string | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function preencherFormParaEdicao(v: Vendedor) {
    setForm({
      nome: v.nome || "",
      telefone: v.telefone || "",
      email: v.email || "",
      classificacao: (v["Classificação"] as string) || "Ouro",
      receberNotificacao:
        v["ReceberNotificação"] === "True" ||
        v["ReceberNotificação"] === true,
      pix: v.pix || "",
      tipoPix: v.Tipo || "CPF",
      nomeCadastro: (v["nome-cadastro"] as string) || "",
      cpf: v.cpf || "",
      codigo: v.codigo || "",
      ativo: v.ativo ?? true,
      tipoVendedor: v.tipoVendedor || "interno",
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!form.nome.trim()) {
      setError("Nome do vendedor é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        "Classificação": form.classificacao,
        "ReceberNotificação": form.receberNotificacao ? "True" : "False",
        nome: form.nome,
        telefone: form.telefone,
        email: form.email,
        pix: form.pix,
        Tipo: form.tipoPix,
        "nome-cadastro": form.nomeCadastro,
        cpf: form.cpf || undefined,
        codigo: form.codigo || undefined,
        ativo: form.ativo,
        tipoVendedor: form.tipoVendedor,
      };

      if (!editingId) {
        // CREATE
        const res = await api.post("/site/vendedores", payload);
        const created: Vendedor = res.data;

        setVendedores((prev) => [created, ...prev]);
        setForm(EMPTY_FORM);
        setSuccess("Vendedor cadastrado com sucesso!");
      } else {
        // UPDATE
        const res = await api.patch(
          `/site/vendedores/${editingId}`,
          payload
        );
        const updated: Vendedor = res.data;

        setVendedores((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item))
        );
        setSuccess("Vendedor atualizado com sucesso!");
        setForm(EMPTY_FORM);
        setEditingId(null);
      }
    } catch (err: any) {
      console.error(
        editingId
          ? "[VENDEDORES][UPDATE] erro"
          : "[VENDEDORES][CREATE] erro",
        err
      );
      setError(
        editingId
          ? "Erro ao atualizar vendedor."
          : "Erro ao cadastrar vendedor."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(v: Vendedor) {
    resetMessages();
    if (!v.id) return;

    const novoAtivo = !v.ativo;

    try {
      // otimista
      setVendedores((prev) =>
        prev.map((item) =>
          item.id === v.id ? { ...item, ativo: novoAtivo } : item
        )
      );

      await api.patch(`/site/vendedores/${v.id}/ativo`, {
        ativo: novoAtivo,
      });

      setSuccess(
        `Vendedor ${v.nome || v["nome-cadastro"] || ""} ${
          novoAtivo ? "ativado" : "desativado"
        } com sucesso.`
      );
    } catch (err: any) {
      console.error("[VENDEDORES][ATIVO] erro", err);
      setError("Erro ao atualizar status de ativo.");
      // rollback
      setVendedores((prev) =>
        prev.map((item) =>
          item.id === v.id ? { ...item, ativo: v.ativo } : item
        )
      );
    }
  }

  function handleEditarClick(v: Vendedor) {
    resetMessages();
    preencherFormParaEdicao(v);
    setEditingId(v.id);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da section */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500 text-white shadow">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Cadastro de Vendedores
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie cadastro, ativação e informações dos vendedores.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchVendedores(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
        >
          <RefreshCcw
            className={`w-4 h-4 ${reloading ? "animate-spin" : ""}`}
          />
          Recarregar lista
        </button>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 mt-0.5" />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      {/* Formulário de cadastro/edição */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white/90 border border-slate-200 shadow-sm p-4 space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              {editingId ? "Editar vendedor" : "Novo vendedor"}
            </h3>
            {editingId && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                Modo edição
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-3 h-3" />
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <Save className="w-4 h-4" />
              {saving
                ? "Salvando..."
                : editingId
                ? "Salvar alterações"
                : "Salvar vendedor"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="Nome curto para exibição"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nome para cadastro
            </label>
            <input
              type="text"
              value={form.nomeCadastro}
              onChange={(e) =>
                handleChange("nomeCadastro", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Classificação
            </label>
            <select
              value={form.classificacao}
              onChange={(e) =>
                handleChange("classificacao", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            >
              <option value="Ouro">Ouro</option>
              <option value="Prata">Prata</option>
              <option value="Bronze">Bronze</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={form.telefone}
              onChange={(e) =>
                handleChange("telefone", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="+55..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                handleChange("email", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="vendedor@empresa.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tipo de vendedor
            </label>
            <select
              value={form.tipoVendedor}
              onChange={(e) =>
                handleChange("tipoVendedor", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            >
              <option value="interno">Interno</option>
              <option value="Externo">Externo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              PIX
            </label>
            <input
              type="text"
              value={form.pix}
              onChange={(e) => handleChange("pix", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="CPF / telefone / e-mail"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tipo PIX
            </label>
            <select
              value={form.tipoPix}
              onChange={(e) =>
                handleChange("tipoPix", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            >
              <option value="CPF">CPF</option>
              <option value="Telefone">Telefone</option>
              <option value="Email">Email</option>
              <option value="Chave Aleatória">Chave Aleatória</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              CPF
            </label>
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => handleChange("cpf", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Código interno
            </label>
            <input
              type="text"
              value={form.codigo}
              onChange={(e) =>
                handleChange("codigo", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              placeholder="Ex: 126"
            />
          </div>

          <div className="flex flex-col justify-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={form.receberNotificacao}
                onChange={(e) =>
                  handleChange("receberNotificacao", e.target.checked)
                }
              />
              Receber notificação
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) =>
                  handleChange("ativo", e.target.checked)
                }
              />
              Ativo
            </label>
          </div>
        </div>
      </form>

      {/* Lista de vendedores */}
      <div className="rounded-2xl bg-white/90 border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Vendedores cadastrados
          </h3>
          <span className="text-xs text-slate-500">
            Total:{" "}
            <span className="font-semibold">
              {vendedores.length}
            </span>
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500">
            Carregando vendedores...
          </p>
        ) : vendedores.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhum vendedor cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 px-3">Classificação</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Telefone</th>
                  <th className="py-2 px-3">E-mail</th>
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Ativo</th>
                  <th className="py-2 px-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendedores.map((v) => {
                  const ativo = Boolean(v.ativo);
                  const nomeExibicao =
                    v.nome || v["nome-cadastro"] || "-";
                  const emEdicao = editingId === v.id;

                  return (
                    <tr
                      key={v.id}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 ${
                        emEdicao ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <td className="py-2 pr-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-800">
                            {nomeExibicao}
                          </span>
                          {v["nome-cadastro"] &&
                            v["nome-cadastro"] !== nomeExibicao && (
                              <span className="text-[11px] text-slate-400">
                                {v["nome-cadastro"]}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-[11px]">
                          {v["Classificação"] || "-"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[11px] text-slate-600">
                          {v.tipoVendedor || "-"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[11px] text-slate-600">
                          {v.telefone || "-"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[11px] text-slate-600">
                          {v.email || "-"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[11px] text-slate-600">
                          {v.codigo || "-"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() => toggleAtivo(v)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600"
                        >
                          {ativo ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-500" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                              Inativo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() =>
                            emEdicao ? resetForm() : handleEditarClick(v)
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-emerald-600"
                        >
                          <Edit3 className="w-4 h-4" />
                          {emEdicao ? "Cancelando..." : "Editar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
