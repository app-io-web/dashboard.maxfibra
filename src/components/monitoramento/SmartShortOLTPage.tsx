import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useMonitoringPermissions } from "../../config/useEffects/useMonitoringPermissions";

type SmartOnuLog = {
  id: string;
  usuario: string;
  onu_id: string;
  power_fail: string;
  status: string;
  created_at: string;
};

const INTERVAL_OPTIONS = [
  { label: "A cada 30 minutos", value: 30 },
  { label: "A cada 1 hora", value: 60 },
  { label: "A cada 2 horas", value: 120 },
  { label: "A cada 4 horas", value: 240 },
  { label: "A cada 24 horas", value: 1440 },
];

const ITEMS_PER_PAGE = 12;

type SortOrder = "mais_tempo" | "menos_tempo";

// converte "Power fail(4 days ago)" / "Power fail(10 minutes ago)" em minutos
function getPowerFailAgeInMinutes(powerFail: string, createdAt: string): number {
  const match = powerFail.match(/\((\d+)\s+([^)]+)\)/i);

  if (!match) {
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return Number.MAX_SAFE_INTEGER;
    const diffMs = Date.now() - created;
    return Math.max(0, Math.floor(diffMs / 60000));
  }

  const value = Number(match[1]);
  const unitRaw = match[2].toLowerCase().trim();

  if (Number.isNaN(value)) {
    return Number.MAX_SAFE_INTEGER;
  }

  let multiplier = 1;

  if (unitRaw.startsWith("minute")) {
    multiplier = 1;
  } else if (unitRaw.startsWith("hour")) {
    multiplier = 60;
  } else if (unitRaw.startsWith("day")) {
    multiplier = 60 * 24;
  } else if (unitRaw.startsWith("month")) {
    multiplier = 60 * 24 * 30;
  } else if (unitRaw.startsWith("year")) {
    multiplier = 60 * 24 * 365;
  }

  return value * multiplier;
}

