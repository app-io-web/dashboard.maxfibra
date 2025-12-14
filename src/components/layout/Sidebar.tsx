// src/components/layout/Sidebar.tsx
import React, { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserCog,
  Building2,
  Server,
  Cog,
  Bookmark,
  StickyNote,
  KeyRound,
  CalendarHeart,
  Wrench,
  Activity,
  ChevronRight,
  Briefcase,
  LifeBuoy,
  Lock,
} from "lucide-react";

import { EmpresaSwitcher } from "./EmpresaSwitcher";
import {
  MENU_PERMISSION_KEYS,
  type MenuPermissionKey,
} from "../../config/sidebarMenuPermissions";

// ✅ CONTEXTO só pro menu normal
import { useSession } from "../../contexts/SessionContext";

// ✅ "modo antigo" SOMENTE pro System Config (igual você pediu)
import { getCurrentUser } from "../../lib/auth";

type SidebarItem = {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  permissionKey?: MenuPermissionKey;
};

const items: SidebarItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    permissionKey: MENU_PERMISSION_KEYS.DASHBOARD,
  },
  {
    to: "/user-settings",
    label: "Meu Usuário",
    icon: UserCog,
    permissionKey: MENU_PERMISSION_KEYS.ME_USER,
  },
  {
    to: "/empresa-settings",
    label: "Empresa",
    icon: Building2,
    permissionKey: MENU_PERMISSION_KEYS.BUSINESS,
  },
  {
    to: "/monitoramento",
    label: "Monitoramento",
    icon: Activity,
    permissionKey: MENU_PERMISSION_KEYS.MONITORING,
  },
  {
    to: "/services",
    label: "Serviços",
    icon: Cog,
    permissionKey: MENU_PERMISSION_KEYS.SERVICES,
  },
  {
    to: "/internal-services",
    label: "Serviços Internos",
    icon: Server,
    permissionKey: MENU_PERMISSION_KEYS.INTERNAL_SERVICES,
  },
  {
    to: "/shortcuts",
    label: "Atalhos",
    icon: Bookmark,
    permissionKey: MENU_PERMISSION_KEYS.SHORTCUTS,
  },
  {
    to: "/notes",
    label: "Notas",
    icon: StickyNote,
    permissionKey: MENU_PERMISSION_KEYS.NOTES,
  },
  {
    to: "/passwords",
    label: "Senhas",
    icon: KeyRound,
    permissionKey: MENU_PERMISSION_KEYS.PASSWORDS,
  },
  {
    to: "/aniversariantes",
    label: "Aniversariantes",
    icon: CalendarHeart,
    permissionKey: MENU_PERMISSION_KEYS.BIRTHDAY,
  },
  {
    to: "/support",
    label: "Suporte",
    icon: LifeBuoy,
    permissionKey: MENU_PERMISSION_KEYS.HELPDESK,
  },
];

