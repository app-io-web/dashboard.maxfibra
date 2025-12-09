// src/components/layout/AppLayout.tsx
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NewFichaPopup } from "../notifications/NewFichaPopup";
import { SmartOltAutomationPopup } from "../notifications/SmartOltAutomationPopup";
import { api } from "../../lib/api";
import type { EmpresaSettings } from "../empresa/EmpresaSettingsEditForm";

// só o que a gente precisa pro branding
type EmpresaBranding = Pick<EmpresaSettings, "display_name" | "logo_url">;

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [empresa, setEmpresa] = useState<EmpresaBranding | null>(null);

  // helper pra montar URL absoluta da logo
  function buildLogoUrl(raw?: string | null): string {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

    const base = api.defaults.baseURL || "";
    return base.replace(/\/$/, "") + (raw.startsWith("/") ? raw : `/${raw}`);
  }

  // trocar favicon dinamicamente
  function updateFavicon(url: string) {
    let link =
      document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
      document.createElement("link");

    link.rel = "icon";
    link.href = url;
    if (!link.parentNode) {
      document.head.appendChild(link);
    }
  }

  // busca empresa atual só pra branding (título + favicon)
  useEffect(() => {
    let isMounted = true;

    async function fetchEmpresaBranding() {
      try {
        const res = await api.get<{ empresaSettings: EmpresaSettings | null }>(
          "/empresa/settings"
        );
        if (!isMounted) return;

        if (res.data.empresaSettings) {
          const { display_name, logo_url } = res.data.empresaSettings;
          setEmpresa({ display_name, logo_url });
        } else {
          setEmpresa(null);
        }
      } catch (err) {
        console.error("[AppLayout] Erro ao carregar empresa para branding:", err);
        if (isMounted) {
          setEmpresa(null);
        }
      }
    }

    fetchEmpresaBranding();

    return () => {
      isMounted = false;
    };
  }, []);

  // título da aba baseado na empresa atual
  useEffect(() => {
    if (empresa?.display_name) {
      document.title = `${empresa.display_name} • Central Admin`;
    } else {
      document.title = "Central Admin";
    }
  }, [empresa?.display_name]);

  // favicon baseado na logo da empresa (ou fallback)
  useEffect(() => {
    if (empresa?.logo_url) {
      const url = buildLogoUrl(empresa.logo_url);
      updateFavicon(url);
    } else {
      // fallback padrão
      updateFavicon("/vite.svg");
    }
  }, [empresa?.logo_url]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      {/* Sidebar some/aparece conforme o estado */}
      {isSidebarOpen && <Sidebar />}

      <div className="flex-1 flex flex-col">
        <Topbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <NewFichaPopup />
            <SmartOltAutomationPopup />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
