import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { EmpresaSettings } from "../types";

export function useEmpresaSettings() {
  const [empresa, setEmpresa] = useState<EmpresaSettings | null>(null);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [empresaError, setEmpresaError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEmpresa() {
      setLoadingEmpresa(true);
      setEmpresaError(null);

      try {
        const res = await api.get<{ empresaSettings: EmpresaSettings | null }>(
          "/empresa/settings"
        );

        if (!isMounted) return;

        if (!res.data.empresaSettings) {
          setEmpresaError(
            "Nenhuma configuração de empresa encontrada. Configure a empresa antes de criar usuários."
          );
          setEmpresa(null);
        } else {
          setEmpresa(res.data.empresaSettings);
        }
      } catch (err: any) {
        console.error(err);
        if (!isMounted) return;
        const msg =
          err?.response?.data?.error ||
          "Erro ao carregar informações da empresa.";
        setEmpresaError(msg);
      } finally {
        if (isMounted) setLoadingEmpresa(false);
      }
    }

    loadEmpresa();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    empresa,
    loadingEmpresa,
    empresaError,
    reloadEmpresa: async () => {
      // simples: força re-mount manual se quiser, mas geralmente não precisa
      // (mantive o hook simples)
    },
  };
}
