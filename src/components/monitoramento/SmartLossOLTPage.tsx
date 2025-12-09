import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useMonitoringPermissions } from "../../config/useEffects/useMonitoringPermissions";

type SmartLossLog = {
  id: string;
  usuario: string;
  onu_id: string;
  onu_descr: string;
  los_info: string;
  gpon_port: string | null;
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

const PAGE_SIZE = 12;

// converte "LOS(4 days ago)" / "LOS(10 minutes ago)" / "LOS(2 months ago)" em minutos
function getLosAgeInMinutes(losInfo: string): number {
  const match = losInfo.match(/LOS\((\d+)\s+([^)]+)\)/i);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
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

// pega só a parte antes dos dois pontos da porta GPON
function getGponBase(port: string | null): string | null {
  if (!port) return null;
  const [base] = port.split(":");
  return base || null;
}

export function SmartLossOLTPage() {
  const {
    canViewSmartOltLos,
    canEditSmartOltLos,
    canViewFrequencyAll,
    canViewFrequency30m1h,
    canViewFrequency2h4h24h,
    canEditFrequencyAll,
    canEditFrequency30m1h,
    canEditFrequency2h4h24h,
    canViewOrdering,
    canEditOrdering,
  } = useMonitoringPermissions();

  const [items, setItems] = useState<SmartLossLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [selectedGpon, setSelectedGpon] = useState<string>("all");

  const [sortMode, setSortMode] = useState<"recent" | "longer">("longer");

  const [page, setPage] = useState(1);

  const [allowManualRun, setAllowManualRun] = useState<boolean>(false);
  const [runningNow, setRunningNow] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // ----- VISUALIZAÇÃO / EDIÇÃO DE FREQUÊNCIAS (LOS) -----
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

  function canEditIntervalOption(value: number): boolean {
    if (!canEditSmartOltLos) return false;
    if (canEditFrequencyAll) return true;

    if (value === 30 || value === 60) {
      return canEditFrequency30m1h;
    }

    if (value === 120 || value === 240 || value === 1440) {
      return canEditFrequency2h4h24h;
    }

    return false;
  }

  async function fetchData() {
    try {
      const response = await api.get("/monitoring/smart-short-olt-los");
      setItems(response.data?.onus || []);
    } catch (e) {
      console.error("Erro ao carregar LOS:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSchedule() {
    try {
      const res = await api.get("/monitoring/smart-short-olt-los/schedule");
      setIntervalMinutes(res.data?.intervalMinutes ?? null);
      setLastRun(res.data?.lastRun ?? null);
    } catch (e) {
      console.error("Erro ao buscar schedule do LOS:", e);
    }
  }

  async function fetchManualFlag() {
    try {
      const res = await api
        .get("/system-settings/monitoring_allow_manual_smart_olt_los_run")
        .catch((err) => {
          console.error(
            "Erro ao carregar flag monitoring_allow_manual_smart_olt_los_run:",
            err
          );
          return null;
        });

      if (res && res.data) {
        const rawValue = res.data.value;
        setAllowManualRun(
          rawValue === true ||
            rawValue === "true" ||
            rawValue === 1 ||
            rawValue === "1"
        );
      }
    } catch (err) {
      console.error(
        "Erro inesperado ao carregar flag monitoring_allow_manual_smart_olt_los_run:",
        err
      );
    }
  }

  useEffect(() => {
    if (!canViewSmartOltLos) return;

    fetchData();
    fetchSchedule();
    fetchManualFlag();
  }, [canViewSmartOltLos]);

  async function handleChangeInterval(value: number) {
    if (!canEditIntervalOption(value)) return;
    if (savingSchedule) return;

    try {
      setSavingSchedule(true);
      setIntervalMinutes(value);

      await api.post("/monitoring/smart-short-olt-los/schedule", {
        intervalMinutes: value,
      });

      await fetchSchedule();
    } catch (e) {
      console.error("Erro ao atualizar intervalo LOS:", e);
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleRunNow() {
    if (!canEditSmartOltLos) return;

    try {
      setRunningNow(true);
      setRunError(null);

      await api.post("/monitoring/smart-short-olt-los/run");

      await Promise.all([fetchData(), fetchSchedule()]);
      setPage(1);
    } catch (err) {
      console.error("Erro ao executar monitoramento LOS agora", err);
      setRunError("Erro ao executar o monitoramento de LOS agora.");
    } finally {
      setRunningNow(false);
    }
  }

  const gponOptions = useMemo(() => {
    const setPorts = new Set<string>();
    items.forEach((i) => {
      const base = getGponBase(i.gpon_port);
      if (base) setPorts.add(base);
    });
    return Array.from(setPorts).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let base = [...items];

    if (selectedGpon !== "all") {
      base = base.filter((i) => {
        const portBase = getGponBase(i.gpon_port);
        return portBase === selectedGpon;
      });
    }

    base.sort((a, b) => {
      const ageA = getLosAgeInMinutes(a.los_info);
      const ageB = getLosAgeInMinutes(b.los_info);

      if (sortMode === "recent") {
        if (ageA === ageB) {
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        }
        return ageA - ageB;
      } else {
        if (ageA === ageB) {
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        }
        return ageB - ageA;
      }
    });

    return base;
  }, [items, selectedGpon, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [selectedGpon, sortMode]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const totalOnus = items.length;

  if (!canViewSmartOltLos) {
    return (
      <div className="text-sm text-slate-500">
        Você não tem permissão para visualizar o monitoramento de ONUs em LOS.
      </div>
    );
  }

  if (loading) {
    return <div className="text-slate-500">Carregando dados de LOS…</div>;
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              ONUs em LOS
            </h2>

            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-100">
              {totalOnus === 1
                ? "1 ONU em LOS"
                : `${totalOnus} ONUs em LOS`}
            </span>
          </div>

          <p className="text-sm text-slate-500">
            Monitoramento automático via SmartOLT.
          </p>

          {totalOnus > 1 && canViewOrdering && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">Ordenar por</span>
              <div className="inline-flex rounded-full bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => canEditOrdering && setSortMode("longer")}
                  className={[
                    "px-2.5 py-1 text-xs rounded-full transition-colors",
                    sortMode === "longer"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                    !canEditOrdering ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  Mais tempo em LOS
                </button>
                <button
                  type="button"
                  onClick={() => canEditOrdering && setSortMode("recent")}
                  className={[
                    "px-2.5 py-1 text-xs rounded-full transition-colors",
                    sortMode === "recent"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                    !canEditOrdering ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  Menos tempo em LOS
                </button>
              </div>
            </div>
          )}

          {runError && (
            <p className="mt-1 text-xs text-red-500">{runError}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-slate-500">
              Frequência da automação
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
              {INTERVAL_OPTIONS.filter((opt) =>
                canSeeIntervalOption(opt.value)
              ).map((opt) => {
                const isActive = intervalMinutes === opt.value;
                const canEditThis = canEditIntervalOption(opt.value);
                const disabled = savingSchedule || !canEditThis;

                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      !disabled && handleChangeInterval(opt.value)
                    }
                    disabled={disabled}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
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
            {!canEditSmartOltLos && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                Você não tem permissão para alterar a frequência.
              </span>
            )}
          </div>

          {allowManualRun && canEditSmartOltLos && (
            <button
              type="button"
              onClick={handleRunNow}
              disabled={runningNow}
              className="inline-flex items-center rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningNow ? "Executando…" : "Executar agora"}
            </button>
          )}

          {lastRun && (
            <p className="text-[11px] text-slate-500">
              Última execução:{" "}
              {new Date(lastRun).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
      </div>

      {/* FILTRO GPON + INFO */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-slate-500">
            Filtrar por GPON:
          </span>
          <select
            className="text-xs rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-700"
            value={selectedGpon}
            onChange={(e) => setSelectedGpon(e.target.value)}
          >
            <option value="all">Todas as portas</option>
            {gponOptions.map((portBase) => (
              <option key={portBase} value={portBase}>
                GPON {portBase}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 md:text-right">
          <p>Registros atuais: {items.length}</p>
        </div>
      </div>

      {/* LISTA / VAZIO */}
      {filteredItems.length === 0 ? (
        <div className="text-slate-500">
          Nenhuma ONU em LOS encontrada com os filtros atuais. ✅
        </div>
      ) : (
        <>
          {/* GRID DE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {pageItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    ONU: {item.onu_id}
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
                    LOS
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Usuário: {item.usuario}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Porta: {item.gpon_port || "—"}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {item.onu_descr}
                </p>

                <p className="text-xs text-red-600 mt-2">{item.los_info}</p>

                <p className="text-[11px] text-slate-400 mt-3">
                  {new Date(item.created_at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))}
          </div>

          {/* PAGINAÇÃO */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-2 py-1 rounded-md border ${
                    page === 1
                      ? "border-slate-200 text-slate-300 cursor-not-allowed"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  className={`px-2 py-1 rounded-md border ${
                    page === totalPages
                      ? "border-slate-200 text-slate-300 cursor-not-allowed"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
