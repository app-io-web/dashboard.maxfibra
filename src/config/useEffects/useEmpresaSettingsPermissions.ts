import { useMemo } from "react";
import { useSession } from "../../contexts/SessionContext";
import { canAccessEmpresaSettings } from "../empresaSettingsPermissions";

export function useEmpresaSettingsPermissions() {
  const { permissions, permissionsLoading } = useSession();

  const userPermissions = useMemo(
    () => (Array.isArray(permissions) ? permissions : []),
    [permissions]
  );

  const canManageUsers = useMemo(() => {
    return canAccessEmpresaSettings(userPermissions, "gerenciar_usuarios");
  }, [userPermissions]);

  const canManageUsersView = useMemo(() => {
    return canAccessEmpresaSettings(userPermissions, "gerenciar_usuarios_view");
  }, [userPermissions]);

  return {
    userPermissions,
    permissionsLoading,
    canManageUsers,
    canManageUsersView,
  };
}
