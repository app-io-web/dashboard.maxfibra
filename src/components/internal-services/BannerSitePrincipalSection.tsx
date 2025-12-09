import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import {
  ImageIcon,
  RefreshCcw,
  Plus,
  Save,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Download, // 👈 novo ícone
} from "lucide-react";

type NocoBannerRecord = {
  id: string | number;
  fields: {
    titulo?: string;
    ativo?: boolean;
    "Banners-2K"?: string;
    "Banners-4K"?: string;
    "Banners-1080P"?: string;
    "Banners-Mobile"?: string;
    CreatedAt?: string;
    UpdatedAt?: string;
  };
};

type BannerFormState = {
  id: string | null;
  titulo: string;
  ativo: boolean;
  banners1080p: string;
  banners2k: string;
  banners4k: string;
  bannersMobile: string;
};

const EMPTY_FORM: BannerFormState = {
  id: null,
  titulo: "",
  ativo: true,
  banners1080p: "",
  banners2k: "",
  banners4k: "",
  bannersMobile: "",
};

const MODEL_IMAGE_PATH = "/imagens/models/Modelo_imagens_section.png"; // 👈 caminho público do modelo

type PreviewProps = {
  label: string;
  url?: string;
};

function MiniPreview({ label, url }: PreviewProps) {
  if (!url) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-slate-500">{label}</span>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <img
          src={url}
          alt={label}
          className="w-full max-w-[260px] h-20 object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
}

