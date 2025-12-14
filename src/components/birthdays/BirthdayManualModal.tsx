import { useState } from "react";
import { api } from "../../lib/api";
import { X, Cake } from "lucide-react";

type BirthdayItem = {
  id: string;
  name: string;
  role: string;
  date: string; // ISO
  sector?: string;
  avatarUrl?: string | null;
};

type ApiAniversariante = {
  auth_user_id: string;
  auth_empresa_id: string | null;
  nome: string;
  profession: string | null;
  data_nascimento: string;
  empresa_role: string | null;
  avatar_url: string | null;
};

type BirthdayManualModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (item: BirthdayItem) => void;
};

export function BirthdayManualModal({
  open,
  onClose,
  onCreated,
}: BirthdayManualModalProps) {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [profession, setProfession] = useState("");
  const [empresaRole, setEmpresaRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setNome("");
    setDataNascimento("");
    setProfession("");
    setEmpresaRole("");
    setAvatarUrl("");
    setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || !dataNascimento) {
      setError("Nome e data de nascimento são obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/aniversariantes/manual", {
        nome: nome.trim(),
        data_nascimento: dataNascimento, // yyyy-mm-dd (input date já manda assim)
        profession: profession.trim() || null,
        empresa_role: empresaRole.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });

      const data: ApiAniversariante = response.data.aniversariante;

      const mapped: BirthdayItem = {
        id: data.auth_user_id,
        name: data.nome,
        role: data.profession || data.empresa_role || "Colaborador",
        date: data.data_nascimento,
        sector: undefined,
        avatarUrl: data.avatar_url,
      };

      onCreated(mapped);
      reset();
      onClose();
    } catch (err) {
      console.error("Erro ao criar aniversariante manual:", err);
      setError("Não foi possível salvar o aniversariante. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <Cake size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Novo aniversariante
              </h3>
              <p className="text-[11px] text-slate-500">
                Cadastro rápido, sem criar usuário de acesso ao sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Nome completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Ex: Maria do Aniversário"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Data de nascimento <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Função / área
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ex: Visitante, Fornecedor..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Papel / rótulo
              </label>
              <input
                type="text"
                value={empresaRole}
                onChange={(e) => setEmpresaRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ex: CONVIDADO, ESTAGIÁRIO..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              URL do avatar (opcional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500 bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Cake size={14} />
                  <span>Salvar aniversariante</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
