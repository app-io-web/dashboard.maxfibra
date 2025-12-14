// src/components/system-config/SystemPermissionProfilesSection.tsx
import { useEffect, useState, FormEvent } from "react";
import { api } from "../../lib/api";
import {
  Plus,
  Save,
  Shield,
  Users,
  AlertCircle,
  Loader2,
  Layers,
  Link as LinkIcon,
} from "lucide-react";

type Permission = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  area: string | null;
};

type Profile = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  is_active: boolean;
};

type RbacUser = {
  id: string;
  name: string;
  email: string;
};

type RbacEmpresa = {
  id: string;
  nome: string;
  slug: string | null;
};

type ProfilesSubTab = "profiles" | "profile-perms" | "assign";

export function SystemPermissionProfilesSection() {
  const [activeSubTab, setActiveSubTab] = useState<ProfilesSubTab>("profiles");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [loadingProfilePerms, setLoadingProfilePerms] = useState(false);


  // form novo perfil
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // atribuição a usuário
  const [users, setUsers] = useState<RbacUser[]>([]);
  const [empresas, setEmpresas] = useState<RbacEmpresa[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState("");

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [profilesRes, permsRes, usersRes, empRes] = await Promise.all([
        api.get("/tools/permission-profiles"),
        api.get("/tools/permissions"),
        api.get("/tools/permissions/users"),
        api.get("/tools/permissions/empresas"),
      ]);

      setProfiles(profilesRes.data.data ?? []);
      setPermissions(permsRes.data.data ?? []);
      setUsers(usersRes.data.data ?? []);
      setEmpresas(empRes.data.data ?? []);
    } catch (err: any) {
      console.error("[RBAC] erro ao carregar perfis:", err);
      setError("Erro ao carregar dados de perfis/permissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateProfile(e: FormEvent) {
    e.preventDefault();
    if (!newKey || !newLabel) return;

    setSaving(true);
    setError(null);

    try {
      const res = await api.post("/tools/permission-profiles", {
        key: newKey,
        label: newLabel,
        description: newDescription || null,
        is_active: true,
      });

      const created: Profile = res.data.data;
      setProfiles((prev) => {
        const others = prev.filter((p) => p.id !== created.id);
        return [...others, created].sort((a, b) => a.label.localeCompare(b.label));
      });

      setNewKey("");
      setNewLabel("");
      setNewDescription("");
      setSelectedProfileId(created.id);
      setSelectedPermissionKeys([]);
      setActiveSubTab("profile-perms");
    } catch (err: any) {
      console.error("[RBAC] erro ao criar perfil:", err);
      setError(err.response?.data?.error || "Erro ao criar perfil.");
    } finally {
      setSaving(false);
    }
  }

  function togglePermissionKey(key: string) {
    setSelectedPermissionKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSaveProfilePermissions() {
    if (!selectedProfileId) return;
    setSaving(true);
    setError(null);

    try {
      await api.post(`/tools/permission-profiles/${selectedProfileId}/permissions`, {
        permission_keys: selectedPermissionKeys,
      });
    } catch (err: any) {
      console.error("[RBAC] erro ao salvar permissões do perfil:", err);
      setError(err.response?.data?.error || "Erro ao salvar permissões do perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignProfileToUser() {
    if (!selectedProfileId || !selectedUserId || !selectedEmpresaId) return;
    setSaving(true);
    setError(null);

    try {
      await api.post("/tools/permission-profiles/assign-to-user", {
        auth_user_id: selectedUserId,
        auth_empresa_id: selectedEmpresaId,
        profile_id: selectedProfileId,
        is_active: true,
      });
    } catch (err: any) {
      console.error("[RBAC] erro ao atribuir perfil ao usuário:", err);
      setError(err.response?.data?.error || "Erro ao atribuir perfil ao usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectProfile(profileId: string) {
  setSelectedProfileId(profileId);
  setSelectedPermissionKeys([]);
  setError(null);
  setLoadingProfilePerms(true);

  try {
    const res = await api.get(
      `/tools/permission-profiles/${profileId}/permissions`
    );

    const keys: string[] = res.data?.data?.permission_keys ?? [];
    setSelectedPermissionKeys(keys);
  } catch (err: any) {
    console.error("[RBAC] erro ao carregar permissões do perfil:", err);
    setError(
      err.response?.data?.error ||
        "Erro ao carregar permissões do perfil selecionado."
    );
  } finally {
    setLoadingProfilePerms(false);
  }
}


  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando perfis de permissão...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Perfis de permissão
            </h2>
            <p className="text-xs text-slate-600">
              Agrupe permissões em perfis (ex: Atendente de loja) e atribua a usuários por empresa.
            </p>
          </div>
        </div>
      </div>

      {/* Mini-abas internas */}
      <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab("profiles")}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition
            ${
              activeSubTab === "profiles"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            }`}
        >
          <Layers className="h-3 w-3" />
          Perfis
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("profile-perms")}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition
            ${
              activeSubTab === "profile-perms"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            }`}
        >
          <Shield className="h-3 w-3" />
          Permissões do perfil
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("assign")}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition
            ${
              activeSubTab === "assign"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            }`}
        >
          <LinkIcon className="h-3 w-3" />
          Atribuir a usuário
        </button>
      </div>

      {/* Conteúdo por sub-aba */}
      {activeSubTab === "profiles" && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,0.5fr)_minmax(0,0.5fr)]">
          {/* lista de perfis */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="mb-2 text-xs font-semibold text-slate-800">
              Perfis cadastrados
            </h3>
            <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
              {profiles.length === 0 && (
                <p className="text-xs text-slate-500">
                  Nenhum perfil cadastrado ainda.
                </p>
              )}

              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    handleSelectProfile(profile.id);
                    setActiveSubTab("profile-perms");
                  }}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition
                    ${
                      selectedProfileId === profile.id
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : "hover:bg-slate-50 text-slate-700 border border-transparent"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{profile.label}</span>
                    {!profile.is_active && (
                      <span className="text-[10px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                        inativo
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {profile.key}
                  </div>
                  {profile.description && (
                    <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">
                      {profile.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* criar novo perfil */}
          <form
            onSubmit={handleCreateProfile}
            className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-3"
          >
            <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-blue-800">
              <Plus className="h-3 w-3" />
              Novo perfil
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Chave técnica
                </label>
                <input
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="perfil_atendente_loja"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Nome do perfil
                </label>
                <input
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Atendente de loja"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Acesso à tela de fichas, consulta básica de clientes, sem edição..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Criar perfil
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === "profile-perms" && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800">
              Permissões do perfil
            </h3>
            {selectedProfileId && (
              <button
                type="button"
                onClick={handleSaveProfilePermissions}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Salvar perfil
              </button>
            )}
          </div>

          {!selectedProfileId ? (
            <p className="text-xs text-slate-500">
              Selecione um perfil na aba "Perfis" para configurar as permissões.
            </p>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {permissions.map((perm) => {
                const checked = selectedPermissionKeys.includes(perm.key);
                return (
                  <label
                    key={perm.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-[3px] h-3 w-3 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                      checked={checked}
                      onChange={() => togglePermissionKey(perm.key)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-800">
                          {perm.label || perm.key}
                        </span>
                        {perm.area && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                            {perm.area}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {perm.key}
                      </div>
                      {perm.description && (
                        <p className="text-[10px] text-slate-500">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === "assign" && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <div>
              <h3 className="text-xs font-semibold text-slate-800">
                Atribuir perfil a usuário
              </h3>
              <p className="text-[11px] text-slate-500">
                O perfil é sempre atribuído em contexto de empresa.
              </p>
            </div>
          </div>

          {!selectedProfileId ? (
            <p className="text-xs text-slate-500">
              Selecione um perfil na aba "Perfis" antes de atribuir.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Usuário
                </label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Selecione um usuário</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Empresa
                </label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={selectedEmpresaId}
                  onChange={(e) => setSelectedEmpresaId(e.target.value)}
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  disabled={
                    saving || !selectedUserId || !selectedEmpresaId || !selectedProfileId
                  }
                  onClick={handleAssignProfileToUser}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Shield className="h-3 w-3" />
                  )}
                  Atribuir perfil ao usuário
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
