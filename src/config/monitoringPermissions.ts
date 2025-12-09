// src/config/monitoringPermissions.ts

export type MonitoringPermissionConfig = {
  key: string;
  label: string;
  description: string;
};

// 🔑 mapa de keys “oficiais” da área Monitoramento
export const MONITORING_PERMISSION_KEYS = {
  // acesso geral
  ALL: "monitoring_acess_all",

  // ONUs desligadas (SmartOLT - ONU OFF)
  SMART_OLT_ONU_VIEW: "monitoring_smart_olt_onu_viewer",
  SMART_OLT_ONU_WRITE: "monitoring_smart_olt_onu_writer",

  // ONUs em LOS (SmartOLT - LOS)
  SMART_OLT_LOS_VIEW: "monitoring_smart_olt_los_viewer",
  SMART_OLT_LOS_WRITE: "monitoring_smart_olt_los_writer",

  // Frequência - permissão geral de tela
  FREQUENCY_MODIFY_VIEW: "monitoring_acess_modify_FRQ_Automacao_viewer",
  FREQUENCY_MODIFY_WRITE: "monitoring_acess_modify_FRQ_Automacao_writer",

  // Frequência - grupos de opções
  FREQUENCY_SELECT_ALL_VIEW: "monitoring_acess_select_FRQ_AUTO_ALL_viewer",
  FREQUENCY_SELECT_ALL_WRITE: "monitoring_acess_select_FRQ_AUTO_ALL_writer",

  FREQUENCY_SELECT_30M_1H_VIEW: "monitoring_acess_select_FRQ_AUTO_30m_1H_viewer",
  FREQUENCY_SELECT_30M_1H_WRITE:
    "monitoring_acess_select_FRQ_AUTO_30m_1H_writer",

  FREQUENCY_SELECT_2H_4H_24H_VIEW:
    "monitoring_acess_select_FRQ_AUTO_2H_4H_24H_viewer",
  FREQUENCY_SELECT_2H_4H_24H_WRITE:
    "monitoring_acess_select_FRQ_AUTO_2H_4H_24H_writer",

  // Ordenação (mais tempo / menos tempo)
  ORDERING_VIEW: "monitoring_acess_ordenacao_viewer",
  ORDERING_WRITE: "monitoring_acess_ordenacao_writer",

  // Botão de Relatório detalhado IXC
  REPORT_IXC_VIEW: "monitoring_acess_relatorio_ixc_viewer",
  REPORT_IXC_WRITE: "monitoring_acess_relatorio_ixc_writer",
} as const;

