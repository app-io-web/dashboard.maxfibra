import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import {
  KeyRound,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
} from "lucide-react";
import { AreaPermissionsModal } from "./AreaPermissionsModal";
import { UserPermissionAssignSection } from "./UserPermissionAssignSection";

type PermissionFormState = {
  key: string;
  label: string;
  description: string;
  area: string;
  viewer: boolean;
  creation: boolean;
  modification: boolean;
};

type Permission = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  area: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type UserPermissionSummary = {
  user_id: string;
  name: string;
  email: string;
  is_active?: boolean;
  permissions: {
    key: string;
    label: string | null;
    area: string | null;
    description?: string | null;
    assigned_at?: string | null;
  }[];
};

type RbacInnerTab = "catalog" | "assign" | "map";

/**
 * Aplica a lógica de Viewer / Criação / Modificação
 * nos sufixos de key e label.
 */
function applyPermissionMode(
  baseKey: string,
  baseLabel: string,
  mode: Pick<PermissionFormState, "viewer" | "creation" | "modification">
) {
  let finalKey = baseKey;
  let finalLabel = baseLabel;

  // limpa qualquer sufixo antigo
  finalKey = finalKey.replace(/_viewer$/, "").replace(/_write$/, "");
  finalLabel = finalLabel
    .replace(/ - VISUALIZAÇÃO$/, "")
    .replace(/ - CRIAÇÃO$/, "")
    .replace(/ - MODIFICAÇÃO$/, "");

  if (mode.viewer) {
    finalKey += "_viewer";
    finalLabel += " - VISUALIZAÇÃO";
  }

  if (mode.creation) {
    finalKey += "_write";
    finalLabel += " - CRIAÇÃO";
  }

  if (mode.modification) {
    finalKey += "_write";
    finalLabel += " - MODIFICAÇÃO";
  }

  return { finalKey, finalLabel };
}

