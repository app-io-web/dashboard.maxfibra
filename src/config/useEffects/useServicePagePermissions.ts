// src/config/useEffects/useServicePagePermissions.ts
import { useMemo } from "react";
import { useSession } from "../../contexts/SessionContext";
import {
  resolveServicePagePermissions,
  type ServicePageResolvedPermissions,
} from "../servicePagePermissions";

export function useServicePagePermissions(): ServicePageResolvedPermissions & {
  permissionsLoading: boolean;
} {
  const { permissions, permissionsLoading } = useSession();

  const permissionKeys = useMemo(
    () => (Array.isArray(permissions) ? permissions : []),
    [permissions]
  );

  const resolved = useMemo(
    () => resolveServicePagePermissions(permissionKeys),
    [permissionKeys]
  );

  return {
    ...resolved,
    permissionsLoading, // opcional, mas ajuda na UI
  };
}
