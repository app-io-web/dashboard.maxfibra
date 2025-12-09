// src/config/servicePagePermissions.ts

export type ServicePageResolvedPermissions = {
  // Acesso geral
  canViewPage: boolean;

  // Abas
  canViewDashboardTab: boolean;
  canViewBlockedTab: boolean;

  // Dashboard IXC - cards
  canViewContractsCard: boolean;
  canViewInternetNormalCard: boolean;
  canViewInternetBlockedCard: boolean;
  canOpenBlockedFromDashboard: boolean;
  canViewChart: boolean;

  // Aba IXC Internet Bloqueados
  canViewBlockedTable: boolean;
  canViewGenerateReportButton: boolean;
  canTriggerGenerateReport: boolean;
  canViewDownloadReportButton: boolean;
  canDownloadReport: boolean;

  // Controles de frequência da automação
  canViewIntervalControls: boolean;
  canViewInterval30m1h: boolean;
  canEditInterval30m1h: boolean;
  canViewInterval2h4h24h: boolean;
  canEditInterval2h4h24h: boolean;
};

export function resolveServicePagePermissions(
  permissionKeys: string[]
): ServicePageResolvedPermissions {
  const set = new Set(permissionKeys);
  const has = (key: string) => set.has(key);

  const canViewDashboardTab = has("services_page_DASH_IXC_viewer");
  const canViewBlockedTab = has("services_page_INTERNET_BLOCK__viewer");

  const canViewPage = canViewDashboardTab || canViewBlockedTab;

  // Dashboard IXC
  const canViewContractsCard = has("services_page_DASH_IXC_CONTRATOS_viewer");
  const canViewInternetNormalCard = has(
    "services_page_DASH_IXC_INTERNET_NORMAL_viewer"
  );
  const canViewInternetBlockedCard = has(
    "services_page_DASH_IXC_BLOCK_INTERNET_viewer"
  );
  const canOpenBlockedFromDashboard = has(
    "services_page_DASH_IXC_BLOCK_INTERNET_write"
  );
  const canViewChart = has("services_page_GRAPH_viewer");

  // Aba IXC Internet Bloqueados
  const canViewBlockedTable = has(
    "services_page_INTERNET_BLOCK_TABLE_CLIENTES_viewer"
  );

  const canViewGenerateReportButton = has(
    "services_page_INTERNET_BLOCK_Gerar_Relatorio_viewer"
  );
  const canTriggerGenerateReport = has(
    "services_page_INTERNET_BLOCK_Gerar_Relatorio_write"
  );

  const canViewDownloadReportButton = has(
    "services_page_INTERNET_BLOCK_Download_Relatorio_viewer"
  );
  const canDownloadReport = has(
    "services_page_INTERNET_BLOCK_Download_Relatorio_write"
  );

  // Controles de frequência
  const canViewIntervalControls = has("services_page_FRQ_AUTO_all_viewer");

  const canViewInterval30m1h = has("services_page_FRQ_AUTO_30m_1H_viewer");
  const canEditInterval30m1h = has("services_page_FRQ_AUTO_30m_1H_write");

  const canViewInterval2h4h24h = has("services_page_FRQ_AUTO_2H_4H_24H_viewer");
  const canEditInterval2h4h24h = has("services_page_FRQ_AUTO_2H_4H_24H_write");

  return {
    canViewPage,

    canViewDashboardTab,
    canViewBlockedTab,

    canViewContractsCard,
    canViewInternetNormalCard,
    canViewInternetBlockedCard,
    canOpenBlockedFromDashboard,
    canViewChart,

    canViewBlockedTable,
    canViewGenerateReportButton,
    canTriggerGenerateReport,
    canViewDownloadReportButton,
    canDownloadReport,

    canViewIntervalControls,
    canViewInterval30m1h,
    canEditInterval30m1h,
    canViewInterval2h4h24h,
    canEditInterval2h4h24h,
  };
}
