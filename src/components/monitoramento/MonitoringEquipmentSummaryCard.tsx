// src/components/monitoramento/MonitoringEquipmentSummaryCard.tsx
import { Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMonitoringPermissions } from "../../config/useEffects/useMonitoringPermissions";

type MonitoringEquipmentSummaryCardProps = {
  offlineCount: number; // vindo do backend
  losCount: number;     // vindo do backend
};

export function MonitoringEquipmentSummaryCard({
  offlineCount,
  losCount,
}: MonitoringEquipmentSummaryCardProps) {
  const navigate = useNavigate();

  // permissões de monitoramento
  const { canViewSmartOltOnu, canViewSmartOltLos } = useMonitoringPermissions();

  const showOffline = canViewSmartOltOnu;
  const showLos = canViewSmartOltLos;

  // se o usuário não pode ver nada relacionado a esse card, some com ele
  if (!showOffline && !showLos) {
    return null;
  }

  // descrição dinâmica conforme o que o cara pode ver
  const description = showOffline && showLos
    ? "Resumo rápido de desligados e com LOS."
    : showOffline
    ? "Resumo rápido de ONUs desligadas."
    : "Resumo rápido de ONUs em LOS.";

  // ajusta o grid dinamicamente (1 ou 2 colunas)
  const visibleBlocks = [showOffline, showLos].filter(Boolean).length;
  const gridColsClass = visibleBlocks === 1 ? "grid-cols-1" : "grid-cols-2";

  function handleClick() {
    // se quiser separar por tab (desligados/los) depois, dá pra trocar aqui
    navigate("/monitoramento");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase">
            Monitoramento de equipamentos
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <Activity className="h-5 w-5 text-blue-500" />
      </div>

      <div className={`mt-4 grid ${gridColsClass} gap-2`}>
        {/* DESLIGADOS */}
        {showOffline && (
          <button
            type="button"
            onClick={handleClick}
            className="flex flex-col items-start rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-left hover:bg-amber-50 transition"
          >
            <span className="text-[11px] font-medium uppercase text-amber-700">
              Desligados
            </span>
            <span className="text-2xl font-semibold text-amber-700 leading-none">
              {offlineCount}
            </span>
            <span className="mt-1 text-[10px] text-amber-800/80">
              Ver no monitoramento
            </span>
          </button>
        )}

        {/* COM LOS */}
        {showLos && (
          <button
            type="button"
            onClick={handleClick}
            className="flex flex-col items-start rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-left hover:bg-rose-50 transition"
          >
            <span className="text-[11px] font-medium uppercase text-rose-700">
              Com LOS
            </span>
            <span className="text-2xl font-semibold text-rose-700 leading-none">
              {losCount}
            </span>
            <span className="mt-1 text-[10px] text-rose-800/80">
              Ver no monitoramento
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
