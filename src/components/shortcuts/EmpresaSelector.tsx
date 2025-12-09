// src/components/shortcuts/EmpresaSelector.tsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type EmpresaOption = {
  auth_empresa_id: string;
  display_name: string;
};

type Props = {
  value: string | null;
  onChange: (empresaId: string | null) => void;
};

export function EmpresaSelector({ value, onChange }: Props) {
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/me/empresas");
        setEmpresas(res.data.empresas || []);
        if (!value && res.data.empresas?.length) {
          onChange(res.data.empresas[0].auth_empresa_id);
        }
      } catch (err) {
        console.error("Erro ao carregar empresas do usuário:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
        Carregando empresas...
      </div>
    );
  }

  if (!empresas.length) {
    return (
      <p className="text-xs text-slate-500">
        Nenhuma empresa vinculada à sua conta.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-600">Empresa:</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300"
      >
        {empresas.map((emp) => (
          <option key={emp.auth_empresa_id} value={emp.auth_empresa_id}>
            {emp.display_name}
          </option>
        ))}
      </select>
    </div>
  );
}