const toolsItems = [
  { to: "/tools/cnpj-consultor", label: "Consultor de CNPJ" },
  { to: "/tools/cep-consultor", label: "Consultor de CEP" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Sidebar() {
  const location = useLocation();
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // ✅ vindo do contexto (menu normal)
  const { permissions, permissionsLoading } = useSession();

  const userPermissions = useMemo(
    () => (Array.isArray(permissions) ? permissions : []),
    [permissions]
  );

  const hasAllMenuAccess = userPermissions.includes(MENU_PERMISSION_KEYS.ALL);

  const hasMenuPermission = (key?: MenuPermissionKey) => {
    if (!key) return true;
    if (hasAllMenuAccess) return true;
    return userPermissions.includes(key);
  };

  // ✅ "Configuração do Sistema" IDÊNTICO AO ANTIGO: não depende do contexto
  const legacyUser = getCurrentUser();
  const canManageSystemConfig = !!(legacyUser as any)?.can_manage_system_config;

  const isToolsSectionActive = toolsItems.some((tool) =>
    location.pathname.startsWith(tool.to)
  );
  const canSeeToolsSection = hasMenuPermission(MENU_PERMISSION_KEYS.TOOLS);

  return (
    <aside className="h-full w-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
      {/* HEADER COM SWITCHER DE EMPRESA */}
      <div className="border-b border-slate-800">
        <EmpresaSwitcher />
      </div>

      {/* NAV PRINCIPAL */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const allowed = hasMenuPermission(item.permissionKey);

          // Enquanto carrega permissões, mostra mas “trava”
          const disabled = permissionsLoading ? true : !allowed;

          if (disabled) {
            return (
              <div
                key={item.to}
                title={
                  permissionsLoading
                    ? "Carregando permissões..."
                    : "Sem permissão"
                }
                className={cx(
                  "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                  "text-slate-500 bg-slate-900/30 border border-slate-800/70",
                  "cursor-not-allowed select-none"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
                  <Lock className="w-4 h-4 opacity-80" />
                </div>
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition",
                  isActive
                    ? "bg-slate-800 text-brand-100 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* FERRAMENTAS */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              if (permissionsLoading) return;
              if (!canSeeToolsSection) return;
              setIsToolsOpen((prev) => !prev);
            }}
            title={
              permissionsLoading
                ? "Carregando permissões..."
                : !canSeeToolsSection
                ? "Sem permissão"
                : ""
            }
            className={cx(
              "relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition group",
              (isToolsSectionActive || isToolsOpen) && canSeeToolsSection
                ? "bg-slate-800/80 text-cyan-200 shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
              (permissionsLoading || !canSeeToolsSection) &&
                "opacity-60 cursor-not-allowed hover:bg-transparent hover:text-slate-300"
            )}
          >
            {(isToolsSectionActive || isToolsOpen) && canSeeToolsSection && (
              <span className="pointer-events-none absolute inset-y-1 left-0 w-[3px] rounded-full bg-gradient-to-b from-cyan-400 to-blue-400" />
            )}

            <div className="flex items-center gap-2 pl-[2px]">
              <Briefcase className="w-4 h-4" />
              <span>Ferramentas</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
              <span className="rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] text-slate-300">
                {toolsItems.length} utilitários
              </span>

              {permissionsLoading || !canSeeToolsSection ? (
                <Lock className="w-4 h-4 opacity-80" />
              ) : (
                <ChevronRight
                  className={cx(
                    "w-4 h-4 opacity-80 transition-transform",
                    isToolsOpen || isToolsSectionActive ? "rotate-90" : ""
                  )}
                />
              )}
            </div>
          </button>

          {canSeeToolsSection &&
            !permissionsLoading &&
            (isToolsOpen || isToolsSectionActive) && (
              <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 shadow-inner">
                <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-slate-500">
                  Utilitários rápidos
                </div>

                <div className="pb-2 space-y-0.5">
                  {toolsItems.map((tool) => (
                    <NavLink
                      key={tool.to}
                      to={tool.to}
                      className={({ isActive }) =>
                        cx(
                          "group flex items-center justify-between gap-2 px-3 py-1.5 text-xs rounded-lg transition",
                          isActive
                            ? "bg-slate-800/90 text-cyan-200 border border-cyan-500/70 shadow-sm"
                            : "text-slate-400 border border-transparent hover:border-cyan-500/40 hover:bg-slate-900 hover:text-slate-100"
                        )
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 group-hover:bg-blue-400/90 transition" />
                        <span>{tool.label}</span>
                      </div>

                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 group-hover:text-cyan-300">
                        abrir
                      </span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* ✅ CONFIG DO SISTEMA (admin) — idêntico ao antigo */}
        {canManageSystemConfig && (
          <NavLink
            to="/system-config"
            className={({ isActive }) =>
              cx(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition mt-4 border-t border-slate-800 pt-3",
                isActive
                  ? "bg-slate-800 text-blue-200"
                  : "text-blue-400 hover:bg-slate-800 hover:text-blue-200"
              )
            }
          >
            <Wrench className="w-4 h-4" />
            <span>Configuração do Sistema</span>
          </NavLink>
        )}
      </nav>

      <div className="p-3 text-xs text-slate-500 border-t border-slate-800">
        v0.1 • ambiente dev
      </div>
    </aside>
  );
}