export function SmartShortOLTPage() {
  const {
    canViewSmartOltOnu,
    canEditSmartOltOnu,
    canViewFrequencyAll,
    canViewFrequency30m1h,
    canViewFrequency2h4h24h,
    canEditFrequencyAll,
    canEditFrequency30m1h,
    canEditFrequency2h4h24h,
    canViewOrdering,
    canEditOrdering,
  } = useMonitoringPermissions();

  const [loading, setLoading] = useState(true);
  const [onus, setOnus] = useState<SmartOnuLog[]>([]);
  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>("mais_tempo");

  // flag de permitir execução manual (vinda do system-settings)
  const [allowManualRun, setAllowManualRun] = useState<boolean>(false);
  const [runningNow, setRunningNow] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // ---- VISUALIZAÇÃO / EDIÇÃO DE FREQUÊNCIA POR GRUPO ----

  // ajuda a saber se o usuário pode VER aquela opção de frequência
  function canSeeIntervalOption(value: number): boolean {
    if (canViewFrequencyAll) return true;

    if (value === 30 || value === 60) {
      return canViewFrequency30m1h;
    }

    if (value === 120 || value === 240 || value === 1440) {
      return canViewFrequency2h4h24h;
    }

    return false;
  }

  // ajuda a saber se o usuário pode EDITAR aquela opção de frequência
  function canEditIntervalOption(value: number): boolean {
    if (!canEditSmartOltOnu) return false;
    if (canEditFrequencyAll) return true;

    if (value === 30 || value === 60) {
      return canEditFrequency30m1h;
    }

    if (value === 120 || value === 240 || value === 1440) {
      return canEditFrequency2h4h24h;
    }

    return false;
  }

  useEffect(() => {
    if (!canViewSmartOltOnu) return;

    async function load() {
      setLoading(true);
      try {
        const [onusRes, scheduleRes, manualFlagRes] = await Promise.all([
          api.get("/monitoring/smart-short-olt"),
          api.get("/monitoring/smart-short-olt/schedule"),
          api
            .get("/system-settings/monitoring_allow_manual_smart_olt_run")
            .catch((err) => {
              console.error(
                "Erro ao carregar flag monitoring_allow_manual_smart_olt_run:",
                err
              );
              return null;
            }),
        ]);

        setOnus(onusRes.data.onus || []);
        setIntervalMinutes(scheduleRes.data.intervalMinutes);
        setPage(1);

        if (manualFlagRes && manualFlagRes.data) {
          const rawValue = manualFlagRes.data.value;
          setAllowManualRun(
            rawValue === true ||
              rawValue === "true" ||
              rawValue === 1 ||
              rawValue === "1"
          );
        }
      } catch (err) {
        console.error("Erro ao carregar monitoramento SmartOLT", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [canViewSmartOltOnu]);

  useEffect(() => {
    setPage(1);
  }, [sortOrder]);

  async function handleChangeInterval(value: number) {
    if (!canEditIntervalOption(value)) return; // checagem fina por opção

    try {
      setSavingSchedule(true);
      await api.post("/monitoring/smart-short-olt/schedule", {
        intervalMinutes: value,
      });
      setIntervalMinutes(value);
    } catch (err) {
      console.error("Erro ao salvar intervalo de execução", err);
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleRunNow() {
    if (!canEditSmartOltOnu) return; // segurança extra

    try {
      setRunningNow(true);
      setRunError(null);

      await api.post("/monitoring/smart-short-olt/run");

      const onusRes = await api.get("/monitoring/smart-short-olt");
      setOnus(onusRes.data.onus || []);
      setPage(1);
    } catch (err) {
      console.error("Erro ao executar monitoramento SmartOLT agora", err);
      setRunError("Erro ao executar o monitoramento agora.");
    } finally {
      setRunningNow(false);
    }
  }

  if (!canViewSmartOltOnu) {
    return (
      <div className="text-sm text-slate-500">
        Você não tem permissão para visualizar o monitoramento de ONUs
        desligadas.
      </div>
    );
  }

  if (loading) {
    return <div className="text-slate-400">Carregando...</div>;
  }

  const sortedOnus = [...onus].sort((a, b) => {
    const ageA = getPowerFailAgeInMinutes(a.power_fail, a.created_at);
    const ageB = getPowerFailAgeInMinutes(b.power_fail, b.created_at);

    if (sortOrder === "mais_tempo") {
      if (ageA === ageB) {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      return ageB - ageA;
    }

    if (ageA === ageB) {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return ageA - ageB;
  });

  const totalPages = Math.ceil(sortedOnus.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(page, totalPages);
  const pageItems = sortedOnus.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const totalOnus = onus.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                ONUs Desligadas
              </h2>

              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-600 border border-red-100 sm:text-xs">
                {totalOnus === 1
                  ? "1 ONU desligada"
                  : `${totalOnus} ONUs desligadas`}
              </span>
            </div>


          <p className="text-sm text-slate-500">
            Monitoramento automático via SmartOLT.
          </p>

          {totalOnus > 1 && canViewOrdering && (
            <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-[11px] text-slate-500 sm:text-xs">
                Ordenar por
              </span>

              <div className="inline-flex w-full rounded-full border border-slate-200 bg-white p-0.5 shadow-sm sm:w-auto sm:bg-slate-100">
                <button
                  type="button"
                  onClick={() => canEditOrdering && setSortOrder("mais_tempo")}
                  className={[
                    "flex-1 rounded-full px-3 py-1 text-[11px] transition-colors sm:flex-none sm:px-3 sm:text-xs",
                    sortOrder === "mais_tempo"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-800",
                    !canEditOrdering ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  Mais tempo desligada
                </button>

                <button
                  type="button"
                  onClick={() => canEditOrdering && setSortOrder("menos_tempo")}
                  className={[
                    "flex-1 rounded-full px-3 py-1 text-[11px] transition-colors sm:flex-none sm:px-3 sm:text-xs",
                    sortOrder === "menos_tempo"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-800",
                    !canEditOrdering ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  Menos tempo desligada
                </button>
              </div>
            </div>
          )}



          {runError && (
            <p className="mt-1 text-xs text-red-500">{runError}</p>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-[11px] text-slate-500 sm:text-xs">
              Frequência da automação
            </span>

            <div className="flex flex-wrap gap-1 justify-start sm:justify-end">
              {INTERVAL_OPTIONS.filter((opt) =>
                canSeeIntervalOption(opt.value)
              ).map((opt) => {
                const isActive = intervalMinutes === opt.value;
                const canEditThis = canEditIntervalOption(opt.value);
                const disabled = savingSchedule || !canEditThis;

                return (
                  <button
                    key={opt.value}
                    onClick={() => !disabled && handleChangeInterval(opt.value)}
                    disabled={disabled}
                    className={[
                      "rounded-full text-[11px] font-medium transition-colors px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5",
                      isActive
                        ? "bg-brand-500 text-white shadow-sm border border-brand-400"
                        : "border border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-500",
                      disabled ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {!canEditSmartOltOnu && (
              <span className="mt-0.5 text-[10px] text-slate-400">
                Você não tem permissão para alterar a frequência.
              </span>
            )}
          </div>

          {allowManualRun && canEditSmartOltOnu && (
            <button
              type="button"
              onClick={handleRunNow}
              disabled={runningNow}
              className="self-start sm:self-end inline-flex items-center rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningNow ? "Executando…" : "Executar agora"}
            </button>
          )}
        </div>

      </div>

      {sortedOnus.length === 0 ? (
        <div className="text-slate-500">
          Nenhuma ONU desligada registrada.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pageItems.map((o) => (
              <div
                key={o.id}
                className="bg-white border border-slate-200 rounded-xl p-4 
                           shadow-md hover:shadow-lg transition-all text-slate-800"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-slate-900">
                    {o.onu_id}
                    <span className="text-xs text-slate-500 ml-1">
                      ({o.usuario})
                    </span>
                  </span>

                  <span className="text-xs text-slate-500">
                    Registrado em{" "}
                    {new Date(o.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div className="mt-2 text-sm">
                  Status:{" "}
                  <span
                    className={
                      o.status === "offline"
                        ? "text-red-600 font-semibold"
                        : "text-blue-500 font-semibold"
                    }
                  >
                    {o.status}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {o.power_fail}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-4">
              <button
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={[
                  "px-3 py-1.5 rounded-md text-sm border transition-colors",
                  safePage === 1
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-slate-900 text-slate-50 border-slate-800 hover:bg-slate-800",
                ].join(" ")}
              >
                Anterior
              </button>

              <span className="text-slate-600 text-sm">
                Página {safePage} de {totalPages}
              </span>

              <button
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={[
                  "px-3 py-1.5 rounded-md text-sm border transition-colors",
                  safePage === totalPages
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-slate-900 text-slate-50 border-slate-800 hover:bg-slate-800",
                ].join(" ")}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
