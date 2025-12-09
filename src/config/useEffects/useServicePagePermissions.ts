// src/config/useEffects/useServicePagePermissions.ts
import { useMemo } from "react";
import { resolveServicePagePermissions } from "../servicePagePermissions";
import type { ServicePageResolvedPermissions } from "../servicePagePermissions";
import { getCurrentUser } from "../../lib/auth";

export function useServicePagePermissions(): ServicePageResolvedPermissions {
  const user = getCurrentUser() as
    | (ReturnType<typeof getCurrentUser> & { permissions?: string[] })
    | null;

  const permissionKeys = user?.permissions ?? [];

  const resolved = useMemo(
    () => resolveServicePagePermissions(permissionKeys),
    [permissionKeys]
  );

  return resolved;
}
