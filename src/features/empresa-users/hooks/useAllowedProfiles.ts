import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import type { ProfileItem } from "../types";
import { ALLOWED_PROFILE_NAMES, ALLOWED_PROFILE_SLUGS } from "../constants";
import { profileMatches } from "../utils";

function normalizeProfile(p: any): ProfileItem {
  const id = String(p?.id ?? "");
  const key = typeof p?.key === "string" ? p.key : null;

  return {
    id,
    // no teu backend é label (não name)
    name: String(p?.label ?? p?.name ?? "Perfil"),
    // se você filtra por slug, usa o key como slug padrão
    slug: p?.slug ?? key,
    key,
    // no teu backend é is_active
    is_enabled: typeof p?.is_active === "boolean" ? p.is_active : true,
  };
}

export function useAllowedProfiles(enabled: boolean) {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    setProfilesError(null);

    try {
      // ✅ endpoint real do teu backend
      const res = await api.get("/rbac/allowed-profiles");


      const raw = res.data?.data ?? [];


      const list: ProfileItem[] = Array.isArray(raw)
        ? raw.map(normalizeProfile)
        : [];

      setProfiles(list);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || "Erro ao carregar perfis.";
      setProfilesError(msg);
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    loadProfiles();
  }, [enabled, loadProfiles]);

  const allowedProfiles = useMemo(() => {
    const names = ALLOWED_PROFILE_NAMES as unknown as readonly string[];
    const slugs = ALLOWED_PROFILE_SLUGS as unknown as readonly string[];

    return profiles.filter((p) => profileMatches(p, names, slugs));
  }, [profiles]);

  return {
    allowedProfiles,
    loadingProfiles,
    profilesError,
    reloadProfiles: loadProfiles,
    // (se precisar na UI)
    allProfiles: profiles,
  };
}
