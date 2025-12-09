// src/config/internalServicesPermissions.ts

export const INTERNAL_SERVICES_PERMISSION_KEYS = {
  SITE_MAIN: "acess_internal_services_Site",
  ALL: "acess_internal_services_All",

  SITE_GERADOR_CUPOM: "acess_internal_services_Site_GRD_CPM",
  SITE_CFG_PLANOS_ADICIONAIS: "acess_internal_services_Site_CFG_PLA_ADD",
  SITE_CLIENTES_CADASTRADOS: "acess_internal_services_Site_CC_CAD",
  SITE_VENDEDORES: "acess_internal_services_Site_VNDD",
  SITE_CONTATO: "acess_internal_services_Site_CTT",
  SITE_PLANOS_EMPRESARIAIS: "acess_internal_services_Site_P_EM",
  SITE_FRASE_DINAMICA: "acess_internal_services_Site_F_DNMC",
  SITE_DUVIDAS_FREQUENTES: "acess_internal_services_Site_D_FQT",
  SITE_BANNERS_EMPRESARIAIS: "acess_internal_services_Site_BNN_EMP",
  SITE_CFG_SERVICOS_ADICIONAIS: "acess_internal_services_Site_CFG_SERV_ADD",
  SITE_BANNERS_PRINCIPAL: "acess_internal_services_Site_BNN_PR",
} as const;

export type PermissionKey =
  (typeof INTERNAL_SERVICES_PERMISSION_KEYS)[keyof typeof INTERNAL_SERVICES_PERMISSION_KEYS];

export type SiteSubTabId =
  | "clientes_cadastrados"
  | "planos_empresariais"
  | "frase_dinamica"
  | "duvidas_frequentes"
  | "banners"
  | "banners_empresariais"
  | "servicos_adicionais_configuracoes"
  | "servicos_adicionais_planos"
  | "cadastro_vendedores"
  | "contato"
  | "gerador_de_cupons";

const SITE_SUB_TAB_REQUIRED_PERMISSION: Record<SiteSubTabId, PermissionKey> = {
  clientes_cadastrados:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_CLIENTES_CADASTRADOS,
  planos_empresariais:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_PLANOS_EMPRESARIAIS,
  frase_dinamica:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_FRASE_DINAMICA,
  duvidas_frequentes:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_DUVIDAS_FREQUENTES,
  banners:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_BANNERS_PRINCIPAL,
  banners_empresariais:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_BANNERS_EMPRESARIAIS,
  servicos_adicionais_configuracoes:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_CFG_SERVICOS_ADICIONAIS,
  servicos_adicionais_planos:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_CFG_PLANOS_ADICIONAIS,
  cadastro_vendedores:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_VENDEDORES,
  contato:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_CONTATO,
  gerador_de_cupons:
    INTERNAL_SERVICES_PERMISSION_KEYS.SITE_GERADOR_CUPOM,
};

export function canAccessInternalServices(
  userPermissions: string[] | undefined,
  mainTab: "Site",
  subTab: SiteSubTabId
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;

  // super permissão
  if (userPermissions.includes(INTERNAL_SERVICES_PERMISSION_KEYS.ALL)) {
    return true;
  }

  // precisa ter acesso à aba Site
  if (!userPermissions.includes(INTERNAL_SERVICES_PERMISSION_KEYS.SITE_MAIN)) {
    return false;
  }

  const key = SITE_SUB_TAB_REQUIRED_PERMISSION[subTab];
  if (!key) return false;

  return userPermissions.includes(key);
}
