// src/components/shortcuts/ShortcutFormModal.tsx
import { FormEvent, useEffect, useState } from "react";
import type { ShortcutScope, ApiShortcut } from "../../types/shortcut";

type FormValues = {
  titulo: string;
  url: string;
  img_url: string;
  anotacoes: string;
  scope: ShortcutScope;
  email: string;
  passwordPlain: string;
  show_on_dashboard: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  empresaId: string | null;
  onCreated?: (shortcut: ApiShortcut) => void;
  onUpdated?: (shortcut: ApiShortcut) => void;
  shortcutToEdit?: ApiShortcut | null;
};

function getScopeFromShortcut(shortcut: ApiShortcut): ShortcutScope {
  if (shortcut.is_global) return "global";
  if (shortcut.is_private) return "usuario";
  return "empresa";
}

export function ShortcutFormModal({
  open,
  onClose,
  empresaId,
  onCreated,
  onUpdated,
  shortcutToEdit,
}: Props) {
  const [values, setValues] = useState<FormValues>({
    titulo: "",
    url: "",
    img_url: "",
    anotacoes: "",
    scope: "empresa",
    email: "",
    passwordPlain: "",
    show_on_dashboard: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const isEditing = !!shortcutToEdit;

  useEffect(() => {
    if (shortcutToEdit && open) {
      // tenta pegar a senha vinda do backend
      const shortcutAny = shortcutToEdit as any;

      const passwordFromApi: string =
        shortcutAny.passwordPlain || shortcutAny.password_plain || "";

      setValues({
        titulo: shortcutToEdit.titulo || "",
        url: shortcutToEdit.url || "",
        img_url: shortcutToEdit.img_url || "",
        anotacoes: shortcutToEdit.anotacoes || "",
        scope: getScopeFromShortcut(shortcutToEdit),
        email: shortcutToEdit.email || "",
        // AGORA: se o backend mandar a senha, ela cai aqui
        passwordPlain: passwordFromApi,
        show_on_dashboard: !!shortcutToEdit.show_on_dashboard,
      });

      setShowPassword(false);
    } else if (open && !shortcutToEdit) {
      setValues({
        titulo: "",
        url: "",
        img_url: "",
        anotacoes: "",
        scope: "empresa",
        email: "",
        passwordPlain: "",
        show_on_dashboard: false,
      });
      setShowPassword(false);
    }
  }, [shortcutToEdit, open]);

  if (!open) return null;

  const isPrivateUser = values.scope === "usuario";

  function handleChange<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!empresaId) {
      setError("Selecione uma empresa antes de salvar o atalho.");
      return;
    }

    if (!values.titulo.trim() || !values.url.trim()) {
      setError("Nome do atalho e URL são obrigatórios.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const { api } = await import("../../lib/api");

      const payload: any = {
        empresaId,
        titulo: values.titulo.trim(),
        url: values.url.trim(),
        img_url: values.img_url.trim() || null,
        anotacoes: values.anotacoes.trim() || null,
        scope: values.scope,
        email:
          isPrivateUser && values.email.trim()
            ? values.email.trim()
            : isEditing
            ? values.email.trim() || null
            : null,
        show_on_dashboard: values.show_on_dashboard,
      };

      // só manda a senha se tiver algo preenchido
      if (values.passwordPlain.trim()) {
        payload.passwordPlain = values.passwordPlain.trim();
      }

      let res;
      if (isEditing && shortcutToEdit) {
        res = await api.put(`/shortcuts/${shortcutToEdit.id}`, payload);
        onUpdated?.(res.data.shortcut);
      } else {
        res = await api.post("/shortcuts", payload);
        onCreated?.(res.data.shortcut);
      }

      setValues({
        titulo: "",
        url: "",
        img_url: "",
        anotacoes: "",
        scope: "empresa",
        email: "",
        passwordPlain: "",
        show_on_dashboard: false,
      });
      setShowPassword(false);

      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar atalho:", err);
      const msg =
        err?.response?.data?.error ||
        "Erro inesperado ao salvar o atalho. Tenta de novo.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {isEditing ? "Editar atalho" : "Novo atalho"}
            </h3>
            <p className="text-xs text-slate-500">
              Configure o link, imagem, visibilidade e dashboard do atalho.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          {error && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Nome do atalho
            </label>
            <input
              type="text"
              value={values.titulo}
              onChange={(e) => handleChange("titulo", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
              placeholder="Ex: Portal de Chamados"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              URL do atalho
            </label>
            <input
              type="url"
              value={values.url}
              onChange={(e) => handleChange("url", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              URL da imagem (opcional)
            </label>
            <input
              type="url"
              value={values.img_url}
              onChange={(e) => handleChange("img_url", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
              placeholder="https://cdn.seusite.com/icon.png"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Anotações (descrição rápida)
            </label>
            <textarea
              value={values.anotacoes}
              onChange={(e) => handleChange("anotacoes", e.target.value)}
              rows={2}
              className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
              placeholder="Contexto, instruções, etc."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Tipo de visibilidade
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange("scope", "global")}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${
                  values.scope === "global"
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                Global (empresa)
              </button>
              <button
                type="button"
                onClick={() => handleChange("scope", "empresa")}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${
                  values.scope === "empresa"
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                Por empresa
              </button>
              <button
                type="button"
                onClick={() => handleChange("scope", "usuario")}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${
                  values.scope === "usuario"
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                Privado / pessoal
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
            <input
              id="show_on_dashboard"
              type="checkbox"
              checked={values.show_on_dashboard}
              onChange={(e) =>
                handleChange("show_on_dashboard", e.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label
              htmlFor="show_on_dashboard"
              className="text-xs text-slate-700"
            >
              Mostrar este atalho no dashboard principal
            </label>
          </div>

          {isPrivateUser && (
            <div className="space-y-3 rounded-md bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-700">
                Credenciais do atalho (visíveis só pra você)
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Email de acesso (opcional)
                </label>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
                  placeholder="email@dominio.com"
                />
              </div>

                <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                    Senha (opcional)
                </label>

                <div className="relative">
                    <input
                    type={showPassword ? "text" : "password"}
                    value={values.passwordPlain}
                    onChange={(e) => handleChange("passwordPlain", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 pr-9 text-xs text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
                    placeholder="••••••••"
                    />

                    <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                    >
                    {showPassword ? (
                        // ÍCONE: olho fechado (Heroicons Outline)
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                        >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.91 7.244 19 12 19c.964 0 1.9-.128 2.79-.368M6.228 6.228A10.45 10.45 0 0112 5c4.756 0 8.774 3.09 10.066 7-.407 1.26-1.06 2.41-1.91 3.387M6.228 6.228L3 3m3.228 3.228L21 21m-8.21-8.21a3 3 0 00-4.243-4.243"
                        />
                        </svg>
                    ) : (
                        // ÍCONE: olho aberto (Heroicons Outline)
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                        >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a11.97 11.97 0 0119.928 0M4.058 15.5a8.966 8.966 0 0115.884 0M7.08 18.678a5.98 5.98 0 0110.84 0M12 12.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        />
                        </svg>
                    )}
                    </button>
                </div>

                {isEditing && (
                    <p className="text-[10px] text-slate-500">
                    Se deixar em branco, mantém a senha atual.
                    </p>
                )}
                </div>

            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
            >
              {saving && (
                <span className="h-3 w-3 animate-spin rounded-full border border-white/60 border-t-transparent" />
              )}
              {isEditing ? "Salvar alterações" : "Salvar atalho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
