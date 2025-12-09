// src/config/sidebarMenuPermissions.ts

// 🔑 Todas as chaves possíveis de permissão do menu lateral
export const MENU_PERMISSION_KEYS = {
  BIRTHDAY: "acess_menu_opt_Birthday",
  SHORTCUTS: "acess_menu_opt_Shotcurts",
  DASHBOARD: "acess_menu_opt_Dashboard",
  BUSINESS: "acess_menu_opt_business",
  TOOLS: "acess_menu_opt_Tools",
  ME_USER: "acess_menu_opt_me_user",
  MONITORING: "acess_menu_opt_Monitoring",
  PASSWORDS: "acess_menu_opt_Password",
  INTERNAL_SERVICES: "acess_menu_opt_Internal_Services",
  SERVICES: "acess_menu_opt_Services",
  NOTES: "acess_menu_opt_Notes",         
  HELPDESK: "acess_menu_opt_HelpDesk",
  ALL: "acess_menu_opt_All",
} as const;

export type MenuPermissionKey =
  (typeof MENU_PERMISSION_KEYS)[keyof typeof MENU_PERMISSION_KEYS];

export type MenuPermissionDefinition = {
  key: MenuPermissionKey;
  label: string;
  description: string;
};

// 📋 Tabela amigável pra usar na tela de configuração de permissões
export const MENU_PERMISSIONS: MenuPermissionDefinition[] = [
  {
    label: "Visualizar Aniversariantes - Menu Lateral",
    key: MENU_PERMISSION_KEYS.BIRTHDAY,
    description: "Permite a visualização da opção Aniversariantes no menu lateral.",
  },
  {
    label: "Visualizar Atalhos - Menu Lateral",
    key: MENU_PERMISSION_KEYS.SHORTCUTS,
    description: "Permite a visualização da opção Atalhos no menu lateral.",
  },
  {
    label: "Visualizar Dashboard - Menu Lateral",
    key: MENU_PERMISSION_KEYS.DASHBOARD,
    description: "Permite a visualização da opção Dashboard no menu lateral.",
  },
  {
    label: "Visualizar Empresa - Menu Lateral",
    key: MENU_PERMISSION_KEYS.BUSINESS,
    description: "Permite a visualização da opção Empresa no menu lateral.",
  },
  {
    label: "Visualizar Ferramentas - Menu Lateral",
    key: MENU_PERMISSION_KEYS.TOOLS,
    description: "Permite a visualização da opção Ferramentas no menu lateral.",
  },
  {
    label: "Visualizar Meu Usuário - Menu Lateral",
    key: MENU_PERMISSION_KEYS.ME_USER,
    description: "Permite a visualização da opção Meu Usuário no menu lateral.",
  },
  {
    label: "Visualizar Monitoramento - Menu Lateral",
    key: MENU_PERMISSION_KEYS.MONITORING,
    description: "Permite a visualização da opção Monitoramento no menu lateral.",
  },
  {
    label: "Visualizar Senhas - Menu Lateral",
    key: MENU_PERMISSION_KEYS.PASSWORDS,
    description: "Permite a visualização da opção Senhas no menu lateral.",
  },
  {
    label: "Visualizar Serviços Internos - Menu Lateral",
    key: MENU_PERMISSION_KEYS.INTERNAL_SERVICES,
    description: "Permite a visualização da opção Serviços Internos no menu lateral.",
  },
  {
    label: "Visualizar Serviços - Menu Lateral",
    key: MENU_PERMISSION_KEYS.SERVICES,
    description: "Permite a visualização da opção Serviços no menu lateral.",
  },
  {
    label: "Visualizar Suporte - Menu Lateral",
    key: MENU_PERMISSION_KEYS.HELPDESK,
    description: "Permite a visualização da opção Suporte no menu lateral.",
  },
  {
    label: "Visualizar Todas as Opções - Menu Lateral",
    key: MENU_PERMISSION_KEYS.ALL,
    description:
      "Permite a visualização de todas as opções do menu lateral (ignora as permissões individuais).",
  },
  {
    label: "Visualizar Notas - Menu Lateral",
    key: MENU_PERMISSION_KEYS.NOTES,
    description: "Permite a visualização da opção Notas no menu lateral.",
  },

];

// (Opcional) Mapeamento rota -> permissão, pra facilitar uso na Sidebar
export const ROUTE_MENU_PERMISSION: Record<string, MenuPermissionKey> = {
  "/": MENU_PERMISSION_KEYS.DASHBOARD,
  "/user-settings": MENU_PERMISSION_KEYS.ME_USER,
  "/empresa-settings": MENU_PERMISSION_KEYS.BUSINESS,
  "/monitoramento": MENU_PERMISSION_KEYS.MONITORING,
  "/services": MENU_PERMISSION_KEYS.SERVICES,
  "/internal-services": MENU_PERMISSION_KEYS.INTERNAL_SERVICES,
  "/shortcuts": MENU_PERMISSION_KEYS.SHORTCUTS,
  "/passwords": MENU_PERMISSION_KEYS.PASSWORDS,
  "/aniversariantes": MENU_PERMISSION_KEYS.BIRTHDAY,
  "/support": MENU_PERMISSION_KEYS.HELPDESK,
  "/notes": MENU_PERMISSION_KEYS.NOTES,           
};
