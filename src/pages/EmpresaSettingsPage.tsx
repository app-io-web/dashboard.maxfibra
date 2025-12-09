// src/pages/EmpresaSettingsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ACCESS_TOKEN_KEY } from "../lib/api";

import { EmpresaUsers } from "../components/empresa/EmpresaUsers";
import {
  EmpresaSettingsEditForm,
  type EmpresaSettings,
} from "../components/empresa/EmpresaSettingsEditForm";
import { EmpresaHeader } from "../components/empresa/EmpresaHeader";
import { EmpresaAtualCard } from "../components/empresa/EmpresaAtualCard";
import { EmpresasUsuarioList } from "../components/empresa/EmpresasUsuarioList";
import { CreateEmpresaModal } from "../components/empresa/CreateEmpresaModal";

import {
  canAccessEmpresaSettings,
  type EmpresaSettingsActionId,
} from "../config/empresaSettingsPermissions";

import {
  canAccessGlobalSettings,
  type GlobalSettingsActionId,
} from "../config/globalSettingsPermissions";

type EmpresaSettingsResponse = {
  empresaSettings: EmpresaSettings | null;
  permission_keys?: string[];        // perms da área Empresa Settings
  global_permission_keys?: string[]; // perms da área Global Settings
};

type EmpresaWithRole = EmpresaSettings & { role?: string; is_enabled?: boolean };
type EmpresasUsuarioResponse = { empresas: EmpresaWithRole[] };

export function EmpresaSettingsPage() {
  const [empresa, setEmpresa] = useState<EmpresaSettings | null>(null);
  const [empresasUsuario, setEmpresasUsuario] = useState<EmpresaWithRole[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);

  // 👇 null = backend não mandou nada (feature desligada)
  const [globalPermissionKeys, setGlobalPermissionKeys] = useState<
    string[] | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newEmpresaName, setNewEmpresaName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [resEmpresaAtual, resEmpresasUsuario] = await Promise.all([
          api.get<EmpresaSettingsResponse>("/empresa/settings"),
          api.get<EmpresasUsuarioResponse>("/usuario/empresas"),
        ]);

        if (!isMounted) return;

        const empresaAtual = resEmpresaAtual.data.empresaSettings;
        if (!empresaAtual) {
          setError(
            "Nenhuma configuração de empresa encontrada para este usuário."
          );
          setEmpresa(null);
        } else {
          setEmpresa(empresaAtual);
        }

        setPermissionKeys(resEmpresaAtual.data.permission_keys || []);

        // 👇 se o backend mandou o campo, usamos; se nem existir, deixamos null
        if (
          Object.prototype.hasOwnProperty.call(
            resEmpresaAtual.data,
            "global_permission_keys"
          )
        ) {
          setGlobalPermissionKeys(
            resEmpresaAtual.data.global_permission_keys || []
          );
        } else {
          setGlobalPermissionKeys(null);
        }

        // 👉 ajuda pra debugar, pode deixar um tempo
        console.log(
          "[EMPRESA SETTINGS] global_permission_keys ->",
          resEmpresaAtual.data.global_permission_keys
        );

        const lista = resEmpresasUsuario.data.empresas || [];
        setEmpresasUsuario(lista);

        const roleAtual =
          lista.find(
            (e) => e.auth_empresa_id === empresaAtual?.auth_empresa_id
          )?.role || null;
        setCurrentRole(roleAtual);
      } catch (err: any) {
        console.error(err);
        if (!isMounted) return;
        setError(
          err?.response?.data?.error ||
            "Erro ao carregar informações da empresa."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 🔥 título dinâmico da aba com base na empresa atual
  useEffect(() => {
    if (empresa?.display_name) {
      document.title = `${empresa.display_name} • Central Admin`;
    } else {
      document.title = "Central Admin";
    }
  }, [empresa]);


  // helper para montar a URL absoluta da logo
function buildLogoUrl(raw?: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const base = api.defaults.baseURL || "";
  return base.replace(/\/$/, "") + (raw.startsWith("/") ? raw : `/${raw}`);
}

// troca o favicon dinamicamente
function updateFavicon(url: string) {
  let link = document.querySelector("link[rel='icon']");

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "icon");
    document.head.appendChild(link);
  }

  link.setAttribute("href", url);
}

