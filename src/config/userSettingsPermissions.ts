// src/config/userSettingsPermissions.ts

export type UserSettingsPermissionConfig = {
  key: string;
  label: string;
  description: string;
};

export const USER_SETTINGS_PERMISSION_KEYS = {
  // acesso geral
  ALL: "user_settings_acess_all",

  // Cargo / função
  POSITION_FUNCTION_WRITE: "user_settings_position_function_writer",
  POSITION_FUNCTION_VIEW: "user_settings_position_function_viewer",

  // Data de nascimento
  BIRTH_WRITE: "user_settings_birth_writer",
  BIRTH_VIEW: "user_settings_birth_viewer",

  // Nome de exibição
  NAME_EXHIBILITY_WRITE: "user_settings_name_exibilibty_writer",
  NAME_EXHIBILITY_VIEW: "user_settings_name_exibilibty_viewer",

  // URL do avatar
  AVATAR_URL_WRITE: "user_settings_url_avatar_writer",
  AVATAR_URL_VIEW: "user_settings_url_avatar_viewer",
} as const;

export const USER_SETTINGS_PERMISSIONS: UserSettingsPermissionConfig[] = [
  {
    label: "Acesso Total de Visualização e Criação",
    key: USER_SETTINGS_PERMISSION_KEYS.ALL,
    description: "Permissão total de visualização e criação em User Settings.",
  },

  {
    label: "Editar Campo de Cargo / Função - User Settings - CRIAÇÃO",
    key: USER_SETTINGS_PERMISSION_KEYS.POSITION_FUNCTION_WRITE,
    description:
      "Permite editar o campo de Cargo / Função nas configurações de usuário.",
  },
  {
    label: "Visualizar Campo de Cargo / Função - User Settings - VISUALIZAÇÃO",
    key: USER_SETTINGS_PERMISSION_KEYS.POSITION_FUNCTION_VIEW,
    description:
      "Permite visualizar o campo de Cargo / Função nas configurações de usuário.",
  },

  {
    label: "Editar Campo de Data de Nascimento - User Settings - CRIAÇÃO",
    key: USER_SETTINGS_PERMISSION_KEYS.BIRTH_WRITE,
    description:
      "Permite editar o campo de Data de Nascimento nas configurações de usuário.",
  },
  {
    label:
      "Visualizar Campo de Data de Nascimento - User Settings - VISUALIZAÇÃO",
    key: USER_SETTINGS_PERMISSION_KEYS.BIRTH_VIEW,
    description:
      "Permite visualizar o campo de Data de Nascimento nas configurações de usuário.",
  },

  {
    label: "Editar Campo de Nome de Exibição - User Settings - CRIAÇÃO",
    key: USER_SETTINGS_PERMISSION_KEYS.NAME_EXHIBILITY_WRITE,
    description:
      "Permite editar o campo de Nome de Exibição nas configurações de usuário.",
  },
  {
    label:
      "Visualizar Campo de Nome de Exibição - User Settings - VISUALIZAÇÃO",
    key: USER_SETTINGS_PERMISSION_KEYS.NAME_EXHIBILITY_VIEW,
    description:
      "Permite visualizar o campo de Nome de Exibição nas configurações de usuário.",
  },

  {
    label: "Editar Campo de URL do Avatar - User Settings - CRIAÇÃO",
    key: USER_SETTINGS_PERMISSION_KEYS.AVATAR_URL_WRITE,
    description:
      "Permite editar o campo de URL do Avatar nas configurações de usuário.",
  },
  {
    label:
      "Visualizar Campo de URL do Avatar - User Settings - VISUALIZAÇÃO",
    key: USER_SETTINGS_PERMISSION_KEYS.AVATAR_URL_VIEW,
    description:
      "Permite visualizar o campo de URL do Avatar nas configurações de usuário.",
  },
];
export function buildUserSettingsPermissionFlags(userPermissionKeys: string[]) {
  const has = (key: string) =>
    userPermissionKeys.includes(key) ||
    userPermissionKeys.includes(USER_SETTINGS_PERMISSION_KEYS.ALL);

  return {
    // Nome de exibição
    canViewDisplayName:
      has(USER_SETTINGS_PERMISSION_KEYS.NAME_EXHIBILITY_VIEW) ||
      has(USER_SETTINGS_PERMISSION_KEYS.NAME_EXHIBILITY_WRITE),
    canEditDisplayName: has(
      USER_SETTINGS_PERMISSION_KEYS.NAME_EXHIBILITY_WRITE
    ),

    // Avatar
    canViewAvatarUrl:
      has(USER_SETTINGS_PERMISSION_KEYS.AVATAR_URL_VIEW) ||
      has(USER_SETTINGS_PERMISSION_KEYS.AVATAR_URL_WRITE),
    canEditAvatarUrl: has(USER_SETTINGS_PERMISSION_KEYS.AVATAR_URL_WRITE),

    // Cargo / função
    canViewProfession:
      has(USER_SETTINGS_PERMISSION_KEYS.POSITION_FUNCTION_VIEW) ||
      has(USER_SETTINGS_PERMISSION_KEYS.POSITION_FUNCTION_WRITE),
    canEditProfession: has(
      USER_SETTINGS_PERMISSION_KEYS.POSITION_FUNCTION_WRITE
    ),

    // Data de nascimento
    canViewBirth:
      has(USER_SETTINGS_PERMISSION_KEYS.BIRTH_VIEW) ||
      has(USER_SETTINGS_PERMISSION_KEYS.BIRTH_WRITE),
    canEditBirth: has(USER_SETTINGS_PERMISSION_KEYS.BIRTH_WRITE),
  };
}
