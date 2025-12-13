import { useMemo } from "react";
import { useSession } from "../../contexts/SessionContext";
import { buildUserSettingsPermissionFlags } from "../userSettingsPermissions";

export function useUserSettingsPermissionFlags() {
  const { permissions, permissionsLoading } = useSession();

  const flags = useMemo(() => {
    const keys = Array.isArray(permissions) ? permissions : [];
    return buildUserSettingsPermissionFlags(keys);
  }, [permissions]);

  return {
    ...flags,
    loading: permissionsLoading,
  };
}
