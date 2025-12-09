// src/config/useEffects/useMonitoringPermissions.ts
import { useMemo } from "react";
import { resolveMonitoringPermissions } from "../monitoringPermissions";
import { getCurrentUser } from "../../lib/auth";

// reaproveita o tipo a partir do retorno da função
type MonitoringResolvedPermissions = ReturnType<typeof resolveMonitoringPermissions>;

export function useMonitoringPermissions(): MonitoringResolvedPermissions {
  const user = getCurrentUser() as (ReturnType<typeof getCurrentUser> & {
    permissions?: string[];
  }) | null;

  const permissionKeys = user?.permissions ?? [];

  const resolved = useMemo(
    () => resolveMonitoringPermissions(permissionKeys),
    [permissionKeys]
  );

  return resolved;
}
