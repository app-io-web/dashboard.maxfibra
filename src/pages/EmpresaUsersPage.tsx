import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

import { useEmpresaSettingsPermissions } from "../config/useEffects/useEmpresaSettingsPermissions";

import { PageHeader } from "../features/empresa-users/components/PageHeader";
import { EmpresaInfoCard } from "../features/empresa-users/components/EmpresaInfoCard";
import { UsersTableCard } from "../features/empresa-users/components/UsersTableCard";
import { UserCreateForm } from "../features/empresa-users/components/UserCreateForm";

import { useEmpresaSettings } from "../features/empresa-users/hooks/useEmpresaSettings";
import { useEmpresaUsers } from "../features/empresa-users/hooks/useEmpresaUsers";
import { useAllowedProfiles } from "../features/empresa-users/hooks/useAllowedProfiles";

import { getLoggedUserIdFromToken } from "../features/empresa-users/utils";
import type { EmpresaSettings } from "../features/empresa-users/types";

type ApiEmpresasResponse = {
  empresas?: EmpresaSettings[];
};

export function EmpresaUsersPage() {
  const { canManageUsers } = useEmpresaSettingsPermissions();
  const loggedUserId = useMemo(() => getLoggedUserIdFromToken(), []);

  const { empresa, loadingEmpresa, empresaError } = useEmpresaSettings();

  const {
    activeUsers,
    loadingUsers,
    usersError,
    setUsersError,     // ← necessário pro handleEdit
    busyUserId,
    setBusyUserId,     // ← necessário pro handleEdit
    loadUsers,
    handleInactivate,
  } = useEmpresaUsers({ empresa, canManageUsers, loggedUserId });

  const {
    allowedProfiles,
    loadingProfiles,
    profilesError,
  } = useAllowedProfiles(Boolean(empresa?.auth_empresa_id));

  // ✅ Função de edição (usa os states do hook)
  const handleEdit = useCallback(
    async (vinculoId: string, payload: any) => {
      setBusyUserId(vinculoId);
      setUsersError(null);

      try {
        await api.put(`/empresa/users/${vinculoId}`, payload);
        await loadUsers(); // recarrega a lista pra mostrar os dados atualizados
      } catch (err: any) {
        console.error("Erro ao editar usuário:", err);
        const msg = err?.response?.data?.error || "Erro ao salvar alterações.";
        setUsersError(msg);
      } finally {
        setBusyUserId(null);
      }
    },
    [loadUsers, setBusyUserId, setUsersError]
  );

  // ✅ LISTA DE EMPRESAS PARA O SELECT
  const [empresas, setEmpresas] = useState<EmpresaSettings[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [empresasError, setEmpresasError] = useState<string | null>(null);

  // ✅ carrega usuários quando a empresa atual muda
  useEffect(() => {
    if (!empresa?.auth_empresa_id) return;
    loadUsers();
  }, [empresa?.auth_empresa_id, loadUsers]);

  // ✅ carrega empresas disponíveis para vincular
  useEffect(() => {
    if (!loggedUserId) return;

    let mounted = true;

    async function loadEmpresas() {
      try {
        setLoadingEmpresas(true);
        setEmpresasError(null);

        let res;
        try {
          res = await api.get<ApiEmpresasResponse>("/usuario/empresas");
        } catch {
          res = await api.get<ApiEmpresasResponse>("/empresas/usuario/empresas");
        }

        const list = Array.isArray(res.data?.empresas) ? res.data.empresas : [];
        const sorted = [...list].sort((a, b) =>
          String(a?.display_name ?? "").localeCompare(String(b?.display_name ?? ""), "pt-BR", {
            sensitivity: "base",
          })
        );

        if (mounted) setEmpresas(sorted);
      } catch (err: any) {
        console.error("Erro ao carregar empresas:", err);
        if (mounted) {
          setEmpresas([]);
          setEmpresasError(
            err?.response?.data?.error || err?.message || "Erro ao carregar empresas disponíveis"
          );
        }
      } finally {
        if (mounted) setLoadingEmpresas(false);
      }
    }

    loadEmpresas();

    return () => {
      mounted = false;
    };
  }, [loggedUserId]);

  return (
    <div className="space-y-4">
      <PageHeader />

      {loadingEmpresa && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Carregando dados da empresa...
        </div>
      )}

      {!loadingEmpresa && empresaError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {empresaError}
        </div>
      )}

      {!loadingEmpresa && !empresaError && empresa && (
        <>
          <EmpresaInfoCard empresa={empresa} />

          <UsersTableCard
            activeUsers={activeUsers}
            loadingUsers={loadingUsers}
            usersError={usersError}
            canManageUsers={canManageUsers}
            busyUserId={busyUserId}
            onReload={loadUsers}
            onInactivate={handleInactivate}
            onEdit={handleEdit} // ← agora com a função certa
          />

          <UserCreateForm
            empresas={empresas}
            defaultEmpresaId={empresa.auth_empresa_id}
            onCreated={loadUsers}
            allowedProfiles={allowedProfiles}
            loadingProfiles={loadingProfiles}
            profilesError={profilesError}
          />

          {loadingEmpresas && (
            <div className="text-sm text-slate-500">Carregando empresas disponíveis...</div>
          )}

          {empresasError && <div className="text-sm text-rose-600">{empresasError}</div>}
        </>
      )}
    </div>
  );
}