export function UserPermissionRbacSection() {
  const [permForm, setPermForm] = useState<PermissionFormState>({
    key: "",
    label: "",
    description: "",
    area: "",
    viewer: false,
    creation: false,
    modification: false,
  });

  const [isSavingPerm, setIsSavingPerm] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  // estado do modal de áreas
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [areaModalArea, setAreaModalArea] = useState<string | null>(null);

  // 🔍 mapa de permissões por usuário
  const [userPerms, setUserPerms] = useState<UserPermissionSummary[]>([]);
  const [isLoadingUserPerms, setIsLoadingUserPerms] = useState(false);
  const [userPermsError, setUserPermsError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  // sub-aba interna do RBAC
  const [activeRbacTab, setActiveRbacTab] = useState<RbacInnerTab>("catalog");

  function resetMessages() {
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function fetchPermissions() {
    try {
      setIsLoadingPermissions(true);
      setPermissionsError(null);

      const response = await api.get("/tools/permissions");
      const data = response.data?.data || [];
      setPermissions(data);
    } catch (err: any) {
      console.error("[UserPermissionRbac] erro ao carregar permissões:", err);
      const apiError =
        err?.response?.data?.error || "Erro ao carregar catálogo de permissões.";
      setPermissionsError(apiError);
    } finally {
      setIsLoadingPermissions(false);
    }
  }

  async function fetchUserPermissionsMap() {
    try {
      setIsLoadingUserPerms(true);
      setUserPermsError(null);

      const response = await api.get("/tools/permissions/user-permissions-map");
      const data = response.data?.data || [];
      setUserPerms(data);
    } catch (err: any) {
      console.error(
        "[UserPermissionRbac] erro ao carregar mapa de permissões por usuário:",
        err
      );
      const apiError =
        err?.response?.data?.error ||
        "Erro ao carregar mapa de permissões por usuário.";
      setUserPermsError(apiError);
    } finally {
      setIsLoadingUserPerms(false);
    }
  }

  useEffect(() => {
    fetchPermissions();
    fetchUserPermissionsMap();
  }, []);

  // agrupar por área
  const areaGroups = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      const areaName = p.area || "Sem área definida";
      if (!groups[areaName]) groups[areaName] = [];
      groups[areaName].push(p);
    });
    return groups;
  }, [permissions]);

  const areaNames = useMemo(
    () => Object.keys(areaGroups).sort((a, b) => a.localeCompare(b)),
    [areaGroups]
  );

  function openAreaModal(area: string) {
    setAreaModalArea(area);
    setAreaModalOpen(true);
  }

  function closeAreaModal() {
    setAreaModalOpen(false);
    setAreaModalArea(null);
  }

  // quando clicar em "Usar essa permissão" no modal
  function handleSelectPermissionFromModal(permissionKey: string) {
    setSuccessMessage(
      `Permissão "${permissionKey}" selecionada no catálogo. Escolha ela no card de atribuição na aba "Atribuições".`
    );
    setAreaModalOpen(false);
    setActiveRbacTab("assign");
  }

  async function handleCreatePermission(e: FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!permForm.key || !permForm.label) {
      setErrorMessage("Preencha pelo menos a chave (key) e o nome (label).");
      return;
    }

    const baseKey = permForm.key.trim();
    const baseLabel = permForm.label.trim();

    const { finalKey, finalLabel } = applyPermissionMode(baseKey, baseLabel, {
      viewer: permForm.viewer,
      creation: permForm.creation,
      modification: permForm.modification,
    });

    try {
      setIsSavingPerm(true);

      await api.post("/tools/permissions", {
        key: finalKey,
        label: finalLabel,
        description: permForm.description.trim() || null,
        area: permForm.area.trim() || null,
      });

      setSuccessMessage(
        `Permissão "${finalKey}" salva/atualizada com sucesso.`
      );

      fetchPermissions();
      // opcional: recarregar mapa
      fetchUserPermissionsMap();
    } catch (err: any) {
      console.error("[UserPermissionRbac] erro ao salvar permissão:", err);
      const apiError =
        err?.response?.data?.error || "Erro ao salvar permissão.";
      setErrorMessage(apiError);
    } finally {
      setIsSavingPerm(false);
    }
  }

  // filtro de usuários no mapa
  const filteredUserPerms = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return userPerms;

    return userPerms.filter((u) => {
      const base = `${u.name || ""} ${u.email || ""}`.toLowerCase();

      const permsText = (u.permissions || [])
        .map(
          (p) =>
            `${p.key || ""} ${p.label || ""} ${p.area || ""}`.toLowerCase()
        )
        .join(" ");

      return base.includes(term) || permsText.includes(term);
    });
  }, [userPerms, userSearch]);

  return (
    <div className="space-y-4">
      {/* Alertas globais */}
      {successMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Card master do RBAC */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* header RBAC */}
        <header className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Permissões avançadas (RBAC)
              </h2>
              <p className="text-xs text-slate-500">
                Catálogo técnico, atribuições por usuário e visão geral das
                permissões — tudo em um só lugar.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 text-[11px] text-slate-500 md:items-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <KeyRound className="h-3 w-3 text-slate-400" />
              <span>{permissions.length} permissões no catálogo</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <Users className="h-3 w-3 text-slate-400" />
              <span>{userPerms.length} usuários com mapa carregado</span>
            </span>
          </div>
        </header>

        {/* sub-abas internas */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveRbacTab("catalog")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition ${
                activeRbacTab === "catalog"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <KeyRound className="h-3 w-3" />
              Catálogo
            </button>

            <button
              type="button"
              onClick={() => setActiveRbacTab("assign")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition ${
                activeRbacTab === "assign"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              Atribuições
            </button>

            <button
              type="button"
              onClick={() => setActiveRbacTab("map")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition ${
                activeRbacTab === "map"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <Users className="h-3 w-3" />
              Mapa por usuário
            </button>
          </div>
        </div>

        {/* conteúdo das sub-abas */}
        <div className="mt-4 space-y-4">
          {/* === ABA CATÁLOGO === */}
          {activeRbacTab === "catalog" && (
            <div className="space-y-4">
              <form
                onSubmit={handleCreatePermission}
                className="grid gap-4 md:grid-cols-2"
              >
                <div className="space-y-1 md:col-span-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
                    <KeyRound className="h-3 w-3" />
                    Chave técnica (key)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-inner outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/60"
                    placeholder="ex: internal_services_access"
                    value={permForm.key}
                    onChange={(e) =>
                      setPermForm((prev) => ({ ...prev, key: e.target.value }))
                    }
                  />
                  <p className="text-[11px] text-slate-500">
                    Usada no código:{" "}
                    <code className="rounded bg-slate-100 px-1 text-[11px] text-slate-800">
                      requirePermission("sua_key")
                    </code>
                  </p>
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-slate-800">
                    Nome amigável (label)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-inner outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/60"
                    placeholder="ex: Acessar Serviços Internos"
                    value={permForm.label}
                    onChange={(e) =>
                      setPermForm((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-800">
                    Descrição
                  </label>
                  <textarea
                    className="min-h-[60px] w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-inner outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/60"
                    placeholder="Ajude o futuro você a lembrar pra que serve essa permissão..."
                    value={permForm.description}
                    onChange={(e) =>
                      setPermForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-slate-800">
                    Área / Módulo (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-inner outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/60"
                    placeholder="ex: Serviços Internos, Monitoring, Suporte"
                    value={permForm.area}
                    onChange={(e) =>
                      setPermForm((prev) => ({
                        ...prev,
                        area: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* CHECKBOXES VIEWER / CRIAÇÃO / MODIFICAÇÃO */}
                <div className="md:col-span-2 grid grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permForm.viewer}
                      onChange={() =>
                        setPermForm((prev) => ({
                          ...prev,
                          viewer: !prev.viewer,
                          creation: false,
                          modification: false,
                        }))
                      }
                    />
                    Viewer
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permForm.creation}
                      onChange={() =>
                        setPermForm((prev) => ({
                          ...prev,
                          creation: !prev.creation,
                          viewer: false,
                          modification: false,
                        }))
                      }
                    />
                    Criação
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permForm.modification}
                      onChange={() =>
                        setPermForm((prev) => ({
                          ...prev,
                          modification: !prev.modification,
                          viewer: false,
                          creation: false,
                        }))
                      }
                    />
                    Modificação
                  </label>
                </div>

                <div className="flex items-end justify-end md:col-span-1">
                  <button
                    type="submit"
                    disabled={isSavingPerm}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSavingPerm ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Salvar permissão
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Áreas / módulos */}
              <div className="border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-800">
                    Áreas / Módulos cadastrados
                  </span>
                  {permissionsError && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {permissionsError}
                    </span>
                  )}
                </div>

                {permissions.length === 0 && !isLoadingPermissions ? (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    Nenhuma permissão cadastrada ainda. Crie a primeira acima. 🚀
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {areaNames.map((areaName) => {
                      const total = areaGroups[areaName]?.length || 0;
                      return (
                        <button
                          key={areaName}
                          type="button"
                          onClick={() => openAreaModal(areaName)}
                          className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs text-slate-800 shadow-sm hover:border-cyan-300 hover:bg-white"
                        >
                          <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-900">
                            {areaName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {total === 1
                              ? "1 permissão nesta área"
                              : `${total} permissões nesta área`}
                          </span>
                          <span className="mt-1 text-[10px] font-medium text-cyan-600">
                            Ver permissões dessa área →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === ABA ATRIBUIÇÕES === */}
          {activeRbacTab === "assign" && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3">
              <UserPermissionAssignSection
                permissions={permissions.map((p) => ({
                  key: p.key,
                  label: p.label,
                  area: p.area ?? undefined,
                  description: p.description ?? undefined,
                }))}
              />
            </div>
          )}

          {/* === ABA MAPA POR USUÁRIO === */}
          {activeRbacTab === "map" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou permissão..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-2 py-1.5 text-xs text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500/60"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>

                {userPermsError && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {userPermsError}
                  </span>
                )}
              </div>

              {filteredUserPerms.length === 0 && !isLoadingUserPerms ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                  Nenhum usuário encontrado com o filtro aplicado.
                </div>
              ) : (
                <div className="mt-1 max-h-[360px] space-y-2 overflow-auto pr-1">
                  {filteredUserPerms.map((u) => (
                    <div
                      key={u.user_id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 shadow-sm"
                    >
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {u.name || "Usuário sem nome"}
                            </span>
                            {!u.is_active && (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                                INATIVO
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {u.email}
                          </p>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {u.permissions?.length
                            ? `${u.permissions.length} permissões vinculadas`
                            : "Sem permissões específicas vinculadas"}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {u.permissions?.length ? (
                          u.permissions.map((p) => (
                            <span
                              key={`${u.user_id}-${p.key}`}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700"
                            >
                              {p.area && (
                                <span className="rounded-full bg-slate-100 px-1 text-[9px] uppercase tracking-wide text-slate-500">
                                  {p.area}
                                </span>
                              )}
                              <span>{p.label || p.key}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] italic text-slate-500">
                            Usuário herda apenas permissões padrão de perfil
                            (se houver).
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal desacoplado */}
      <AreaPermissionsModal
        isOpen={areaModalOpen}
        areaName={areaModalArea}
        permissions={areaModalArea ? areaGroups[areaModalArea] || [] : []}
        onClose={closeAreaModal}
        onSelectPermission={handleSelectPermissionFromModal}
      />
    </div>
  );
}
