// src/components/system-config/MonitoringSmartOltSection.tsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { LayoutDashboard, SlidersHorizontal } from "lucide-react";

const ALLOWED_INTERVALS = [30, 60, 120, 240, 1440];

export function MonitoringSmartOltSection() {
  // intervalo geral (ONUs desligadas)
  const [intervalMinutes, setIntervalMinutes] = useState<number>(1440);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // intervalo LOS
  const [losIntervalMinutes, setLosIntervalMinutes] = useState<number>(1440);
  const [loadingLosSchedule, setLoadingLosSchedule] = useState(true);
  const [savingLosSchedule, setSavingLosSchedule] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // flag vindo do backend - EXECUÇÃO MANUAL GERAL (ONUs desligadas)
  const [allowManualRun, setAllowManualRun] = useState(true);
  const [loadingManualFlag, setLoadingManualFlag] = useState(true);
  const [savingManualFlag, setSavingManualFlag] = useState(false);

  // flag vindo do backend - EXECUÇÃO MANUAL LOS
  const [allowManualLosRun, setAllowManualLosRun] = useState(true);
  const [loadingManualLosFlag, setLoadingManualLosFlag] = useState(true);
  const [savingManualLosFlag, setSavingManualLosFlag] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoadingSchedule(true);
        setLoadingLosSchedule(true);
        setLoadingManualFlag(true);
        setLoadingManualLosFlag(true);
        setError(null);

        const [
          scheduleResp,
          losScheduleResp,
          manualFlagRes,
          manualFlagLosRes,
        ] = await Promise.all([
          api.get("/monitoring/smart-short-olt/schedule"),
          api
            .get("/monitoring/smart-short-olt-los/schedule")
            .catch((err) => {
              console.error(
                "Erro ao carregar schedule do SmartOLT LOS:",
                err
              );
              return null;
            }),
          api
            .get("/system-settings/monitoring_allow_manual_smart_olt_run")
            .catch((err) => {
              console.error(
                "Erro ao carregar flag monitoring_allow_manual_smart_olt_run:",
                err
              );
              return null;
            }),
          api
            .get("/system-settings/monitoring_allow_manual_smart_olt_los_run")
            .catch((err) => {
              console.error(
                "Erro ao carregar flag monitoring_allow_manual_smart_olt_los_run:",
                err
              );
              return null;
            }),
        ]);

        if (!isMounted) return;

        const value = scheduleResp.data?.intervalMinutes ?? 1440;
        setIntervalMinutes(value);

        if (losScheduleResp && losScheduleResp.data) {
          const losValue = losScheduleResp.data?.intervalMinutes ?? 1440;
          setLosIntervalMinutes(losValue);
        }

        if (manualFlagRes && manualFlagRes.data) {
          const rawValue = manualFlagRes.data.value;
          setAllowManualRun(
            rawValue === true ||
              rawValue === "true" ||
              rawValue === 1 ||
              rawValue === "1"
          );
        }

        if (manualFlagLosRes && manualFlagLosRes.data) {
          const rawValue = manualFlagLosRes.data.value;
          setAllowManualLosRun(
            rawValue === true ||
              rawValue === "true" ||
              rawValue === 1 ||
              rawValue === "1"
          );
        }
      } catch (err) {
        console.error("Erro ao carregar configurações SmartOLT:", err);
        if (isMounted) {
          setError("Não foi possível carregar as configurações atuais.");
        }
      } finally {
        if (isMounted) {
          setLoadingSchedule(false);
          setLoadingLosSchedule(false);
          setLoadingManualFlag(false);
          setLoadingManualLosFlag(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveSchedule() {
    try {
      setSavingSchedule(true);
      setError(null);

      await api.post("/monitoring/smart-short-olt/schedule", {
        intervalMinutes,
      });
    } catch (err) {
      console.error("Erro ao salvar schedule SmartOLT:", err);
      setError("Erro ao salvar o intervalo. Tente novamente.");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleSaveLosSchedule() {
    try {
      setSavingLosSchedule(true);
      setError(null);

      await api.post("/monitoring/smart-short-olt-los/schedule", {
        intervalMinutes: losIntervalMinutes,
      });
    } catch (err) {
      console.error("Erro ao salvar schedule SmartOLT LOS:", err);
      setError("Erro ao salvar o intervalo de LOS. Tente novamente.");
    } finally {
      setSavingLosSchedule(false);
    }
  }

  async function handleToggleManualRun(next: boolean) {
    try {
      setSavingManualFlag(true);
      setError(null);
      setAllowManualRun(next);

      await api.put("/system-settings/monitoring_allow_manual_smart_olt_run", {
        value: next,
        description:
          "Permite executar manualmente o monitoramento SmartOLT (ONUs desligadas) pelo painel.",
        is_sensitive: false,
        category: "monitoring",
      });
    } catch (err) {
      console.error(
        "Erro ao salvar flag de execução manual SmartOLT:",
        err
      );
      setError("Erro ao salvar a configuração de execução manual.");
      // rollback visual caso tenha dado ruim
      setAllowManualRun((prev) => !next || prev);
    } finally {
      setSavingManualFlag(false);
    }
  }

  async function handleToggleManualLosRun(next: boolean) {
    try {
      setSavingManualLosFlag(true);
      setError(null);
      setAllowManualLosRun(next);

      await api.put(
        "/system-settings/monitoring_allow_manual_smart_olt_los_run",
        {
          value: next,
          description:
            "Permite executar manualmente o monitoramento SmartOLT (ONUs em LOS) pelo painel.",
          is_sensitive: false,
          category: "monitoring",
        }
      );
    } catch (err) {
      console.error(
        "Erro ao salvar flag de execução manual SmartOLT LOS:",
        err
      );
      setError("Erro ao salvar a configuração de execução manual de LOS.");
      // rollback visual
      setAllowManualLosRun((prev) => !next || prev);
    } finally {
      setSavingManualLosFlag(false);
    }
  }

  return (
    <section
      className="
        overflow-hidden rounded-2xl border border-slate-200 
        bg-white shadow-sm
      "
    >
      {/* HEADER NO MESMO ESTILO DO DASHBOARD */}
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
            rounded-xl bg-blue-500/10 text-blue-500
          "
        >
          <LayoutDashboard className="h-5 w-5" />
        </div>

        <div className="flex flex-col">
          <h2 className="font-semibold text-slate-800 text-base sm:text-lg">
            Monitoramento SmartOLT
          </h2>
          <p className="text-xs text-slate-500">
            Ajuste os intervalos do CRON e as permissões de execução manual das
            automações SmartOLT.
          </p>
        </div>
      </header>

      {/* CORPO NO MESMO PADRÃO DO DashboardConfigSection */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-3">
        {(loadingSchedule ||
          loadingLosSchedule ||
          loadingManualFlag ||
          loadingManualLosFlag) && (
          <p className="text-xs text-slate-500">
            Carregando configurações do SmartOLT...
          </p>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* LINHA: INTERVALO ONUs DESLIGADAS (TIMER SEPARADO) */}
        <div
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
                mt-0.5 rounded-lg bg-slate-100 p-1.5 text-blue-500
              "
            >
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-800">
                Intervalo do monitoramento (ONUs desligadas)
              </p>
              <p className="text-xs text-slate-500">
                Define de quanto em quanto tempo o CRON roda a automação
                SmartOLT para ONUs desligadas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap justify-start sm:justify-end gap-2">
              {ALLOWED_INTERVALS.map((value) => {
                const isActive = intervalMinutes === value;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={savingSchedule || loadingSchedule}
                    onClick={() => setIntervalMinutes(value)}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      isActive
                        ? "bg-brand-500 text-white shadow-sm border border-brand-400"
                        : "border border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-500",
                      savingSchedule || loadingSchedule
                        ? "opacity-50 cursor-not-allowed"
                        : "",
                    ].join(" ")}
                  >
                    {value === 1440 ? "1x por dia" : `${value} min`}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSaveSchedule}
              disabled={savingSchedule || loadingSchedule}
              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingSchedule ? "Salvando..." : "Salvar intervalo"}
            </button>
          </div>
        </div>

        {/* LINHA: INTERVALO ONUs EM LOS (TIMER SEPARADO) */}
        <div
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
                mt-0.5 rounded-lg bg-slate-100 p-1.5 text-blue-500
              "
            >
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-800">
                Intervalo do monitoramento (ONUs em LOS)
              </p>
              <p className="text-xs text-slate-500">
                Define a frequência da automação específica para ONUs em LOS.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap justify-start sm:justify-end gap-2">
              {ALLOWED_INTERVALS.map((value) => {
                const isActive = losIntervalMinutes === value;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={savingLosSchedule || loadingLosSchedule}
                    onClick={() => setLosIntervalMinutes(value)}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      isActive
                        ? "bg-brand-500 text-white shadow-sm border border-brand-400"
                        : "border border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-500",
                      savingLosSchedule || loadingLosSchedule
                        ? "opacity-50 cursor-not-allowed"
                        : "",
                    ].join(" ")}
                  >
                    {value === 1440 ? "1x por dia" : `${value} min`}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSaveLosSchedule}
              disabled={savingLosSchedule || loadingLosSchedule}
              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingLosSchedule
                ? "Salvando..."
                : "Salvar intervalo de LOS"}
            </button>
          </div>
        </div>

        {/* LINHA: EXECUÇÃO MANUAL ONUs DESLIGADAS */}
        <div
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
                mt-0.5 rounded-lg bg-slate-100 p-1.5 text-blue-500
              "
            >
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-800">
                Execução manual (ONUs desligadas)
              </p>
              <p className="text-xs text-slate-500">
                Controla se o botão{" "}
                <span className="font-semibold">Executar agora</span> aparece na
                tela de ONUs desligadas.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loadingManualFlag || savingManualFlag}
            onClick={() => handleToggleManualRun(!allowManualRun)}
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full border transition-all",
              allowManualRun
                ? "bg-blue-500 border-blue-500"
                : "bg-slate-300 border-slate-300",
              loadingManualFlag || savingManualFlag
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all",
                allowManualRun ? "translate-x-5" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        {/* LINHA: EXECUÇÃO MANUAL ONUs EM LOS */}
        <div
          className="
            flex flex-col gap-4 rounded-xl 
            bg-white border border-slate-200 
            px-4 py-3 
            sm:flex-row sm:items-center sm:justify-between
          "
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-start gap-3">
              <div
                className="
                  mt-0.5 rounded-lg bg-slate-100 p-1.5 text-blue-500
                "
              >
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-800">
                  Execução manual (ONUs em LOS)
                </p>
                <p className="text-xs text-slate-500">
                  Controla se o botão{" "}
                  <span className="font-semibold">Executar agora</span> aparece
                  na tela de ONUs em LOS.
                </p>
              </div>
            </div>

            {!allowManualLosRun && (
              <p className="text-[11px] text-slate-500 pl-[2.35rem]">
                O botão de execução manual para{" "}
                <span className="font-semibold">ONUs em LOS</span> está
                desabilitado pela configuração{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
                  monitoring_allow_manual_smart_olt_los_run
                </code>
                .
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={loadingManualLosFlag || savingManualLosFlag}
            onClick={() => handleToggleManualLosRun(!allowManualLosRun)}
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full border transition-all",
              allowManualLosRun
                ? "bg-blue-500 border-blue-500"
                : "bg-slate-300 border-slate-300",
              loadingManualLosFlag || savingManualLosFlag
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all",
                allowManualLosRun ? "translate-x-5" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
