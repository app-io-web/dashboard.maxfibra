// src/features/empresa-users/hooks/useEmpresasList.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import type { EmpresaSettings } from "../types";

type ApiEmpresasResponse = {
  empresas?: EmpresaSettings[];
};

export function useEmpresasList() {
  const [empresas, setEmpresas] = useState<EmpresaSettings[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [empresasError, setEmpresasError] = useState<string | null>(null);

  const loadEmpresas = useCallback(async () => {
    setLoadingEmpresas(true);
    setEmpresasError(null);

    try {
      let res;

      // rota principal
      try {
        res = await api.get<ApiEmpresasResponse>("/usuario/empresas");
      } catch {
        // fallback se teu app.use tiver prefixo
        res = await api.get<ApiEmpresasResponse>("/empresas/usuario/empresas");
      }

      const list = Array.isArray(res.data?.empresas)
        ? res.data.empresas
        : [];

      const sorted = [...list].sort((a, b) =>
        String(a.display_name ?? "").localeCompare(
          String(b.display_name ?? ""),
          "pt-BR",
          { sensitivity: "base" }
        )
      );

      setEmpresas(sorted);
    } catch (err: any) {
      console.error(err);
      setEmpresas([]);
      setEmpresasError(
        err?.response?.data?.error ||
          err?.message ||
          "Erro ao carregar empresas."
      );
    } finally {
      setLoadingEmpresas(false);
    }
  }, []);

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);

  const empresaOptions = useMemo(
    () =>
      empresas.map((e) => ({
        id: String(e.auth_empresa_id),
        label: e.display_name || e.auth_empresa_id,
      })),
    [empresas]
  );

  return {
    empresas,
    empresaOptions,
    loadingEmpresas,
    empresasError,
    reloadEmpresas: loadEmpresas,
  };
}
