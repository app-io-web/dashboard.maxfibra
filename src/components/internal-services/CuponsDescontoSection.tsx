import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import {
  Tag,
  Percent,
  CalendarDays,
  RefreshCcw,
  Save,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { CupomDescontoSimulator } from "./CupomDescontoSimulator";

type NocoCupomRecord = {
  id: string | number;
  fields: {
    CreatedAt?: string;
    UpdatedAt?: string;
    CUPPOM?: string;
    DESCONTO?: string;
    VALIDADE?: string;
  };
};

type CupomFormState = {
  id: string | null;
  cuppom: string;
  desconto: string; // ex: "10" (10%) ou "15.5"
  validade: string; // pode ser uma data tipo "2025-12-31" ou texto
};

export function CuponsDescontoSection() {
  const [cupons, setCupons] = useState<NocoCupomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // estado para modal de confirmação
 const [deleteTarget, setDeleteTarget] = useState<string | null>(null);


  const [form, setForm] = useState<CupomFormState>({
    id: null,
    cuppom: "",
    desconto: "",
    validade: "",
  });

  // ===== Helpers de UI =====
  function resetForm() {
    setForm({
      id: null,
      cuppom: "",
      desconto: "",
      validade: "",
    });
  }

  function showError(msg: string) {
    console.error("[CUPONS][ERROR]", msg);
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  function handleImportConfig(config: { descontoPercentual: string }) {
  setForm((prev) => ({
    ...prev,
    desconto: config.descontoPercentual,
  }));
  showSuccess("Configuração de desconto importada para o formulário.");
}

  // ===== Carregar lista =====
  async function loadCupons() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/site/cupons-desconto");
      // data = { records, next, prev, ... }
      setCupons(data.records || []);
    } catch (err: any) {
      showError("Erro ao carregar cupons de desconto.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCupons();
  }, []);

  // ===== Submit (create / update) =====
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!form.cuppom || !form.desconto || !form.validade) {
        showError("Preencha CUPPOM, DESCONTO e VALIDADE.");
        setSaving(false);
        return;
      }

      const payload = {
        CUPPOM: form.cuppom,
        DESCONTO: form.desconto,
        VALIDADE: form.validade,
      };

      if (form.id) {
        // update
        await api.patch(`/site/cupons-desconto/${form.id}`, payload);
        showSuccess("Cupom atualizado com sucesso!");
      } else {
        // create
        await api.post("/site/cupons-desconto", payload);
        showSuccess("Cupom criado com sucesso!");
      }

      await loadCupons();
      resetForm();
    } catch (err: any) {
      showError("Erro ao salvar cupom de desconto.");
    } finally {
      setSaving(false);
    }
  }

  // ===== Editar =====
  function handleEdit(record: NocoCupomRecord) {
    setForm({
      id: String(record.id),
      cuppom: record.fields.CUPPOM || "",
      desconto: record.fields.DESCONTO || "",
      validade: record.fields.VALIDADE || "",
    });
  }

    function openDeleteModal(id: string | number) {
    setDeleteTarget(String(id));
    }

    async function confirmDelete() {
    if (!deleteTarget) return;

    try {
        await api.delete(`/site/cupons-desconto/${deleteTarget}`);
        showSuccess("Cupom removido com sucesso!");
        await loadCupons();
    } catch (err) {
        showError("Erro ao remover cupom.");
    } finally {
        setDeleteTarget(null);
    }
    }


  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Cupons de Desconto
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie cupons, percentuais de desconto e validade para os planos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadCupons}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw className="w-4 h-4" />
          Recarregar
        </button>
      </header>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <XCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Formulário */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-slate-800">
            {form.id ? "Editar cupom" : "Cadastrar novo cupom"}
            </h3>
            <span className="text-[11px] text-slate-400">
            Use o simulador para calcular o desconto com base nos planos.
            </span>
        </div>

        <div className="flex items-center gap-2">
            <CupomDescontoSimulator onImport={handleImportConfig} />

            {form.id && (
            <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-700"
            >
                Cancelar edição
            </button>
            )}
        </div>
        </div>


        <form
          onSubmit={handleSubmit}
          className="grid gap-3 md:grid-cols-3 md:items-end"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">
              Código do cupom
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2">
              <Tag className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                className="w-full bg-transparent py-1.5 text-sm outline-none"
                placeholder="EX: BEMVINDO10"
                value={form.cuppom}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cuppom: e.target.value.toUpperCase() }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">
              Desconto (%)
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2">
              <Percent className="w-4 h-4 text-slate-500" />
              <input
                type="number"
                min={0}
                step={0.1}
                className="w-full bg-transparent py-1.5 text-sm outline-none"
                placeholder="Ex: 10 = 10%"
                value={form.desconto}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, desconto: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">
              Validade
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                className="w-full bg-transparent py-1.5 text-sm outline-none"
                value={form.validade}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, validade: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving
                ? form.id
                  ? "Salvando alterações..."
                  : "Criando cupom..."
                : form.id
                ? "Salvar alterações"
                : "Cadastrar cupom"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de cupons */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Cupons cadastrados
          </span>
          {loading && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <RefreshCcw className="w-3 h-3 animate-spin" />
              Carregando...
            </span>
          )}
        </div>

        {cupons.length === 0 && !loading ? (
          <div className="px-4 py-6 text-center text-xs text-slate-500">
            Nenhum cupom cadastrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Cupom</th>
                  <th className="px-3 py-2 text-left font-medium">Desconto</th>
                  <th className="px-3 py-2 text-left font-medium">Validade</th>
                  <th className="px-3 py-2 text-left font-medium">Criado em</th>
                  <th className="px-3 py-2 text-left font-medium">Atualizado em</th>
                  <th className="px-3 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cupons.map((record) => {
                  const f = record.fields;
                  const descontoLabel = f.DESCONTO ? `${f.DESCONTO}%` : "-";

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-semibold text-slate-800">
                        {f.CUPPOM || "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{descontoLabel}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {f.VALIDADE || "-"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500">
                        {f.CreatedAt
                          ? new Date(f.CreatedAt).toLocaleString("pt-BR")
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500">
                        {f.UpdatedAt
                          ? new Date(f.UpdatedAt).toLocaleString("pt-BR")
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(record)}
                            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(record.id)}
                            className="inline-flex items-center rounded-md border border-red-100 bg-red-50 px-2 py-1 text-[11px] text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* MODAL DE CONFIRMAÇÃO */}
        {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-[350px]">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="text-red-600">⚠</span> Confirmar exclusão
            </h3>

            <p className="text-sm text-slate-600 mt-2">
                Tem certeza que deseja apagar este cupom? Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end gap-2 mt-6">
                <button
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm hover:bg-slate-300"
                onClick={() => setDeleteTarget(null)}
                >
                Cancelar
                </button>

                <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                onClick={confirmDelete}
                >
                Apagar
                </button>
            </div>
            </div>
        </div>
        )}

      </div>
    </section>
  );
}
