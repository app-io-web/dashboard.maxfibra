// src/components/system-config/UserPermissionAssignSection.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import {
  User,
  Building2,
  KeyRound,
  ShieldAlert,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";

type PermissionOption = {
  key: string;
  label: string;
  area?: string | null;
  description?: string | null;
};

type UserSummary = {
  id: string;
  name: string;
  email?: string | null;
};

type EmpresaSummary = {
  id: string;
  nome: string;
  fantasia?: string | null;
  slug?: string | null;
};

type Props = {
  permissions: PermissionOption[];
};

type UserEmpresaPermissionsPayload = {
  granted_keys: string[];
};

const ALL_AREAS_TAB = "__ALL__";

function getAreaLabel(p: PermissionOption): string {
  if (p.area && p.area.trim().length > 0) return p.area;
  return "Outras permissões";
}

export function UserPermissionAssignSection({ permissions }: Props) {
  const [authUserId, setAuthUserId] = useState("");
  const [authEmpresaId, setAuthEmpresaId] = useState("");

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [savingPermissionKey, setSavingPermissionKey] = useState<string | null>(
    null
  );

  const [permissionStates, setPermissionStates] = useState<
    Record<string, boolean>
  >({});

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // área/módulo ativo nas abas
  const [activeAreaTab, setActiveAreaTab] = useState<string>(ALL_AREAS_TAB);

  function resetMessages() {
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  // Busca usuários
  async function fetchUsers() {
    try {
      setIsLoadingUsers(true);
      const resp = await api.get("/tools/permissions/users");
      const data: UserSummary[] = resp.data?.data || resp.data || [];
      setUsers(data);
    } catch (err: any) {
      console.error("[RBAC] erro ao carregar usuários:", err);
      setErrorMessage(
        err?.response?.data?.error || "Erro ao carregar lista de usuários."
      );
    } finally {
      setIsLoadingUsers(false);
    }
  }

  // Busca empresas
  async function fetchEmpresas() {
    try {
      setIsLoadingEmpresas(true);
      const resp = await api.get("/tools/permissions/empresas");
      const data: EmpresaSummary[] = resp.data?.data || resp.data || [];
      setEmpresas(data);
    } catch (err: any) {
      console.error("[RBAC] erro ao carregar empresas:", err);
      setErrorMessage(
        err?.response?.data?.error || "Erro ao carregar lista de empresas."
      );
    } finally {
      setIsLoadingEmpresas(false);
    }
  }

  // Carrega mapa de permissões para (user, empresa)
  async function fetchUserEmpresaPermissions(
    userId: string,
    empresaId: string
  ) {
    try {
      setIsLoadingPermissions(true);
      const resp = await api.get("/tools/permissions/map-by-user-empresa", {
        params: {
          auth_user_id: userId,
          auth_empresa_id: empresaId,
        },
      });

      const payload: UserEmpresaPermissionsPayload =
        resp.data?.data || resp.data || { granted_keys: [] };

      const grantedSet = new Set(payload.granted_keys || []);

      const nextStates: Record<string, boolean> = {};
      for (const p of permissions) {
        nextStates[p.key] = grantedSet.has(p.key);
      }
      setPermissionStates(nextStates);
      setErrorMessage(null);
    } catch (err: any) {
      console.error("[RBAC] erro ao carregar mapa de permissões:", err);
      setErrorMessage(
        err?.response?.data?.error ||
          "Erro ao carregar permissões deste usuário / empresa."
      );
      const nextStates: Record<string, boolean> = {};
      for (const p of permissions) {
        nextStates[p.key] = false;
      }
      setPermissionStates(nextStates);
    } finally {
      setIsLoadingPermissions(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    fetchEmpresas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authUserId || !authEmpresaId) {
      setPermissionStates({});
      return;
    }
    fetchUserEmpresaPermissions(authUserId, authEmpresaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserId, authEmpresaId, permissions]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const term = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  const filteredEmpresas = useMemo(() => {
    if (!empresaSearch.trim()) return empresas;
    const term = empresaSearch.toLowerCase();
    return empresas.filter(
      (e) =>
        e.nome.toLowerCase().includes(term) ||
        (e.fantasia || "").toLowerCase().includes(term) ||
        (e.slug || "").toLowerCase().includes(term)
    );
  }, [empresas, empresaSearch]);

  // lista de áreas/módulos para as abas
  const areaTabs = useMemo(() => {
    const set = new Set<string>();
    permissions.forEach((p) => {
      set.add(getAreaLabel(p));
    });
    const arr = Array.from(set);
    arr.sort((a, b) => a.localeCompare(b, "pt-BR"));
    return arr;
  }, [permissions]);

  // permissões filtradas por área + busca
  const filteredPermissions = useMemo(() => {
    let list = permissions;

    if (activeAreaTab !== ALL_AREAS_TAB) {
      list = list.filter((p) => getAreaLabel(p) === activeAreaTab);
    }

    if (!permissionSearch.trim()) return list;

    const term = permissionSearch.toLowerCase();
    return list.filter((p) => {
      const base = `${p.label || ""} ${p.key || ""} ${
        p.area || ""
      }`.toLowerCase();
      return base.includes(term);
    });
  }, [permissions, activeAreaTab, permissionSearch]);

  async function handleTogglePermission(permissionKey: string) {
    if (!authUserId || !authEmpresaId) {
      setErrorMessage(
        "Selecione usuário e empresa antes de alterar permissões."
      );
      return;
    }

    resetMessages();

    const current = !!permissionStates[permissionKey];
    const nextValue = !current;

    setPermissionStates((prev) => ({
      ...prev,
      [permissionKey]: nextValue,
    }));

    try {
      setSavingPermissionKey(permissionKey);

      const response = await api.post("/tools/permissions/assign", {
        auth_user_id: authUserId,
        auth_empresa_id: authEmpresaId,
        permission_key: permissionKey,
        is_granted: nextValue,
      });

      const granted = response.data?.data?.is_granted ?? nextValue;
      const alreadyHad = response.data?.data?.already_had ?? false;

      if (alreadyHad) {
        setSuccessMessage(
          `Nenhuma alteração: permissão "${permissionKey}" já estava ${
            granted ? "ATRIBUÍDA" : "REVOGADA"
          } para o usuário/empresa selecionados.`
        );
      } else {
        setSuccessMessage(
          `Permissão "${permissionKey}" ${
            granted ? "ATRIBUÍDA" : "REVOGADA"
          } com sucesso para o usuário selecionado.`
        );
      }

      setPermissionStates((prev) => ({
        ...prev,
        [permissionKey]: granted,
      }));
    } catch (err: any) {
      console.error("[RBAC] erro ao atribuir permissão:", err);
      setErrorMessage(
        err?.response?.data?.error || "Erro ao atribuir permissão."
      );
      setPermissionStates((prev) => ({
        ...prev,
        [permissionKey]: current,
      }));
    } finally {
      setSavingPermissionKey(null);
    }
  }

  const totalAtivas = useMemo(
    () => Object.values(permissionStates).filter(Boolean).length,
    [permissionStates]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Permissões por usuário / empresa
          </h2>
          <p className="text-xs text-slate-500">
            Selecione usuário e empresa, depois marque/desmarque as permissões
            abaixo.
          </p>
        </div>
      </header>

      {(successMessage || errorMessage) && (
        <div className="mb-3 space-y-2">
          {successMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Usuário */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
            <User className="h-3 w-3" />
            Usuário
          </label>
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-xs">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                className="h-6 flex-1 border-none bg-transparent text-xs text-slate-900 outline-none"
                placeholder="Buscar por nome ou e-mail..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/60"
              value={authUserId}
              onChange={(e) => setAuthUserId(e.target.value)}
            >
              <option value="">
                {isLoadingUsers
                  ? "Carregando usuários..."
                  : "Selecione um usuário"}
              </option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.email ? ` (${u.email})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empresa */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
            <Building2 className="h-3 w-3" />
            Empresa
          </label>
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-xs">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                className="h-6 flex-1 border-none bg-transparent text-xs text-slate-900 outline-none"
                placeholder="Buscar por nome, fantasia ou slug..."
                value={empresaSearch}
                onChange={(e) => setEmpresaSearch(e.target.value)}
              />
            </div>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/60"
              value={authEmpresaId}
              onChange={(e) => setAuthEmpresaId(e.target.value)}
            >
              <option value="">
                {isLoadingEmpresas
                  ? "Carregando empresas..."
                  : "Selecione uma empresa"}
              </option>
              {filteredEmpresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                  {e.fantasia ? ` - ${e.fantasia}` : ""}
                  {e.slug ? ` (${e.slug})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de permissões com abas de área */}
        <div className="md:col-span-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
              <KeyRound className="h-3 w-3" />
              Permissões
            </label>
            <span className="text-[11px] text-slate-500">
              {totalAtivas} ativa(s) para este usuário / empresa
            </span>
          </div>

          {/* Busca global de permissão */}
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              className="h-6 flex-1 border-none bg-transparent text-xs text-slate-900 outline-none"
              placeholder="Buscar por nome, área ou chave..."
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
            />
          </div>

          {/* Abas por área/módulo */}
          <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveAreaTab(ALL_AREAS_TAB)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium ${
                activeAreaTab === ALL_AREAS_TAB
                  ? "border-amber-400 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas
            </button>
            {areaTabs.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setActiveAreaTab(area)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium ${
                  activeAreaTab === area
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {area}
              </button>
            ))}
          </div>

          {/* Lista de permissões da área selecionada */}
          <div className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
            {!authUserId || !authEmpresaId ? (
              <p className="text-[11px] text-slate-500">
                Selecione usuário e empresa para visualizar e alterar as
                permissões.
              </p>
            ) : isLoadingPermissions ? (
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Carregando permissões atuais...
              </div>
            ) : filteredPermissions.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                {permissions.length === 0
                  ? "Nenhuma permissão cadastrada."
                  : "Nenhuma permissão encontrada para o filtro / área selecionada."}
              </p>
            ) : (
              filteredPermissions.map((p) => {
                const checked = !!permissionStates[p.key];
                const isSaving = savingPermissionKey === p.key;

                return (
                  <div
                    key={p.key}
                    className="flex items-start justify-between gap-2 rounded-md bg-white px-2 py-1.5"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          {getAreaLabel(p)}
                        </span>
                        <span className="font-medium text-[11px] text-slate-900">
                          {p.label || p.key}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({p.key})
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-[10px] text-slate-500">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePermission(p.key)}
                      disabled={isSaving || !authUserId || !authEmpresaId}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                          readOnly
                          checked={checked}
                        />
                      )}
                      <span>{checked ? "Ativa" : "Inativa"}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Cada permissão é sempre aplicada ao par{" "}
            <code className="rounded bg-slate-100 px-1 text-[11px] text-slate-800">
              (auth_user_id, auth_empresa_id)
            </code>
            . Clique no checkbox para conceder ou revogar na hora.
          </p>
        </div>
      </div>
    </section>
  );
}
