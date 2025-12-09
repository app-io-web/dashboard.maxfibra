// src/components/empresa/EmpresaSettingsEditForm.tsx
import { useState } from "react";
import { api } from "../../lib/api";

export type EmpresaSettings = {
  id: string;
  auth_empresa_id: string;
  display_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  suporte_email: string | null;
  suporte_telefone: string | null;
  site_oficial: string | null;
  is_active: boolean;

  cnpj?: string | null;
  empresa_email?: string | null;
};

type EmpresaForm = {
  display_name: string;
  empresa_email: string;
  suporte_telefone: string;
  cnpj: string;
  site_oficial: string;
  logo_url: string;
};

type Props = {
  empresa: EmpresaSettings;
  onCancel: () => void;
  onSaved: (updated: EmpresaSettings) => void;
};

// helper pra montar URL absoluta usando o baseURL do axios
function buildLogoUrl(raw?: string | null): string {
  if (!raw) return "";

  // se já é http(s), manda bala
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const base = api.defaults.baseURL || "";
  if (!base) return raw; // fallback tosco, mas evita quebrar

  // garante que não duplique / no meio
  return base.replace(/\/$/, "") + (raw.startsWith("/") ? raw : `/${raw}`);
}

export function EmpresaSettingsEditForm({ empresa, onCancel, onSaved }: Props) {
  const [form, setForm] = useState<EmpresaForm>({
    display_name: empresa.display_name || "",
    empresa_email: empresa.empresa_email || empresa.suporte_email || "",
    suporte_telefone: empresa.suporte_telefone || "",
    cnpj: empresa.cnpj || "",
    site_oficial: empresa.site_oficial || "",
    logo_url: buildLogoUrl(empresa.logo_url), // 🔥 normaliza logo vinda do backend
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const previewLogo = form.logo_url || "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCancel() {
    setForm({
      display_name: empresa.display_name || "",
      empresa_email: empresa.empresa_email || empresa.suporte_email || "",
      suporte_telefone: empresa.suporte_telefone || "",
      cnpj: empresa.cnpj || "",
      site_oficial: empresa.site_oficial || "",
      logo_url: buildLogoUrl(empresa.logo_url), // 🔄 volta pro valor normalizado
    });
    setError(null);
    onCancel();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const data = new FormData();
    data.append("logo", file);

    try {
      const res = await api.post("/empresa/settings/logo", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const rawUrl = res.data.logo_url as string; // ex: "/uploads/empresa-logos/..."
      const fullUrl = buildLogoUrl(rawUrl);       // 🔥 vira "http://localhost:3333/uploads/..."

      setForm((prev) => ({ ...prev, logo_url: fullUrl }));
    } catch (err: any) {
      setUploadError(
        err?.response?.data?.error || "Falha ao fazer upload da imagem."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleRemoveLogo() {
    setForm((prev) => ({ ...prev, logo_url: "" }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        display_name: form.display_name || null,
        empresa_email: form.empresa_email || null,
        suporte_telefone: form.suporte_telefone || null,
        cnpj: form.cnpj || null,
        site_oficial: form.site_oficial || null,
        logo_url: form.logo_url || null, // aqui já vai absoluta
      };

      const res = await api.put<{ empresaSettings: EmpresaSettings }>(
        "/empresa/settings",
        payload
      );

      onSaved(res.data.empresaSettings);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        "Erro ao salvar informações da empresa.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <h4 className="text-sm font-semibold text-[#0A1128] mb-3">
        Editar informações da empresa
      </h4>

      {/* BLOCO DA LOGO */}
      <div className="flex items-start gap-4 mb-4">
        <div className="h-16 w-16 rounded-xl border border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center">
          {previewLogo ? (
            <img
              src={previewLogo}
              alt="Logo"
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-[10px] text-slate-400 text-center">
              sem logo
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <div>
            <label className="font-medium text-slate-600">Enviar arquivo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="block mt-1 text-xs"
            />
            {uploading && (
              <p className="text-slate-500 text-xs mt-1">Enviando...</p>
            )}
            {uploadError && (
              <p className="text-rose-600 text-xs mt-1">{uploadError}</p>
            )}
          </div>

          <div>
            <label className="font-medium text-slate-600">URL da logo</label>
            <input
              type="text"
              name="logo_url"
              value={form.logo_url}
              onChange={handleChange}
              placeholder="https://exemplo.com/logo.png"
              className="mt-1 rounded-lg border border-slate-300 px-2 py-1 text-xs w-64"
            />
          </div>

          {form.logo_url && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="text-rose-600 hover:underline text-xs mt-1"
            >
              Remover logo
            </button>
          )}
        </div>
      </div>

      {/* CAMPOS EXISTENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Nome da empresa
          </label>
          <input
            type="text"
            name="display_name"
            value={form.display_name}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Ex: Grupo Max Fibra"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            E-mail da empresa
          </label>
          <input
            type="email"
            name="empresa_email"
            value={form.empresa_email}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="contato@suaempresa.com.br"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Telefone
          </label>
          <input
            type="text"
            name="suporte_telefone"
            value={form.suporte_telefone}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="(27) 99999-0000"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">CNPJ</label>
          <input
            type="text"
            name="cnpj"
            value={form.cnpj}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="00.000.000/0000-00"
          />
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs font-medium text-slate-600">
            Site oficial
          </label>
          <input
            type="url"
            name="site_oficial"
            value={form.site_oficial}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="https://www.suaempresa.com.br"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-[#1282A2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#034078]"
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
