import { ACCESS_TOKEN_KEY } from "../../lib/api";
import type { EmpresaUserRow, ProfileItem } from "./types";

// decode simples do JWT (sem lib)
export function getLoggedUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;

    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;

    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    const payload = JSON.parse(json);

    return (
      payload?.auth_user_id ||
      payload?.userId ||
      payload?.id ||
      payload?.sub ||
      null
    );
  } catch {
    return null;
  }
}

// ✅ qualquer shape torto do backend, a gente engole e cospe certo
export function normalizeUserRow(raw: any): EmpresaUserRow {
  const name =
    (typeof raw?.name === "string" && raw.name.trim()) ||
    (typeof raw?.display_name === "string" && raw.display_name.trim()) ||
    (typeof raw?.user_name === "string" && raw.user_name.trim()) ||
    "Usuário";

  const email =
    (typeof raw?.email === "string" && raw.email.trim()) ||
    (typeof raw?.user_email === "string" && raw.user_email.trim()) ||
    null;

  const role =
    (typeof raw?.role === "string" && raw.role.trim()) ||
    (typeof raw?.user_role === "string" && raw.user_role.trim()) ||
    null;

  const profession =
    (typeof raw?.profession === "string" && raw.profession.trim()) ||
    (typeof raw?.cargo === "string" && raw.cargo.trim()) ||
    null;

  const auth_user_id =
    (typeof raw?.auth_user_id === "string" && raw.auth_user_id) ||
    (typeof raw?.user_id === "string" && raw.user_id) ||
    (typeof raw?.authUserId === "string" && raw.authUserId) ||
    undefined;

  const id =
    (typeof raw?.id === "string" && raw.id) ||
    (typeof raw?.link_id === "string" && raw.link_id) ||
    auth_user_id ||
    String(Math.random());

  const is_enabled =
    typeof raw?.is_enabled === "boolean"
      ? raw.is_enabled
      : typeof raw?.enabled === "boolean"
      ? raw.enabled
      : true;

  return {
    id,
    auth_user_id,
    name,
    email,
    role,
    profession,
    is_enabled,
  };
}

// ajuda a filtrar perfis por nome/slug (case-insensitive)
export function profileMatches(
  p: ProfileItem,
  allowedNamesUpper: readonly string[],
  allowedSlugsLower: readonly string[]
) {
  const name = (p.name || "").trim().toUpperCase();
  const slug = (p.slug || p.key || "").trim().toLowerCase();

  if (allowedNamesUpper.includes(name as any)) return true;
  if (slug && allowedSlugsLower.includes(slug as any)) return true;

  return false;
}
