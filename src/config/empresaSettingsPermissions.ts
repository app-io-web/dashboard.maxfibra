// src/config/empresaSettingsPermissions.ts

export type EmpresaSettingsPermissionConfig = {
  key: string;
  label: string;
  description: string;
};

// 🔑 mapa de keys “oficiais” da área Empresa Settings
export const EMPRESA_SETTINGS_PERMISSION_KEYS = {
  ALL: "acess_modify_business_data_all",

  EDIT_DATA_WRITE: "acess_modify_editing_business_data_writer",
  EDIT_DATA_VIEW: "acess_modify_editing_business_data_viewer",

  EDIT_USERS_WRITE: "acess_modify_editing_users_business_writer",
  EDIT_USERS_VIEW: "acess_modify_editing_users_business_viewer",

  USE_EMPRESA_WRITE: "acess_modify_using_business_writer",
  USE_EMPRESA_VIEW: "acess_modify_using_business_viewer",

  BIND_OTHERS_WRITE: "acess_modify_bind_others_business_writer",
  BIND_OTHERS_VIEW: "acess_modify_bind_others_business_viewer",

  // ⬇️ trocamos o antigo *_read por writer/viewer
  MANAGE_USERS_WRITE: "acess_modify_management_business_users_writer",
  MANAGE_USERS_VIEW: "acess_modify_management_business_users_viewer",

  CREATE_EMPRESA_WRITE: "acess_modify_create_business_writer",
  CREATE_EMPRESA_VIEW: "acess_modify_create_business_viewer",
} as const;

export type PermissionKey =
  (typeof EMPRESA_SETTINGS_PERMISSION_KEYS)[keyof typeof EMPRESA_SETTINGS_PERMISSION_KEYS];

// ⚙️ Config usado na tela de configuração das permissões da área
export const EMPRESA_SETTINGS_PERMISSIONS: EmpresaSettingsPermissionConfig[] = [
  {
    label:
      "Acesso do button Editar dados da empresa - Empresa Settings - CRIAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.EDIT_DATA_WRITE,
    description:
      "Permissão de Acesso ao Botão Editar dados da empresa - Empresa Settings",
  },
  {
    label:
      "Acesso do button Editar usuarios da empresa - Empresa Settings - CRIAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.EDIT_USERS_WRITE,
    description:
      "Permissão de Acesso do Botão Editar usuarios da empresa - Empresa Settings",
  },
  {
    label:
      "Acesso do button Usar esta empresa - Empresa Settings - CRIAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.USE_EMPRESA_WRITE,
    description:
      "Permissão de Acesso ao Botão Usar esta empresa - Empresa Settings",
  },
  {
    label:
      "Acesso do button Vincular em outras empresas - Empresa Settings - CRIAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.BIND_OTHERS_WRITE,
    description:
      "Permissão de Acesso do Botão Vincular em outras empresas - Empresa Settings",
  },

  // 🆕 Gerenciar usuários (CRIAÇÃO / VISUALIZAÇÃO)
  {
    label:
      "Acesso do button Gerenciar Usuarios dessa empresa - Empresa Settings - CRIAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.MANAGE_USERS_WRITE,
    description:
      "Permissão de Acesso ao Botão Gerenciar usuarios dessa empresa - Empresa Settings",
  },
  {
    label:
      "Gerencia de usuarios da empresa - Empresa Settings - VISUALIZAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.MANAGE_USERS_VIEW,
    description:
      "Permissão de Acesso de Leitura Gerencia de Empresa - Empresa Settings",
  },

  {
    label: "Opção Criar Empresa - Empresa Settings - CRIAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.CREATE_EMPRESA_WRITE,
    description:
      "Permissão de Acesso de Criação de Empresa - Empresa Settings",
  },
  {
    label: "Permissão de Acesso Total - Empresa Settings",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.ALL,
    description: "Permissão Total de Acesso - Empresa Settings",
  },
  {
    label:
      "Visualização do button Criar Empresa - Empresa Settings - VISUALIZAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.CREATE_EMPRESA_VIEW,
    description:
      "Permissão de Visualização do Botão Criar Empresa - Empresa Settings",
  },
  {
    label:
      "Visualização do button Editar dados da empresa - Empresa Settings - VISUALIZAÇÃO",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.EDIT_DATA_VIEW,
    description:
      "Permissão de Visualização do Botão Editar dados da empresa - Empresa Settings",
  },
  {
    label:
      "Visualização do button Editar usuarios da empresa - Empresa Settings - LEITURA",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.EDIT_USERS_VIEW,
    description:
      "Permissão de Visualização do Botão Editar usuarios da empresa - Empresa Settings",
  },
  {
    label:
      "Visualização do button Usar esta empresa - Empresa Settings - LEITURA",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.USE_EMPRESA_VIEW,
    description:
      "Permissão de Visualização do Botão Usar esta empresa - Empresa Settings",
  },
  {
    label:
      "Visualização do button Vincular em outras empresas - Empresa Settings - LEITURA",
    key: EMPRESA_SETTINGS_PERMISSION_KEYS.BIND_OTHERS_VIEW,
    description:
      "Permissão de Visualização do Botão Vincular em outras empresas - Empresa Settings",
  },
];

