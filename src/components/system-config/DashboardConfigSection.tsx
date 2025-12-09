// src/components/system-config/DashboardConfigSection.tsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { SystemSetting } from "../../types/systemSettings";
import { LayoutDashboard, SlidersHorizontal } from "lucide-react";

type BoolSetting = SystemSetting<boolean>;

function prettifyKey(key: string, category?: string): string {
  // tira prefixo da categoria se existir
  let k = key;
  if (category && k.startsWith(category + "_")) {
    k = k.slice(category.length + 1);
  }

  // troca _ por espaço e capitaliza
  return k
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardConfigSection() {
  const [settings, setSettings] = useState<BoolSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<BoolSetting[]>("/system-settings", {
        params: { category: "dashboard" },
      });

      const boolSettings = res.data.filter(
        (s) => typeof s.value === "boolean"
      );

      setSettings(boolSettings);
    } catch (err) {
      console.error("Erro ao carregar system-settings (dashboard):", err);
      setError("Não foi possível carregar as configurações do dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleToggle(setting: BoolSetting) {
    const newValue = !setting.value;

    setSavingKey(setting.key);
    setError(null);

    try {
      const res = await api.put<BoolSetting>(`/system-settings/${setting.key}`, {
        value: newValue,
        description: setting.description ?? "",
        is_sensitive: setting.is_sensitive ?? false,
        category: setting.category ?? "dashboard",
      });

      setSettings((prev) =>
        prev.map((s) => (s.key === setting.key ? res.data : s))
      );
    } catch (err) {
      console.error("Erro ao salvar system-setting:", err);
      setError("Erro ao salvar configuração. Tenta de novo.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <section
      className="
        overflow-hidden rounded-2xl border border-slate-200 
        bg-white shadow-sm
      "
    >
      {/* HEADER DO CARD */}
      <header
        className="
          flex items-center gap-3 
          border-b border-slate-200 
          bg-white px-5 py-4 sm:px-6
        "
      >
        <div
          className="
            flex h-10 w-10 items-center justify-center 
            rounded-xl bg-emerald-500/10 text-emerald-600
          "
        >
          <LayoutDashboard className="h-5 w-5" />
        </div>

        <div className="flex flex-col">
          <h2 className="font-semibold text-slate-800 text-base sm:text-lg">
            Dashboard principal
          </h2>
          <p className="text-xs text-slate-500">
            Controle o que aparece no painel inicial.
          </p>
        </div>
      </header>

      {/* CORPO */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-3">
        {loading && (
          <p className="text-sm text-slate-500">
            Carregando configurações...
          </p>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {!loading && settings.length === 0 && !error && (
          <p className="text-sm text-slate-500">
            Nenhuma configuração de dashboard encontrada.
          </p>
        )}

        {!loading &&
          settings.map((setting) => {
            const enabled = !!setting.value;
            const prettyName = prettifyKey(setting.key, setting.category);

            return (
              <div
                key={setting.id}
                className="
                  flex flex-col gap-4 rounded-xl 
                  bg-white border border-slate-200 
                  px-4 py-3 
                  sm:flex-row sm:items-center sm:justify-between
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      mt-0.5 rounded-lg bg-slate-100 p-1.5 text-emerald-600
                    "
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-800">
                      {prettyName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {setting.description ||
                        "Configuração de dashboard."}
                    </p>
                  </div>
                </div>

                {/* TOGGLE */}
                <button
                  type="button"
                  onClick={() => handleToggle(setting)}
                  disabled={savingKey === setting.key}
                  className={[
                    "relative inline-flex h-6 w-11 items-center rounded-full border transition-all",
                    enabled
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-slate-300 border-slate-300",
                    savingKey === setting.key
                      ? "opacity-60 cursor-wait"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all",
                      enabled ? "translate-x-5" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>
            );
          })}
      </div>
    </section>
  );
}
