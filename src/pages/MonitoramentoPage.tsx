// src/pages/MonitoramentoPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SmartShortOLTPage } from "../components/monitoramento/SmartShortOLTPage";
import { SmartLossOLTPage } from "../components/monitoramento/SmartLossOLTPage";
import { FileText } from "lucide-react";
import { useMonitoringPermissions } from "../config/useEffects/useMonitoringPermissions";

export function MonitoramentoPage() {
  const [tab, setTab] = useState<"onus" | "los">("onus");
  const navigate = useNavigate();

  const {
    canViewIxcReportButton,
    canEditIxcReportButton,
  } = useMonitoringPermissions();

  function goToReport() {
    // segurança extra: se não puder editar, não navega
    if (!canEditIxcReportButton) return;

    const tipo = tab === "los" ? "los" : "power_off";
    navigate(`/monitoramento/smart-olt-relatorio?tipo=${tipo}`);
  }

  const showReportButton = canViewIxcReportButton;
  const reportDisabled = !canEditIxcReportButton;

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-500">
          <span className="font-bold text-lg">M</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Monitoramento
          </h1>

          <p className="text-sm text-slate-500">
            Acompanhe recursos automáticos e verificações do sistema.
          </p>
        </div>
      </header>

      <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("onus")}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              tab === "onus"
                ? "bg-slate-900 text-cyan-100"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            ONUs Desligadas
          </button>

          <button
            onClick={() => setTab("los")}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              tab === "los"
                ? "bg-slate-900 text-cyan-100"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            LOS
          </button>
        </div>

        {showReportButton && (
          <button
            type="button"
            onClick={goToReport}
            disabled={reportDisabled}
            className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium ${
              reportDisabled
                ? "text-slate-400 cursor-not-allowed opacity-60"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <FileText className="h-4 w-4" />
            Relatório detalhado IXC
          </button>
        )}
      </div>

      {tab === "onus" && <SmartShortOLTPage />}
      {tab === "los" && <SmartLossOLTPage />}
    </div>
  );
}
