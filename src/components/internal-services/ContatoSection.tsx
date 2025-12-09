import { useEffect, useState, FormEvent } from "react";
import { api } from "../../lib/api";
import {
  Smartphone,
  Phone,
  Share2,
  Save,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type LinksDownloadState = {
  id: string | null;
  android: string;
  ios: string;
};

type TelefoneState = {
  id: string | null;
  numero: string;
};

type RedesSociaisState = {
  id: string | null;
  instagram: string;
  facebook: string;
  youtube: string;
};

type ContatoResponse = {
  linksDownload: LinksDownloadState;
  telefone: TelefoneState;
  redesSociais: RedesSociaisState;
};

export function ContatoSection() {
  const [linksDownload, setLinksDownload] = useState<LinksDownloadState>({
    id: null,
    android: "",
    ios: "",
  });

  const [telefone, setTelefone] = useState<TelefoneState>({
    id: null,
    numero: "",
  });

  const [redesSociais, setRedesSociais] = useState<RedesSociaisState>({
    id: null,
    instagram: "",
    facebook: "",
    youtube: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fetchContato(showReloadToast = false) {
    try {
      setLoading(true);
      setError(null);

      const { data } = await api.get<ContatoResponse>("/site/contato");

      setLinksDownload(data.linksDownload);
      setTelefone(data.telefone);
      setRedesSociais(data.redesSociais);

      if (showReloadToast) {
        setSuccess("Informações recarregadas com sucesso.");
      }
    } catch (err: any) {
      console.error("[ContatoSection][GET] Erro:", err);
      setError(
        err.response?.data?.error ||
          "Erro ao carregar informações de contato."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContato();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: ContatoResponse = {
        linksDownload,
        telefone,
        redesSociais,
      };

      const { data } = await api.patch("/site/contato", payload);

      // Atualiza state com o retorno (garante IDs criados)
      if (data.linksDownload) setLinksDownload(data.linksDownload);
      if (data.telefone) setTelefone(data.telefone);
      if (data.redesSociais) setRedesSociais(data.redesSociais);

      setSuccess("Informações de contato salvas com sucesso.");
    } catch (err: any) {
      console.error("[ContatoSection][PATCH] Erro:", err);
      setError(
        err.response?.data?.error ||
          "Erro ao salvar informações de contato."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6 text-emerald-500" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Contato do Site
            </h1>
            <p className="text-sm text-slate-500">
              Configure os links de download do app, telefone e redes sociais
              exibidos no site.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchContato(true)}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw className="w-4 h-4" />
            Recarregar
          </button>

          <button
            type="submit"
            form="contato-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      <form
        id="contato-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Links de Download */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Links de Download
              </h2>
              <p className="text-xs text-slate-500">
                URLs das lojas para baixar o aplicativo.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              Link Android (Google Play)
            </label>
            <input
              type="url"
              placeholder="https://play.google.com/..."
              value={linksDownload.android}
              onChange={(e) =>
                setLinksDownload((prev) => ({
                  ...prev,
                  android: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              Link iOS (App Store)
            </label>
            <input
              type="url"
              placeholder="https://apps.apple.com/..."
              value={linksDownload.ios}
              onChange={(e) =>
                setLinksDownload((prev) => ({
                  ...prev,
                  ios: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Campo oculto com ID */}
          {linksDownload.id && (
            <input type="hidden" value={linksDownload.id} readOnly />
          )}
        </div>

        {/* Telefone */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Telefone
              </h2>
              <p className="text-xs text-slate-500">
                Número principal de contato exibido no site.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              Número de telefone
            </label>
            <input
              type="text"
              placeholder="(00) 00000-0000"
              value={telefone.numero}
              onChange={(e) =>
                setTelefone((prev) => ({
                  ...prev,
                  numero: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {telefone.id && (
            <input type="hidden" value={telefone.id} readOnly />
          )}
        </div>

        {/* Redes Sociais */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Redes Sociais
              </h2>
              <p className="text-xs text-slate-500">
                Links oficiais da empresa nas redes sociais.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              Instagram
            </label>
            <input
              type="url"
              placeholder="https://instagram.com/..."
              value={redesSociais.instagram}
              onChange={(e) =>
                setRedesSociais((prev) => ({
                  ...prev,
                  instagram: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              Facebook
            </label>
            <input
              type="url"
              placeholder="https://facebook.com/..."
              value={redesSociais.facebook}
              onChange={(e) =>
                setRedesSociais((prev) => ({
                  ...prev,
                  facebook: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              YouTube
            </label>
            <input
              type="url"
              placeholder="https://youtube.com/..."
              value={redesSociais.youtube}
              onChange={(e) =>
                setRedesSociais((prev) => ({
                  ...prev,
                  youtube: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {redesSociais.id && (
            <input type="hidden" value={redesSociais.id} readOnly />
          )}
        </div>
      </form>
    </div>
  );
}
