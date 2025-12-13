import type { EmpresaSettings } from "../types";

export function EmpresaInfoCard({ empresa }: { empresa: EmpresaSettings }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 mb-1">Empresa atual</p>
      <p className="text-sm text-slate-900 font-semibold">
        {empresa.display_name || "Empresa sem nome"}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        ID (auth_empresa_id):{" "}
        <span className="font-mono text-[11px] text-slate-700">
          {empresa.auth_empresa_id}
        </span>
      </p>
    </div>
  );
}
