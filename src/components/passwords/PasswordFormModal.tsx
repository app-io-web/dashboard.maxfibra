// src/components/passwords/PasswordFormModal.tsx
import { FormEvent, useEffect, useState } from "react";

export type PasswordFormValues = {
  nome: string;
  email: string;
  url: string;
  senha: string; // em editar pode ser vazio (não troca)
  anotacao: string;
};

type PasswordFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<PasswordFormValues>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: PasswordFormValues) => Promise<void> | void;
};

export function PasswordFormModal({
  open,
  mode,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: PasswordFormModalProps) {
  const [values, setValues] = useState<PasswordFormValues>({
    nome: "",
    email: "",
    url: "",
    senha: "",
    anotacao: "",
  });

  useEffect(() => {
    if (open) {
      setValues({
        nome: initialValues?.nome ?? "",
        email: initialValues?.email ?? "",
        url: initialValues?.url ?? "",
        // em edição, começamos com senha vazia (só troca se preencher)
        senha: "",
        anotacao: initialValues?.anotacao ?? "",
      });
    }
  }, [open, initialValues]);

  if (!open) return null;

  function handleChange(
    field: keyof PasswordFormValues,
    value: string
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  const title =
    mode === "create" ? "Adicionar nova senha" : "Editar senha";

  const primaryLabel =
    mode === "create" ? "Salvar senha" : "Salvar alterações";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome / Serviço
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              value={values.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Ex: VPS Principal, NGINX Proxy Manager..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Usuário / E-mail
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="login@empresa.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              URL (opcional)
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              value={values.url}
              onChange={(e) => handleChange("url", e.target.value)}
              placeholder="https://painel.seu-sistema.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {mode === "create"
                ? "Senha *"
                : "Nova senha (opcional)"}
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              value={values.senha}
              onChange={(e) => handleChange("senha", e.target.value)}
              placeholder={
                mode === "create"
                  ? "Defina a senha"
                  : "Preencha somente se quiser trocar a senha"
              }
              required={mode === "create"}
            />
            {mode === "edit" && (
              <p className="mt-1 text-[11px] text-slate-500">
                Se deixar em branco, a senha atual será mantida.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Anotação (opcional)
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              rows={2}
              value={values.anotacao}
              onChange={(e) => handleChange("anotacao", e.target.value)}
              placeholder="Observações, instruções de acesso, etc."
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500">
              Senha é criptografada no banco com{" "}
              <code className="bg-slate-100 rounded px-1">
                pgp_sym_encrypt
              </code>{" "}
              usando a chave do servidor.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (mode === "create" && !values.senha)}
                className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Salvando..." : primaryLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
