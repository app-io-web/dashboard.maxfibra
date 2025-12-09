// src/pages/UserSettingsPage.tsx
import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { getCurrentUser } from "../lib/auth";
import { buildUserSettingsPermissionFlags } from "../config/userSettingsPermissions";

type UserSettings = {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme_preference: "light" | "dark" | "system";
  language: string;
  profession: string | null;
  data_nascimento: string | null;
  is_central_admin: boolean;
  created_at: string;
  updated_at: string;
};

export function UserSettingsPage() {
  const [displayName, setDisplayName] = useState("Usuário Central");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themePreference, setThemePreference] =
    useState<"light" | "dark" | "system">("light");
  const [language, setLanguage] = useState("pt-BR");
  const [profession, setProfession] = useState("");

  const [isCentralAdmin, setIsCentralAdmin] = useState(false);

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataNascimento, setDataNascimento] = useState("");

  // 🔑 PERMISSÕES VINDAS DO LOGIN
  const currentUser = getCurrentUser();
  const permissionKeys = currentUser?.permissions ?? [];
  const {
    canViewDisplayName,
    canEditDisplayName,
    canViewAvatarUrl,
    canEditAvatarUrl,
    canViewProfession,
    canEditProfession,
    canViewBirth,
    canEditBirth,
  } = buildUserSettingsPermissionFlags(permissionKeys);

  const loading = loadingSettings; // só carrega settings agora

  const professionPresets = [
    "Financeiro",
    "Atendente",
    "CEO",
    "Gerente",
    "Atendente de loja",
  ];

  // Carrega /me/settings quando abrir a página
  useEffect(() => {
    let isMounted = true;

    async function fetchUserSettings() {
      setLoadingSettings(true);
      setError(null);

      try {
        const response = await api.get<{ userSettings: UserSettings | null }>(
          "/me/settings"
        );

        const data = response.data.userSettings;

        if (data && isMounted) {
          setDisplayName(data.display_name || "Usuário Central");
          setAvatarUrl(data.avatar_url || "");
          setThemePreference(
            (data.theme_preference as "light" | "dark" | "system") || "light"
          );
          setLanguage(data.language || "pt-BR");
          setProfession(data.profession || "");
          setIsCentralAdmin(!!data.is_central_admin);

          const rawDate = data.data_nascimento;
          let normalizedDate = "";

          if (rawDate) {
            if (typeof rawDate === "string") {
              normalizedDate = rawDate.substring(0, 10);
            } else {
              normalizedDate = new Date(rawDate)
                .toISOString()
                .substring(0, 10);
            }
          }

          setDataNascimento(normalizedDate);
        }
      } catch (err) {
        console.error("Erro ao buscar /me/settings:", err);
        if (isMounted) {
          setError("Não foi possível carregar suas configurações.");
        }
      } finally {
        if (isMounted) {
          setLoadingSettings(false);
        }
      }
    }

    fetchUserSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setSaving(true);
  setError(null);
  setSuccessMessage(null);

  try {
    // manda SEMPRE tudo, independente de permissão
    const payload = {
      display_name: displayName,
      avatar_url: avatarUrl,
      theme_preference: themePreference,
      language,
      profession,
      data_nascimento: dataNascimento,
    };

    await api.put("/me/settings", payload);

    setSuccessMessage("Configurações salvas com sucesso.");
  } catch (err) {
    console.error("Erro ao salvar /me/settings:", err);
    setError("Não foi possível salvar suas configurações.");
  } finally {
    setSaving(false);
  }
}


  const initials =
    displayName && displayName.trim().length > 0
      ? displayName
          .trim()
          .split(" ")
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join("")
      : "UC";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-slate-900">
          Configurações do usuário
        </h2>
        <p className="text-sm text-slate-600">
          Ajuste suas preferências pessoais utilizadas em toda a Central
          Administrativa.
        </p>
      </header>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm max-w-xl">
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse mb-3" />
          <div className="h-3 w-full rounded bg-slate-100 animate-pulse mb-2" />
          <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          {/* Coluna esquerda: card do usuário */}
          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center gap-4 max-lg:order-2">
            <div className="relative flex flex-col items-center pb-4">
              {canViewAvatarUrl && avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-20 w-20 rounded-full object-cover border-2 border-sky-500 shadow-sm"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-sky-800 text-xl font-semibold border border-sky-200">
                  {initials}
                </div>
              )}

              {isCentralAdmin && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-md border border-white">
                    CENTRAL&nbsp;ADMIN
                  </span>
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-slate-900">
                {canViewDisplayName
                  ? displayName || "Usuário Central"
                  : "Usuário Central"}
              </p>

              {canViewProfession && profession && (
                <p className="text-xs text-slate-500">{profession}</p>
              )}

              <p className="text-xs text-slate-500">
                Essas configurações são pessoais e não afetam outros usuários.
              </p>
            </div>

            {/* Data de nascimento */}
            {canViewBirth && (
              <div className="space-y-1.5 w-full">
                <label className="text-xs font-medium text-slate-700">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-[#FEFCFB] px-3 py-2 text-sm outline-none focus:border-[#1282A2] focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  disabled={!canEditBirth}
                />
                <p className="text-xs text-slate-400">
                  Usado para calcular idade e exibir em aniversariantes.
                </p>
              </div>
            )}

            <div className="mt-2 w-full space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Tema atual
              </p>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-xs text-slate-600">
                  {themePreference === "light" && "Claro"}
                  {themePreference === "dark" && "Escuro"}
                  {themePreference === "system" && "Seguir sistema"}
                </span>
                <span className="h-2 w-8 rounded-full bg-gradient-to-r from-[#1282A2] to-[#034078]" />
              </div>
            </div>
          </aside>

          {/* Coluna direita: formulário */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5 max-w-2xl"
          >
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="space-y-1 pb-1 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Perfil e identidade
              </h3>
              <p className="text-xs text-slate-500">
                Nome, avatar e cargo usados nos cabeçalhos, listagens e
                notificações.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {canViewDisplayName && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Nome de exibição
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-[#FEFCFB] px-3 py-2 text-sm outline-none focus:border-[#1282A2] focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Como seu nome será exibido na interface"
                    disabled={!canEditDisplayName}
                  />
                </div>
              )}

              {canViewAvatarUrl && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    URL do avatar
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-lg border border-slate-200 bg-[#FEFCFB] px-3 py-2 text-sm outline-none focus:border-[#1282A2] focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://exemplo.com/minha-foto.png"
                    disabled={!canEditAvatarUrl}
                  />
                  <p className="text-xs text-slate-400">
                    Mais tarde isso pode virar upload direto para o storage.
                  </p>
                </div>
              )}
            </div>

            {canViewProfession && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Cargo / função
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-[#FEFCFB] px-3 py-2 text-sm outline-none focus:border-[#1282A2] focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Ex: Financeiro, Atendente, CEO..."
                  disabled={!canEditProfession}
                />
                <p className="text-xs text-slate-400">
                  Essa informação aparece em alguns lugares da interface.
                </p>
                {canEditProfession && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {professionPresets.map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setProfession(p)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:border-[#1282A2] hover:bg-sky-50 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1 pt-3 border-t border-slate-100 mt-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Preferências de interface
              </h3>
              <p className="text-xs text-slate-500">
                Tema visual e idioma padrão da Central.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Tema */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">
                  Tema da interface
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#FEFCFB] px-3 py-2 text-sm cursor-pointer hover:border-[#1282A2]">
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="light"
                        checked={themePreference === "light"}
                        onChange={() => setThemePreference("light")}
                        className="h-3 w-3"
                      />
                      <span>Claro</span>
                    </span>
                    <span className="h-3 w-10 rounded bg-slate-100 border border-slate-200" />
                  </label>

                  {/* seus outros radios comentados continuam como estavam */}
                </div>
              </div>

              {/* Idioma */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">
                  Idioma
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-[#FEFCFB] px-3 py-2 text-sm outline-none focus:border-[#1282A2] focus:ring-2 focus:ring-sky-100"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option disabled value="en-US">
                    Em Breve....
                  </option>
                </select>
                <p className="text-xs text-slate-400">
                  Afeta textos padrão, mensagens e labels da interface.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-[#1282A2] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#034078] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
