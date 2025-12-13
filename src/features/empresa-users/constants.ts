// ✅ ID GLOBAL DO JOTA (auth_user_id) — NÃO MOSTRAR PRA NINGUÉM, SÓ PRA ELE MESMO
export const GOD_USER_ID = "a736e9f5-72e0-4faa-946c-8c5a62b6bb77";

export const ROLES = ["OWNER", "ADMIN", "MANAGER", "OPERATOR", "VIEWER"] as const;

export const PROFESSION_PRESETS = [
  "Financeiro",
  "Atendente",
  "Gerente",
  "Atendente de loja",
  "Terceirizado"
] as const;

export const ALLOWED_PROFILE_SLUGS = [
  "perfil_loja_operador",
  "perfil_atendimento_suporte",
] as const;

export const ALLOWED_PROFILE_NAMES = [
  "Atendente de Loja",
  "Atendente de Suporte - Acessos",
] as const;
