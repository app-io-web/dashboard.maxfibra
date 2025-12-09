// src/pages/InternalServicesPage.tsx
import { useState, useMemo } from "react";
import { Server, Database } from "lucide-react";

import { ClientesCadastradosSection } from "../components/internal-services/ClientesCadastradosSection";
import { PlanosEmpresariaisSection } from "../components/internal-services/PlanosEmpresariaisSection";
import { FraseDinamicaSection } from "../components/internal-services/FraseDinamicaSection";
import { DuvidasFrequentesSection } from "../components/internal-services/DuvidasFrequentesSection";
import { BannerSitePrincipalSection } from "../components/internal-services/BannerSitePrincipalSection";
import { BannersEmpresariaisSection } from "../components/internal-services/BannersEmpresariaisSection";
import { ServicosAdicionaisConfiguracoesSection } from "../components/internal-services/ServicosAdicionaisConfiguracoesSection";
import { ServicosAdicionaisPlanosSection } from "../components/internal-services/ServicosAdicionaisPlanosSection";
import { CadastroVendedoresSection } from "../components/internal-services/CadastroVendedoresSection";
import { ContatoSection } from "../components/internal-services/ContatoSection";
import { CuponsDescontoSection } from "../components/internal-services/CuponsDescontoSection";

import {
  canAccessInternalServices,
  type SiteSubTabId,
} from "../config/internalServicesPermissions";

import { getCurrentUser } from "../lib/auth";

// 🔐 agora esse “hook” usa o usuário salvo no localStorage
function useUserPermissions(): string[] {
  const user = getCurrentUser();
  return user?.permissions ?? [];
}

type MainTab = "Site" | "devops" | "sistemas";
type SubTab = string;

