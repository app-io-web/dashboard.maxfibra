import { useMemo } from "react";
import { resolveMonitoringPermissions } from "../monitoringPermissions";
import { useSession } from "../../contexts/SessionContext";

// reaproveita o tipo a partir do retorno da função
type MonitoringResolvedPermissions = ReturnType<
  typeof resolveMonitoringPermissions
>;

export function useMonitoringPermissions(): MonitoringResolvedPermissions {
  const { permissions, permissionsLoading } = useSession();

  const permissionKeys = useMemo(
    () => (Array.isArray(permissions) ? permissions : []),
    [permissions]
  );

  const resolved = useMemo(
    () => resolveMonitoringPermissions(permissionKeys),
    [permissionKeys]
  );

  return {
    ...resolved,
  };
}