export function BannerSitePrincipalSection() {
  const [banners, setBanners] = useState<NocoBannerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BannerFormState>(EMPTY_FORM);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreviews, setShowPreviews] = useState(false); // <- toggle

  async function fetchBanners(showReloadSpinner = false) {
    try {
      if (!showReloadSpinner) setLoading(true);
      else setReloading(true);
      setError(null);

      const res = await api.get("/site/banners");
      const raw = res.data?.records ?? res.data ?? [];

      const data: NocoBannerRecord[] = raw.map((rec: any) => ({
        ...rec,
        id: rec.id,
      }));

      setBanners(data);
    } catch (err: any) {
      console.error("[BANNERS][LIST] Erro:", err);
      setError("Erro ao carregar os banners do site.");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }

  useEffect(() => {
    fetchBanners(false);
  }, []);

  function handleChange(field: keyof BannerFormState, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleEdit(record: NocoBannerRecord) {
    const f = record.fields;
    setForm({
      id: String(record.id),
      titulo: f.titulo || "",
      ativo: f.ativo ?? false,
      banners1080p: f["Banners-1080P"] || "",
      banners2k: f["Banners-2K"] || "",
      banners4k: f["Banners-4K"] || "",
      bannersMobile: f["Banners-Mobile"] || "",
    });
    setSuccessMessage(null);
    setError(null);
  }

  function handleCreateNew() {
    setForm(EMPTY_FORM);
    setSuccessMessage(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const fields: NocoBannerRecord["fields"] = {
        titulo: form.titulo || undefined,
        ativo: form.ativo,
        "Banners-1080P": form.banners1080p || undefined,
        "Banners-2K": form.banners2k || undefined,
        "Banners-4K": form.banners4k || undefined,
        "Banners-Mobile": form.bannersMobile || undefined,
      };

      if (form.id) {
        await api.patch("/site/banners", {
          id: form.id,
          fields,
        });
        setSuccessMessage("Banner atualizado com sucesso.");
      } else {
        await api.post("/site/banners", {
          fields,
        });
        setSuccessMessage("Banner criado com sucesso.");
      }

      await fetchBanners(true);

      if (!form.id) {
        setForm(EMPTY_FORM);
      }
    } catch (err: any) {
      console.error("[BANNERS][SAVE] Erro:", err?.response || err);
      setError("Erro ao salvar o banner.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string | number) {
    const idStr = String(id);

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este banner?"
    );
    if (!confirmed) return;

    setDeletingId(idStr);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.delete("/site/banners", {
        data: { id: idStr },
      });
      setSuccessMessage("Banner deletado com sucesso.");
      await fetchBanners(true);

      if (form.id === idStr) {
        setForm(EMPTY_FORM);
      }
    } catch (err: any) {
      console.error("[BANNERS][DELETE] Erro:", err?.response || err);
      setError("Erro ao deletar o banner.");
    } finally {
      setDeletingId(null);
    }
  }

  const isEditing = useMemo(() => !!form.id, [form.id]);
  const hasFormPreview =
    showPreviews && (!!form.banners1080p || !!form.bannersMobile);

  return (
    <section className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              Banners - Site Principal
            </h1>
            <p className="text-xs text-slate-500">
              Gerencie os banners principais (desktop, 2K, 4K e mobile) do site.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">

  <a
    href={MODEL_IMAGE_PATH}
    download
    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
               border border-slate-200 bg-white hover:bg-slate-50 text-slate-700
               sm:w-auto w-full min-w-max"
  >
    <Download className="w-4 h-4" />
    Baixar modelos de imagem
  </a>

  <button
    type="button"
    onClick={() => setShowPreviews((prev) => !prev)}
    className={[
      "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border shadow-sm",
      "sm:w-auto w-full min-w-max",
      showPreviews
        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
    ].join(" ")}
  >
    <Eye className="w-4 h-4" />
    Exibir pré-visualizações de imagem
  </button>

  <button
    type="button"
    onClick={() => fetchBanners(true)}
    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
               border border-slate-200 bg-white hover:bg-slate-50 text-slate-700
               sm:w-auto w-full min-w-max"
  >
    <RefreshCcw className={`w-4 h-4 ${reloading ? "animate-spin" : ""}`} />
    Recarregar
  </button>

  <button
    type="button"
    onClick={handleCreateNew}
    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
               bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm
               sm:w-auto w-full min-w-max"
  >
    <Plus className="w-4 h-4" />
    Novo banner
  </button>

</div>

      </div>

      {/* Mensagens */}
      {(error || successMessage) && (
        <div className="space-y-2">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-red-50 border border-red-200 text-red-700">
              <XCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Formulário + Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-1 space-y-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {isEditing ? "Editar banner" : "Novo banner"}
            </h2>
            {isEditing && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ID: {form.id != null ? String(form.id).slice(0, 6) : "-"}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Título
              </label>
              <input
                type="text"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={form.titulo}
                onChange={(e) => handleChange("titulo", e.target.value)}
                placeholder="Ex: Promoção Fibra 1Gbps"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="ativo"
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => handleChange("ativo", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="ativo"
                className="text-xs font-medium text-slate-700"
              >
                Banner ativo no site
              </label>
            </div>

            <hr className="border-slate-200" />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Banner 1080p (Desktop)
              </label>
              <input
                type="text"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={form.banners1080p}
                onChange={(e) => handleChange("banners1080p", e.target.value)}
                placeholder="URL da imagem 1920x1080"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Banner 2K
              </label>
              <input
                type="text"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={form.banners2k}
                onChange={(e) => handleChange("banners2k", e.target.value)}
                placeholder="URL da imagem 2K"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Banner 4K
              </label>
              <input
                type="text"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={form.banners4k}
                onChange={(e) => handleChange("banners4k", e.target.value)}
                placeholder="URL da imagem 4K"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Banner Mobile
              </label>
              <input
                type="text"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={form.bannersMobile}
                onChange={(e) => handleChange("bannersMobile", e.target.value)}
                placeholder="URL da imagem mobile"
              />
            </div>
          </div>

          {/* Preview do formulário (controlado pelo toggle) */}
          {hasFormPreview && (
            <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium text-slate-600">
                Pré-visualização rápida
              </p>
              <div className="flex flex-col gap-3">
                <MiniPreview
                  label="Desktop 1080p"
                  url={form.banners1080p || undefined}
                />
                <MiniPreview
                  label="Mobile"
                  url={form.bannersMobile || undefined}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              disabled={saving}
            >
              Limpar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60 shadow-sm"
            >
              <Save className={`w-4 h-4 ${saving ? "animate-pulse" : ""}`} />
              {isEditing ? "Salvar alterações" : "Criar banner"}
            </button>
          </div>
        </form>

        {/* Lista de banners */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Banners cadastrados
            </h2>
            <span className="text-[10px] text-slate-500">
              Total: {banners.length}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="px-4 py-6 text-xs text-slate-500">
                Carregando banners...
              </div>
            ) : banners.length === 0 ? (
              <div className="px-4 py-6 text-xs text-slate-500">
                Nenhum banner cadastrado ainda.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Título
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      1080p / Mobile
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Criado / Atualizado
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((banner) => {
                    const f = banner.fields;
                    const ativo = f.ativo ?? false;
                    const createdAt = f.CreatedAt
                      ? new Date(f.CreatedAt).toLocaleString()
                      : "-";
                    const updatedAt = f.UpdatedAt
                      ? new Date(f.UpdatedAt).toLocaleString()
                      : "-";
                    const idLabel = String(banner.id ?? "").slice(0, 8);

                    const hasThumbDesktop =
                      ativo &&
                      !!f["Banners-1080P"] &&
                      f["Banners-1080P"] !== "-";
                    const hasThumbMobile =
                      ativo &&
                      !!f["Banners-Mobile"] &&
                      f["Banners-Mobile"] !== "-";

                    return (
                      <tr
                        key={String(banner.id)}
                        className="border-t border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 align-top text-slate-800">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold">
                              {f.titulo || "(sem título)"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ID: {idLabel || "-"}...
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2 align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              ativo
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ativo ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>

                        <td className="px-3 py-2 align-top text-slate-700">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="truncate max-w-[260px]">
                                <span className="text-[10px] text-slate-400 mr-1">
                                  1080p:
                                </span>
                                {f["Banners-1080P"] || "-"}
                              </span>
                              <span className="truncate max-w-[260px]">
                                <span className="text-[10px] text-slate-400 mr-1">
                                  Mobile:
                                </span>
                                {f["Banners-Mobile"] || "-"}
                              </span>
                            </div>

                            {showPreviews &&
                              ativo &&
                              (hasThumbDesktop || hasThumbMobile) && (
                                <div className="flex flex-wrap gap-3 pt-1">
                                  {hasThumbDesktop && (
                                    <MiniPreview
                                      label="1080p (ativo)"
                                      url={f["Banners-1080P"]}
                                    />
                                  )}
                                  {hasThumbMobile && (
                                    <MiniPreview
                                      label="Mobile (ativo)"
                                      url={f["Banners-Mobile"]}
                                    />
                                  )}
                                </div>
                              )}
                          </div>
                        </td>

                        <td className="px-3 py-2 align-top text-[10px] text-slate-500">
                          <div className="flex flex-col gap-0.5">
                            <span>Criado: {createdAt}</span>
                            <span>Atualizado: {updatedAt}</span>
                          </div>
                        </td>

                        <td className="px-3 py-2 align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(banner)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(banner.id)}
                              disabled={deletingId === String(banner.id)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
