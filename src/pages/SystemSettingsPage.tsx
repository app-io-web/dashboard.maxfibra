// src/pages/SystemSettingsPage.tsx
import { useState } from "react";
import { DashboardConfigSection } from "../components/system-config/DashboardConfigSection";
import { SystemToolsSection } from "../components/system-config/SystemToolsSection";
import { UserPermissionToolsSection } from "../components/system-config/UserPermissionToolsSection";
import { MonitoringSmartOltSection } from "../components/system-config/MonitoringSmartOltSection";
import { UserPermissionRbacSection } from "../components/system-config/UserPermissionRbacSection";
import { SystemPermissionProfilesSection } from "../components/system-config/SystemPermissionProfilesSection";

import {
  Cog,
  LayoutDashboard,
  Wrench,
  KeyRound,
  Activity,
  ShieldCheck,
  Users,
} from "lucide-react";

type SystemSettingsTab = "dashboard" | "tools" | "monitoring";
type ToolsSubTab =
  | "tools-main"
  | "user-permissions"
  | "user-permissions-rbac"
  | "permission-profiles";

export function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<SystemSettingsTab>("dashboard");
  const [activeToolsSubTab, setActiveToolsSubTab] =
    useState<ToolsSubTab>("tools-main");

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600">
          <Cog className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Configurações do sistema
          </h1>
          <p className="text-sm text-slate-600">
            Ajustes globais que impactam o painel.
          </p>
        </div>
      </header>

      {/* Abas principais (white theme) */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition
              ${
                activeTab === "dashboard"
                  ? "bg-white text-slate-900 border-b-2 border-cyan-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tools")}
            className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition
              ${
                activeTab === "tools"
                  ? "bg-white text-slate-900 border-b-2 border-cyan-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <Wrench className="h-4 w-4" />
            Ferramentas avançadas
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("monitoring")}
            className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition
              ${
                activeTab === "monitoring"
                  ? "bg-white text-slate-900 border-b-2 border-cyan-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <Activity className="h-4 w-4" />
            Monitoramento
          </button>
        </nav>
      </div>

      {/* Conteúdo */}
      <div className="mt-2 space-y-6">
        {activeTab === "dashboard" && <DashboardConfigSection />}

        {activeTab === "tools" && (
          <>
            {/* SUB-OPÇÕES DAS FERRAMENTAS */}
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
                {/* Ferramentas avançadas */}
                <button
                  type="button"
                  onClick={() => setActiveToolsSubTab("tools-main")}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition
                    ${
                      activeToolsSubTab === "tools-main"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <Wrench className="h-3 w-3" />
                  Ferramentas avançadas
                </button>

                {/* Permissão de usuário (ANTIGA, continua igual) */}
                <button
                  type="button"
                  onClick={() => setActiveToolsSubTab("user-permissions")}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition
                    ${
                      activeToolsSubTab === "user-permissions"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <KeyRound className="h-3 w-3" />
                  Permissão de usuário
                </button>

                {/* Permissões RBAC */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveToolsSubTab("user-permissions-rbac")
                  }
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition
                    ${
                      activeToolsSubTab === "user-permissions-rbac"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <ShieldCheck className="h-3 w-3" />
                  Permissões RBAC
                </button>

                {/* NOVO: Perfis de permissão */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveToolsSubTab("permission-profiles")
                  }
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition
                    ${
                      activeToolsSubTab === "permission-profiles"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <Users className="h-3 w-3" />
                  Perfis de permissão
                </button>
              </div>
            </div>

            {/* CONTEÚDO DAS SUB-OPÇÕES */}
            {activeToolsSubTab === "tools-main" && <SystemToolsSection />}

            {activeToolsSubTab === "user-permissions" && (
              <UserPermissionToolsSection />
            )}

            {activeToolsSubTab === "user-permissions-rbac" && (
              <UserPermissionRbacSection />
            )}

            {activeToolsSubTab === "permission-profiles" && (
              <SystemPermissionProfilesSection />
            )}
          </>
        )}

        {activeTab === "monitoring" && <MonitoringSmartOltSection />}
      </div>
    </div>
  );
}