export const monitoringPermissionsConfig: MonitoringPermissionConfig[] = [
  {
    key: MONITORING_PERMISSION_KEYS.ALL,
    label: "Acesso total ao monitoramento",
    description:
      "Usuário pode visualizar e alterar todas as automações e telas de monitoramento.",
  },

  // ----- SMART OLT - ONUs desligadas -----
  {
    key: MONITORING_PERMISSION_KEYS.SMART_OLT_ONU_VIEW,
    label: "Ver ONUs desligadas",
    description:
      "Permite acessar a tela de ONUs desligadas (SmartOLT) e visualizar os registros.",
  },
  {
    key: MONITORING_PERMISSION_KEYS.SMART_OLT_ONU_WRITE,
    label: "Alterar ONUs desligadas",
    description:
      "Permite alterar a frequência da automação e executar manualmente o monitoramento de ONUs desligadas.",
  },

  // ----- SMART OLT - LOS -----
  {
    key: MONITORING_PERMISSION_KEYS.SMART_OLT_LOS_VIEW,
    label: "Ver ONUs em LOS",
    description:
      "Permite acessar a tela de ONUs em LOS (SmartOLT) e visualizar os registros.",
  },
  {
    key: MONITORING_PERMISSION_KEYS.SMART_OLT_LOS_WRITE,
    label: "Alterar ONUs em LOS",
    description:
      "Permite alterar a frequência da automação e executar manualmente o monitoramento de ONUs em LOS.",
  },

  // ----- Frequências (tela geral) -----
  {
    key: MONITORING_PERMISSION_KEYS.FREQUENCY_MODIFY_VIEW,
    label: "Ver configurações de frequência",
    description:
      "Permite visualizar as opções de frequência das automações de monitoramento.",
  },
  {
    key: MONITORING_PERMISSION_KEYS.FREQUENCY_MODIFY_WRITE,
    label: "Alterar configurações de frequência",
    description:
      "Permite alterar as frequências configuradas nas automações de monitoramento.",
  },

  // ----- Frequências (grupos) -----
  {
    key: MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_ALL_VIEW,
    label: "Ver todas as frequências",
    description:
      "Permite visualizar todas as opções de frequência disponíveis.",
  },
  {
    key: MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_ALL_WRITE,
    label: "Editar todas as frequências",
    description:
      "Permite alterar qualquer frequência (30min, 1h, 2h, 4h, 24h).",
  },

  {
    key: MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_30M_1H_VIEW,
    label: "Ver 30min e 1h",
    description:
      "Permite visualizar apenas as frequências de 30 minutos e 1 hora.",
  },
  {
    key: MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_30M_1H_WRITE,
    label: "Editar 30min e 1h",
    description:
      "Permite alterar apenas as frequências de 30 minutos e 1 hora.",
  },

  {
    key: MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_2H_4H_24H_VIEW,
    label: "Ver 2h, 4h e 24h",
    description:
      "Permite visualizar apenas as frequências de 2 horas, 4 horas e 24 horas.",
  },
  {
    key: MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_2H_4H_24H_WRITE,
    label: "Editar 2h, 4h e 24h",
    description:
      "Permite alterar apenas as frequências de 2 horas, 4 horas e 24 horas.",
  },

  // ----- Ordenação -----
  {
    key: MONITORING_PERMISSION_KEYS.ORDERING_VIEW,
    label: "Ver opções de ordenação",
    description:
      "Permite visualizar os botões de ordenação (mais tempo / menos tempo).",
  },
  {
    key: MONITORING_PERMISSION_KEYS.ORDERING_WRITE,
    label: "Alterar ordenação",
    description:
      "Permite alternar entre os modos de ordenação dos cards.",
  },

  // ----- Botão Relatório detalhado IXC -----
  {
    key: MONITORING_PERMISSION_KEYS.REPORT_IXC_VIEW,
    label: "Visualizar Botão de Relatório detalhado",
    description:
      "Permissão de Visualização de botão de Relatório detalhado - Monitoramento.",
  },
  {
    key: MONITORING_PERMISSION_KEYS.REPORT_IXC_WRITE,
    label: "Modificação Botão de Relatório detalhado",
    description:
      "Permissão de Modificação de botão de Relatório detalhado - Monitoramento.",
  },
];

// --------- RESOLUÇÃO PRONTA PRO FRONT (a partir das perms que vêm no login) ---------

export type MonitoringResolvedPermissions = {
  // menu geral
  canViewMonitoringSection: boolean;

  // ONUs desligadas
  canViewSmartOltOnu: boolean;
  canEditSmartOltOnu: boolean; // frequência + executar agora

  // ONUs em LOS
  canViewSmartOltLos: boolean;
  canEditSmartOltLos: boolean; // frequência + executar agora

  // Frequências (grupos de chips)
  canViewFrequencyAll: boolean;
  canViewFrequency30m1h: boolean;
  canViewFrequency2h4h24h: boolean;

  canEditFrequencyAll: boolean;
  canEditFrequency30m1h: boolean;
  canEditFrequency2h4h24h: boolean;

  canViewAnyFrequency: boolean;
  canEditAnyFrequency: boolean;

  // Ordenação
  canViewOrdering: boolean;
  canEditOrdering: boolean;

  // Botão Relatório detalhado IXC
  canViewIxcReportButton: boolean;
  canEditIxcReportButton: boolean;
};

