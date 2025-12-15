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

import { useSession } from "../../contexts/SessionContext";
import { getCurrentUser } from "../../lib/auth";

type SidebarItem = {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  permissionKey?: MenuPermissionKey;
};

const LICENSE_ALLOWED_PREFIXES = ["/system/licenses"];

const items: SidebarItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, permissionKey: MENU_PERMISSION_KEYS.DASHBOARD },
  { to: "/user-settings", label: "Meu Usuário", icon: UserCog, permissionKey: MENU_PERMISSION_KEYS.ME_USER },
  { to: "/empresa-settings", label: "Empresa", icon: Building2, permissionKey: MENU_PERMISSION_KEYS.BUSINESS },
  { to: "/monitoramento", label: "Monitoramento", icon: Activity, permissionKey: MENU_PERMISSION_KEYS.MONITORING },
  { to: "/services", label: "Serviços", icon: Cog, permissionKey: MENU_PERMISSION_KEYS.SERVICES },
  { to: "/internal-services", label: "Serviços Internos", icon: Server, permissionKey: MENU_PERMISSION_KEYS.INTERNAL_SERVICES },
  { to: "/shortcuts", label: "Atalhos", icon: Bookmark, permissionKey: MENU_PERMISSION_KEYS.SHORTCUTS },
  { to: "/notes", label: "Notas", icon: StickyNote, permissionKey: MENU_PERMISSION_KEYS.NOTES },
  { to: "/passwords", label: "Senhas", icon: KeyRound, permissionKey: MENU_PERMISSION_KEYS.PASSWORDS },
  { to: "/aniversariantes", label: "Aniversariantes", icon: CalendarHeart, permissionKey: MENU_PERMISSION_KEYS.BIRTHDAY },
  { to: "/support", label: "Suporte", icon: LifeBuoy, permissionKey: MENU_PERMISSION_KEYS.HELPDESK },
];

const toolsItems = [
  { to: "/tools/cnpj-consultor", label: "Consultor de CNPJ" },
  { to: "/tools/cep-consultor", label: "Consultor de CEP" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isAllowedWhenBlocked(path: string) {
  return LICENSE_ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

export function Sidebar() {
  const location = useLocation();
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const {
    permissions,
    permissionsLoading,
    licenseBlocked,
  } = useSession();

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

  const legacyUser = getCurrentUser();
  const canManageSystemConfig = !!(legacyUser as any)?.can_manage_system_config;

  const isToolsSectionActive = toolsItems.some((tool) =>
    location.pathname.startsWith(tool.to)
  );

  const canSeeToolsSection = hasMenuPermission(MENU_PERMISSION_KEYS.TOOLS);
  const toolsBlockedByLicense = licenseBlocked && !isAllowedWhenBlocked("/tools");

  return (
    <aside className="h-full w-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
      <div className="border-b border-slate-800">
        <EmpresaSwitcher />
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const allowed = hasMenuPermission(item.permissionKey);
          const blockedByLicense =
            licenseBlocked && !isAllowedWhenBlocked(item.to);

          const disabled =
            permissionsLoading || !allowed || blockedByLicense;

          if (disabled) {
            return (
              <div
                key={item.to}
                title={
                  permissionsLoading
                    ? "Carregando permissões..."
                    : blockedByLicense
                    ? "Licença expirada ou não paga"
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
                <Lock className="w-4 h-4 opacity-80" />
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
              if (toolsBlockedByLicense) return;
              setIsToolsOpen((prev) => !prev);
            }}
            className={cx(
              "relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition",
              (isToolsSectionActive || isToolsOpen) && canSeeToolsSection
                ? "bg-slate-800/80 text-cyan-200"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
              (permissionsLoading || !canSeeToolsSection || toolsBlockedByLicense) &&
                "opacity-60 cursor-not-allowed hover:bg-transparent hover:text-slate-300"
            )}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Ferramentas</span>
            </div>

            {permissionsLoading || !canSeeToolsSection || toolsBlockedByLicense ? (
              <Lock className="w-4 h-4 opacity-80" />
            ) : (
              <ChevronRight
                className={cx(
                  "w-4 h-4 transition-transform",
                  isToolsOpen || isToolsSectionActive ? "rotate-90" : ""
                )}
              />
            )}
          </button>

          {!toolsBlockedByLicense &&
            canSeeToolsSection &&
            !permissionsLoading &&
            (isToolsOpen || isToolsSectionActive) && (
              <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70">
                {toolsItems.map((tool) => (
                  <NavLink
                    key={tool.to}
                    to={tool.to}
                    className="block px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    {tool.label}
                  </NavLink>
                ))}
              </div>
            )}
        </div>

        {/* SYSTEM CONFIG — modo antigo */}
        {canManageSystemConfig && (
          <NavLink
            to="/system-config"
            className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-slate-800 hover:text-blue-200"
          >
            <Wrench className="w-4 h-4" />
            <span>Configuração do Sistema</span>
          </NavLink>
        )}
      </nav>

      <div className="p-3 text-xs border-t border-slate-800 flex items-center justify-between">
        <NavLink
          to="/system/licenses"
          className="text-slate-400 hover:text-cyan-300 transition underline-offset-2 hover:underline"
        >
          Verificar licença
        </NavLink>

        <span className="text-slate-500">
          v1.0
        </span>
      </div>

    </aside>
  );
}
