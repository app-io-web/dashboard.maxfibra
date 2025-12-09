// src/pages/ServicePage.tsx
import { useEffect, useState } from "react";
import { LayoutDashboard, Activity, WifiOff } from "lucide-react";
import { api } from "../lib/api";
import { IxcInternetStatusDashboard } from "../components/ixc/IxcInternetStatusDashboard";
import { IxcInternetBlockedReportPage } from "../components/ixc/IxcInternetBlockedReportPage";
import { useServicePagePermissions } from "../config/useEffects/useServicePagePermissions";

type ServicePageTab = "dashboard_ixc" | "ixc_blocked";

const INTERVAL_OPTIONS = [
  { label: "A cada 30 minutos", value: 30 },
  { label: "A cada 1 hora", value: 60 },
  { label: "A cada 2 horas", value: 120 },
  { label: "A cada 4 horas", value: 240 },
  { label: "A cada 24 horas", value: 1440 },
];

export function ServicePage() {
  const perms = useServicePagePermissions();

  const [activeTab, setActiveTab] = useState<ServicePageTab | null>(null);

  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(true);
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  async function fetchSchedule() {
    try {
      const res = await api.get(
        "/ixc/contracts/internet-blocked-report/schedule"
      );
      setIntervalMinutes(res.data?.intervalMinutes ?? null);
    } catch (err) {
      console.error(
        "Erro ao buscar schedule do relatório IXC Internet Bloqueada:",
        err
      );
    } finally {
      setLoadingSchedule(false);
    }
  }

  async function fetchLastReport() {
    try {
      const res = await api.get(
        "/ixc/contracts/internet-blocked-report/last-metadata"
      );
      const last = res.data?.lastReport;
      setLastGeneratedAt(last?.generatedAt ?? null);
    } catch (err) {
      console.error(
        "Erro ao buscar metadata do último relatório IXC Internet Bloqueada:",
        err
      );
    }
  }

  useEffect(() => {
    // tab inicial baseada nas permissões
    if (perms.canViewDashboardTab) {
      setActiveTab("dashboard_ixc");
    } else if (perms.canViewBlockedTab) {
      setActiveTab("ixc_blocked");
    } else {
      setActiveTab(null);
    }
  }, [perms.canViewDashboardTab, perms.canViewBlockedTab]);

  useEffect(() => {
    // carrega config da automação assim que abrir a Service Page
    fetchSchedule();
    fetchLastReport();
  }, []);

  async function handleChangeInterval(value: number) {
    if (savingSchedule) return;

    // checa perm de edição por grupo
    const isShort = value === 30 || value === 60;
    const isLong = !isShort;

    const canEditOption =
      (isShort && perms.canEditInterval30m1h) ||
      (isLong && perms.canEditInterval2h4h24h);

    if (!canEditOption) return;

    try {
      setSavingSchedule(true);
      setIntervalMinutes(value);

      await api.post("/ixc/contracts/internet-blocked-report/schedule", {
        intervalMinutes: value,
      });

      // recarrega para garantir que está sincronizado com o backend
      await fetchSchedule();
    } catch (err) {
      console.error(
        "Erro ao atualizar intervalo do relatório IXC Internet Bloqueada:",
        err
      );
    } finally {
      setSavingSchedule(false);
    }
  }

  if (!perms.canViewPage) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-500" />
            <h2 className="text-2xl font-semibold text-slate-900">
              Service Page
            </h2>
          </div>
          <p className="text-sm text-slate-600">
            Você não tem permissão para acessar esta página de serviços.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho geral da Service Page */}
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-500" />
            <h2 className="text-2xl font-semibold text-slate-900">
              Service Page
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">
            Central de serviços e integrações. Aqui você acompanha os painéis
            do IXC e outras coisas doidas que a gente inventar depois.
          </p>
        </div>

        {/* Controle de frequência da automação IXC Internet Bloqueada */}
        {perms.canViewIntervalControls && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-slate-500">
              Frequência da automação IXC (Internet Bloqueada)
            </span>

            <div className="flex flex-wrap gap-1 justify-end">
              {INTERVAL_OPTIONS.map((opt) => {
                const isShort = opt.value === 30 || opt.value === 60;
                const isLong = !isShort;

                const canViewOption =
                  (isShort && perms.canViewInterval30m1h) ||
                  (isLong && perms.canViewInterval2h4h24h);

                if (!canViewOption) return null;

                const canEditOption =
                  (isShort && perms.canEditInterval30m1h) ||
                  (isLong && perms.canEditInterval2h4h24h);

                const isActive = intervalMinutes === opt.value;
                const disabled =
                  savingSchedule || loadingSchedule || !canEditOption;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      !disabled && handleChangeInterval(opt.value)
                    }
                    disabled={disabled}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      isActive
                        ? "bg-brand-500 text-white shadow-sm border border-brand-400"
                        : "border border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-500 bg-white",
                      disabled ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {loadingSchedule && (
              <span className="text-[11px] text-slate-400">
                Carregando configuração da automação…
              </span>
            )}

            {lastGeneratedAt && (
              <p className="text-[11px] text-slate-500">
                Último relatório gerado:{" "}
                {new Date(lastGeneratedAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Abas */}
      <div className="flex gap-2 rounded-full bg-slate-100 p-1 w-full max-w-xl">
        {perms.canViewDashboardTab && (
          <button
            type="button"
            onClick={() => setActiveTab("dashboard_ixc")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "dashboard_ixc"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            Dashboard IXC
          </button>
        )}

        {perms.canViewBlockedTab && (
          <button
            type="button"
            onClick={() => setActiveTab("ixc_blocked")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "ixc_blocked"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <WifiOff className="w-4 h-4" />
            IXC Internet Bloqueados
          </button>
        )}
      </div>

      {/* Conteúdo da aba */}
      <div className="rounded-2xl border border-slate-200 bg-white/60 shadow-sm">
        {activeTab === null && (
          <div className="p-4 sm:p-6">
            <p className="text-sm text-slate-500">
              Você não possui permissão para visualizar nenhuma das abas desta
              página.
            </p>
          </div>
        )}

        {activeTab === "dashboard_ixc" && perms.canViewDashboardTab && (
          <IxcInternetStatusDashboard
            onOpenBlockedReport={
              perms.canViewBlockedTab && perms.canOpenBlockedFromDashboard
                ? () => setActiveTab("ixc_blocked")
                : undefined
            }
            canViewContratosCard={perms.canViewContractsCard}
            canViewInternetNormalCard={perms.canViewInternetNormalCard}
            canViewInternetBlockedCard={perms.canViewInternetBlockedCard}
            canOpenBlockedFromDashboard={
              perms.canOpenBlockedFromDashboard && perms.canViewBlockedTab
            }
            canViewChart={perms.canViewChart}
          />
        )}

        {activeTab === "ixc_blocked" && perms.canViewBlockedTab && (
          <IxcInternetBlockedReportPage
            canViewGenerateButton={perms.canViewGenerateReportButton}
            canGenerate={perms.canTriggerGenerateReport}
            canViewDownloadButton={perms.canViewDownloadReportButton}
            canDownload={perms.canDownloadReport}
            canViewTable={perms.canViewBlockedTable}
          />
        )}
      </div>
    </div>
  );
}