export function InternalServicesPage() {
  const [activeMain, setActiveMain] = useState<MainTab>("Site");
  const [activeSub, setActiveSub] = useState<SubTab>("clientes_cadastrados");

  const userPermissions = useUserPermissions();

  const SUB_TABS: Record<MainTab, string[]> = {
    Site: [
      "clientes_cadastrados",
      "planos_empresariais",
      "frase_dinamica",
      "duvidas_frequentes",
      "banners",
      "banners_empresariais",
      "servicos_adicionais_configuracoes",
      "servicos_adicionais_planos",
      "cadastro_vendedores",
      "contato",
      "gerador_de_cupons",
    ],
    devops: ["pipelines", "deploy", "monitoramento"],
    sistemas: ["auth", "emails", "templates", "integracoes"],
  };

  function prettySubLabel(sub: string): string {
    if (sub === "clientes_cadastrados") return "Clientes Cadastrados";
    if (sub === "planos_empresariais") return "Planos Empresariais";
    if (sub === "frase_dinamica") return "Frase Dinâmica";
    if (sub === "duvidas_frequentes") return "Dúvidas Frequentes";
    if (sub === "banners") return "Banners Site Principal";
    if (sub === "banners_empresariais") return "Banners Empresariais";
    if (sub === "servicos_adicionais_configuracoes")
      return "Configurações de Serviços Adicionais";
    if (sub === "servicos_adicionais_planos")
      return "Planos × Serviços Adicionais";
    if (sub === "cadastro_vendedores") return "Vendedores";
    if (sub === "contato") return "Contato do Site";
    if (sub === "gerador_de_cupons") return "Gerador de Cupons";

    return sub.charAt(0).toUpperCase() + sub.slice(1);
  }

  // 🔐 sub-abas visíveis pra MAIN atual, baseado em permissão
  const visibleSiteSubTabs = useMemo(() => {
    if (activeMain !== "Site") return [];

    return SUB_TABS.Site.filter((sub) =>
      canAccessInternalServices(
        userPermissions,
        "Site",
        sub as SiteSubTabId
      )
    );
  }, [activeMain, userPermissions]);

  // se a aba ativa não tiver permissão, troca para a primeira permitida
  const effectiveActiveSub: SubTab = useMemo(() => {
    if (activeMain === "Site") {
      const hasAccess = canAccessInternalServices(
        userPermissions,
        "Site",
        activeSub as SiteSubTabId
      );

      if (!hasAccess) {
        return visibleSiteSubTabs[0] ?? activeSub;
      }
    }

    return activeSub;
  }, [activeMain, activeSub, userPermissions, visibleSiteSubTabs]);

  function renderContent() {
    // bloqueia logo no começo
    if (
      activeMain === "Site" &&
      !canAccessInternalServices(
        userPermissions,
        "Site",
        effectiveActiveSub as SiteSubTabId
      )
    ) {
      return (
        <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Você não tem permissão para acessar esta seção de Serviços Internos.
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "planos_empresariais") {
      return (
        <div className="mt-6">
          <PlanosEmpresariaisSection />
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "clientes_cadastrados") {
      return (
        <div className="mt-6">
          <ClientesCadastradosSection />
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "frase_dinamica") {
      return (
        <div className="mt-6">
          <FraseDinamicaSection />
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "duvidas_frequentes") {
      return (
        <div className="mt-6">
          <DuvidasFrequentesSection />
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "banners") {
      return (
        <div className="mt-6">
          <BannerSitePrincipalSection />
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "banners_empresariais") {
      return (
        <div className="mt-6">
          <BannersEmpresariaisSection />
        </div>
      );
    }

    if (
      activeMain === "Site" &&
      effectiveActiveSub === "servicos_adicionais_configuracoes"
    ) {
      return (
        <div className="mt-6">
          <ServicosAdicionaisConfiguracoesSection />
        </div>
      );
    }

    if (
      activeMain === "Site" &&
      effectiveActiveSub === "servicos_adicionais_planos"
    ) {
      return (
        <div className="mt-6">
          <ServicosAdicionaisPlanosSection />
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "cadastro_vendedores") {
      return (
        <div className="mt-6">
          <CadastroVendedoresSection />
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "contato") {
      return (
        <div className="mt-6">
          <ContatoSection />
        </div>
      );
    }

    if (activeMain === "Site" && effectiveActiveSub === "gerador_de_cupons") {
      return (
        <div className="mt-6">
          <CuponsDescontoSection />
        </div>
      );
    }

    return (
      <div className="mt-6 rounded-2xl bg-white/90 p-6 shadow-md border border-slate-200">
        <p className="text-slate-600 text-sm">
          Conteúdo da sub-aba:
          <span className="font-semibold text-emerald-600">
            {" "}
            {effectiveActiveSub}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-emerald-500 text-white shadow">
          <Server className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Serviços Internos
          </h1>
          <p className="text-sm text-slate-500">
            Configuração de Site e ferramentas internas!
          </p>
        </div>
      </header>

      {/* ABAS PRINCIPAIS – por enquanto só "Site" */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {[{ id: "Site", label: "Site", icon: Database }].map(
          ({ id, label, icon: Icon }) => {
            const isActive = activeMain === id;

            return (
              <button
                key={id}
                onClick={() => {
                  const mainId = id as MainTab;
                  setActiveMain(mainId);

                  if (mainId === "Site" && visibleSiteSubTabs.length > 0) {
                    setActiveSub(visibleSiteSubTabs[0]);
                  } else {
                    setActiveSub(SUB_TABS[mainId][0]);
                  }
                }}
                className={[
                  "px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 transition",
                  isActive
                    ? "bg-white text-emerald-600 border border-slate-200 border-b-transparent shadow-sm"
                    : "text-slate-500 hover:text-emerald-600",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          }
        )}
      </div>

      {/* SUB-ABAS */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {activeMain === "Site" && visibleSiteSubTabs.length === 0 && (
          <span className="text-xs text-slate-400">
            Nenhuma seção do Site disponível para o seu usuário.
          </span>
        )}

        {activeMain === "Site" &&
          visibleSiteSubTabs.map((sub) => {
            const isActive = effectiveActiveSub === sub;

            return (
              <button
                key={sub}
                onClick={() => setActiveSub(sub)}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-medium transition",
                  isActive
                    ? "bg-emerald-500 text-white shadow"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                ].join(" ")}
              >
                {prettySubLabel(sub)}
              </button>
            );
          })}
      </div>

      {/* CONTEÚDO */}
      {renderContent()}
    </div>
  );
}