// 🎯 ações semânticas que o front vai checar
export type EmpresaSettingsActionId =
  | "create_empresa"
  | "create_empresa_view"
  | "edit_empresa_dados"
  | "edit_empresa_dados_view"
  | "edit_empresa_usuarios"
  | "edit_empresa_usuarios_view"
  | "usar_empresa"
  | "usar_empresa_view"
  | "vincular_outros"
  | "vincular_outros_view"
  | "gerenciar_usuarios"
  | "gerenciar_usuarios_view";

// mapa de ação -> permissão necessária
const EMPRESA_ACTION_REQUIRED_PERMISSION: Record<
  EmpresaSettingsActionId,
  PermissionKey
> = {
  create_empresa: EMPRESA_SETTINGS_PERMISSION_KEYS.CREATE_EMPRESA_WRITE,
  create_empresa_view: EMPRESA_SETTINGS_PERMISSION_KEYS.CREATE_EMPRESA_VIEW,

  edit_empresa_dados: EMPRESA_SETTINGS_PERMISSION_KEYS.EDIT_DATA_WRITE,
  edit_empresa_dados_view: EMPRESA_SETTINGS_PERMISSION_KEYS.EDIT_DATA_VIEW,

  edit_empresa_usuarios: EMPRESA_SETTINGS_PERMISSION_KEYS.EDIT_USERS_WRITE,
  edit_empresa_usuarios_view: EMPRESA_SETTINGS_PERMISSION_KEYS.EDIT_USERS_VIEW,

  usar_empresa: EMPRESA_SETTINGS_PERMISSION_KEYS.USE_EMPRESA_WRITE,
  usar_empresa_view: EMPRESA_SETTINGS_PERMISSION_KEYS.USE_EMPRESA_VIEW,

  vincular_outros: EMPRESA_SETTINGS_PERMISSION_KEYS.BIND_OTHERS_WRITE,
  vincular_outros_view: EMPRESA_SETTINGS_PERMISSION_KEYS.BIND_OTHERS_VIEW,

  // aqui a ação de fato (CRUD) e a visualização da tela
  gerenciar_usuarios: EMPRESA_SETTINGS_PERMISSION_KEYS.MANAGE_USERS_WRITE,
  gerenciar_usuarios_view: EMPRESA_SETTINGS_PERMISSION_KEYS.MANAGE_USERS_VIEW,
};

// 💡 mesma ideia do canAccessInternalServices
export function canAccessEmpresaSettings(
  userPermissions: string[] | undefined,
  action: EmpresaSettingsActionId
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;

  // super permissão da área
  if (userPermissions.includes(EMPRESA_SETTINGS_PERMISSION_KEYS.ALL)) {
    return true;
  }

  const key = EMPRESA_ACTION_REQUIRED_PERMISSION[action];
  if (!key) return false;

  return userPermissions.includes(key);
}