// efeito para atualizar o favicon
useEffect(() => {
  if (empresa?.logo_url) {
    const finalUrl = buildLogoUrl(empresa.logo_url);
    updateFavicon(finalUrl);
  } else {
    // fallback padrão (se quiser colocar algo)
    updateFavicon("/vite.svg");
  }
}, [empresa]);


  const handleSavedEmpresa = (updated: EmpresaSettings) => {
    setEmpresa(updated);
    setIsEditing(false);
    setEmpresasUsuario((prev) =>
      prev.map((e) =>
        e.auth_empresa_id === updated.auth_empresa_id ? { ...e, ...updated } : e
      )
    );
  };

  async function handleCreateEmpresa() {
    if (!newEmpresaName.trim()) {
      setCreateError("Informe um nome para a empresa.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.post<{ empresaSettings: EmpresaSettings }>(
        "/empresas",
        {
          display_name: newEmpresaName.trim(),
        }
      );
      const created = res.data.empresaSettings;
      setEmpresa(created);
      setError(null);

      const listRes =
        await api.get<EmpresasUsuarioResponse>("/usuario/empresas");
      setEmpresasUsuario(listRes.data.empresas || []);
      setCreateModalOpen(false);
      setNewEmpresaName("");
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || "Erro ao criar empresa.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSwitchEmpresa(authEmpresaId: string) {
    try {
      const res = await api.post("/auth/switch-empresa", {
        empresaId: authEmpresaId,
      });
      const newToken = res.data.accessToken;
      if (newToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      }
      window.location.reload();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao trocar de empresa.");
    }
  }

  const outrasEmpresas = empresasUsuario.filter(
    (e) => e.auth_empresa_id !== empresa?.auth_empresa_id
  );

  const isOwner = currentRole === "OWNER";

  const can = (action: EmpresaSettingsActionId) => {
    if (isOwner) return true;
    return canAccessEmpresaSettings(permissionKeys, action);
  };

  const canGlobal = (action: GlobalSettingsActionId) =>
    canAccessGlobalSettings(globalPermissionKeys || [], action);

  // WRITE (ações que realmente alteram estado)
  const canCreateEmpresa = can("create_empresa");
  const canEditDados = can("edit_empresa_dados");
  const canEditUsuarios = can("edit_empresa_usuarios");
  const canUsarEmpresa = can("usar_empresa");
  const canVincularOutros = can("vincular_outros");

  // 🔥 Gerenciar usuários: WRITE = interação, VIEW = só ver tela/botão
  const canManageUsersWrite = can("gerenciar_usuarios");
  const canManageUsersView =
    can("gerenciar_usuarios_view") || canManageUsersWrite;

  // VIEW (VIEW || WRITE) -> quem pode criar/editar também enxerga
  const canViewCreateEmpresa =
    can("create_empresa_view") || canCreateEmpresa;
  const canViewEditDados =
    can("edit_empresa_dados_view") || canEditDados;
  const canViewEditUsuarios =
    can("edit_empresa_usuarios_view") || canEditUsuarios;
  const canViewUsarEmpresa = can("usar_empresa_view") || canUsarEmpresa;
  const canViewVincularOutros =
    can("vincular_outros_view") || canVincularOutros;

  /**
   * 👇 Regra final:
   * - se globalPermissionKeys === null  → backend não sabe dessa feature → NÃO filtra dev (true)
   * - se veio array (vazio ou com itens) → usa RBAC certinho
   */
  const canViewDevsUsers =
    globalPermissionKeys === null ? true : canGlobal("view_devs_users");

  return (
    <div className="space-y-4">
      <EmpresaHeader
        onOpenCreateModal={() => {
          if (canCreateEmpresa) setCreateModalOpen(true);
        }}
        canCreateEmpresa={canViewCreateEmpresa}
      />

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Carregando dados da empresa...
        </div>
      )}

      {!loading && error && !empresa && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-700 flex flex-col gap-3">
          <div>{error}</div>
          <p className="text-xs text-slate-500">
            Você pode criar uma nova empresa agora para começar a utilizar a
            central.
          </p>
        </div>
      )}

      {!loading && !error && empresa && (
        <EmpresaAtualCard
          empresa={empresa}
          isEditing={isEditing}
          onStartEdit={() => {
            if (canEditDados) setIsEditing(true);
          }}
          onCancelEdit={() => setIsEditing(false)}
          onSaved={handleSavedEmpresa}
          onGoToUsers={() => {
            if (canManageUsersWrite) navigate("/empresa-users");
          }}
          currentRole={currentRole}
          canViewEditButton={canViewEditDados}
          canViewUsersButton={canManageUsersView}
        />
      )}

      {!loading && outrasEmpresas.length > 0 && (
        <EmpresasUsuarioList
          empresas={outrasEmpresas}
          onSwitchEmpresa={handleSwitchEmpresa}
          canUseEmpresa={canUsarEmpresa}
          canViewUseEmpresa={canViewUsarEmpresa}
        />
      )}

      {canManageUsersView && (
        <EmpresaUsers
          currentRole={currentRole}
          canEditUsers={canManageUsersWrite}
          canViewVincularOutros={canViewVincularOutros}
          canVincularOutros={canVincularOutros}
          canViewDevsUsers={canViewDevsUsers}
        />
      )}

      <CreateEmpresaModal
        open={createModalOpen}
        creating={creating}
        newEmpresaName={newEmpresaName}
        createError={createError}
        onClose={() => {
          if (!creating) setCreateModalOpen(false);
          setCreateError(null);
        }}
        onChangeName={setNewEmpresaName}
        onCreate={handleCreateEmpresa}
      />
    </div>
  );
}