export function resolveMonitoringPermissions(
  userPermissionKeys: string[]
): MonitoringResolvedPermissions {
  const set = new Set(userPermissionKeys);

  const has = (key: string) =>
    set.has(key) || set.has(MONITORING_PERMISSION_KEYS.ALL);

  // base de visualização das telas
  const baseCanEditOnu = has(MONITORING_PERMISSION_KEYS.SMART_OLT_ONU_WRITE);
  const canViewSmartOltOnu =
    baseCanEditOnu || has(MONITORING_PERMISSION_KEYS.SMART_OLT_ONU_VIEW);

  const baseCanEditLos = has(MONITORING_PERMISSION_KEYS.SMART_OLT_LOS_WRITE);
  const canViewSmartOltLos =
    baseCanEditLos || has(MONITORING_PERMISSION_KEYS.SMART_OLT_LOS_VIEW);

  // frequências – regras por grupo
  const canViewFrequencyAll =
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_ALL_VIEW) ||
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_ALL_WRITE);

  const canEditFrequencyAll = has(
    MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_ALL_WRITE
  );

  const canViewFrequency30m1h =
    canViewFrequencyAll ||
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_30M_1H_VIEW) ||
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_30M_1H_WRITE);

  const canEditFrequency30m1h =
    canEditFrequencyAll ||
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_30M_1H_WRITE);

  const canViewFrequency2h4h24h =
    canViewFrequencyAll ||
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_2H_4H_24H_VIEW) ||
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_2H_4H_24H_WRITE);

  const canEditFrequency2h4h24h =
    canEditFrequencyAll ||
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_SELECT_2H_4H_24H_WRITE);

  // permissão geral de “tela de frequência”
  const canViewFrequencyGlobal =
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_MODIFY_VIEW) ||
    has(MONITORING_PERMISSION_KEYS.FREQUENCY_MODIFY_WRITE);

  const canEditFrequencyGlobal = has(
    MONITORING_PERMISSION_KEYS.FREQUENCY_MODIFY_WRITE
  );

  const canViewAnyFrequency =
    canViewFrequencyGlobal ||
    canViewFrequencyAll ||
    canViewFrequency30m1h ||
    canViewFrequency2h4h24h;

  const canEditAnyFrequency =
    canEditFrequencyGlobal ||
    canEditFrequencyAll ||
    canEditFrequency30m1h ||
    canEditFrequency2h4h24h;

  // Ordenação
  const canViewOrdering =
    has(MONITORING_PERMISSION_KEYS.ORDERING_VIEW) ||
    has(MONITORING_PERMISSION_KEYS.ORDERING_WRITE);

  const canEditOrdering = has(MONITORING_PERMISSION_KEYS.ORDERING_WRITE);

  // Botão Relatório detalhado IXC
  const canEditIxcReportButton = has(
    MONITORING_PERMISSION_KEYS.REPORT_IXC_WRITE
  );
  const canViewIxcReportButton =
    canEditIxcReportButton ||
    has(MONITORING_PERMISSION_KEYS.REPORT_IXC_VIEW);

  // Edit das telas: ou a permissão específica da tela, ou qualquer perm de edição de frequência
  const canEditSmartOltOnu = baseCanEditOnu || canEditAnyFrequency;
  const canEditSmartOltLos = baseCanEditLos || canEditAnyFrequency;

  const canViewMonitoringSection =
    canViewSmartOltOnu || canViewSmartOltLos || canViewIxcReportButton;

  return {
    canViewMonitoringSection,
    canViewSmartOltOnu,
    canEditSmartOltOnu,
    canViewSmartOltLos,
    canEditSmartOltLos,

    canViewFrequencyAll,
    canViewFrequency30m1h,
    canViewFrequency2h4h24h,

    canEditFrequencyAll,
    canEditFrequency30m1h,
    canEditFrequency2h4h24h,

    canViewAnyFrequency,
    canEditAnyFrequency,

    canViewOrdering,
    canEditOrdering,

    canViewIxcReportButton,
    canEditIxcReportButton,
  };
}
