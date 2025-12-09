// src/config/globalSettingsPermissions.ts

export type GlobalSettingsPermissionConfig = {
  key: string;
  label: string;
  description: string;
};

// 🔑 mapa de keys “oficiais” da área GLOBAL SETTINGS
export const GLOBAL_SETTINGS_PERMISSION_KEYS = {
  ALL: "acess_modify_global_settings_all",

  // ver / listar usuários developers
  VIEW_DEVS_USERS_VIEW: "acess_modify_viewer_devs_users_viewer",

  // notificações (modais internos / automações / site)
  NOTIFY_BIRTHDAY: "modal_notify_visualizer_brithday",
  NOTIFY_LOS: "modal_notify_visualizer_loss",
  NOTIFY_NEW_REGISTER: "modal_notify_visualizer_new_register",
  NOTIFY_POWER_OFF: "modal_notify_visualizer_powerOff",
} as const;

export type GlobalPermissionKey =
  (typeof GLOBAL_SETTINGS_PERMISSION_KEYS)[keyof typeof GLOBAL_SETTINGS_PERMISSION_KEYS];

// ⚙️ Config usado na tela de configuração das permissões da área GLOBAL
export const GLOBAL_SETTINGS_PERMISSIONS: GlobalSettingsPermissionConfig[] = [
  {
    label:
      "Notificação de Aniversariante do Dia - Modal Interno",
    key: GLOBAL_SETTINGS_PERMISSION_KEYS.NOTIFY_BIRTHDAY,
    description:
      "Controla se o usuário vai receber a notificação do Aniversariante do Dia.",
  },
  {
    label: "Notificação de LOS - AUTOMAÇÃO",
    key: GLOBAL_SETTINGS_PERMISSION_KEYS.NOTIFY_LOS,
    description:
      "Controla se o usuário vai receber a notificação de LOS da automação.",
  },
  {
    label: "Notificação de Nova Ficha - Site",
    key: GLOBAL_SETTINGS_PERMISSION_KEYS.NOTIFY_NEW_REGISTER,
    description:
      "Controla se o usuário vai receber a notificação de um novo cadastro vindo do site.",
  },
  {
    label: "Notificação de Power OFF - AUTOMAÇÃO",
    key: GLOBAL_SETTINGS_PERMISSION_KEYS.NOTIFY_POWER_OFF,
    description:
      "Controla se o usuário vai receber a notificação de Power Off da automação.",
  },
  {
    label:
      "Visualização do usuários developers | desenvolvedores - LEITURA",
    key: GLOBAL_SETTINGS_PERMISSION_KEYS.VIEW_DEVS_USERS_VIEW,
    description:
      "Permissão de Visualização dos desenvolvedores - Global Settings.",
  },
  {
    label: "Permissão de Acesso Total - Global Settings",
    key: GLOBAL_SETTINGS_PERMISSION_KEYS.ALL,
    description: "Permissão Total de Acesso - Global Settings.",
  },
];

// 🎯 ações semânticas que o front vai checar
export type GlobalSettingsActionId =
  | "view_devs_users"
  | "notify_birthday"
  | "notify_los"
  | "notify_new_register"
  | "notify_power_off";

// mapa de ação -> permissão necessária
const GLOBAL_ACTION_REQUIRED_PERMISSION: Record<
  GlobalSettingsActionId,
  GlobalPermissionKey
> = {
  view_devs_users: GLOBAL_SETTINGS_PERMISSION_KEYS.VIEW_DEVS_USERS_VIEW,
  notify_birthday: GLOBAL_SETTINGS_PERMISSION_KEYS.NOTIFY_BIRTHDAY,
  notify_los: GLOBAL_SETTINGS_PERMISSION_KEYS.NOTIFY_LOS,
  notify_new_register: GLOBAL_SETTINGS_PERMISSION_KEYS.NOTIFY_NEW_REGISTER,
  notify_power_off: GLOBAL_SETTINGS_PERMISSION_KEYS.NOTIFY_POWER_OFF,
};

// 💡 helper igual aos outros arquivos
export function canAccessGlobalSettings(
  userPermissions: string[] | undefined,
  action: GlobalSettingsActionId
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;

  // super permissão da área
  if (userPermissions.includes(GLOBAL_SETTINGS_PERMISSION_KEYS.ALL)) {
    return true;
  }

  const key = GLOBAL_ACTION_REQUIRED_PERMISSION[action];
  if (!key) return false;

  return userPermissions.includes(key);
}
