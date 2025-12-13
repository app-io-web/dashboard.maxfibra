// src/components/empresa/EmpresaUsers.tsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { VincularUsuarioEmpresasModal } from "./VincularUsuarioEmpresasModal";

type EmpresaUser = {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  name?: string | null; // ✅ AQUI (vem do backend)
  avatar_url: string | null;
  is_central_admin: boolean;
  role: string | null;
  can_link_other_empresas?: boolean;
};


type EditFormState = {
  display_name: string;
  role: string;
  newPassword: string;
  confirmPassword: string;
};

const ROLE_OPTIONS = [
  { value: "OWNER", label: "Owner (dono)" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Gestor" },
  { value: "MEMBER", label: "Membro" },
  { value: "VIEWER", label: "Somente leitura" },
];

type Props = {
  currentRole: string | null; // opcionalmente usado pra exibição
  canEditUsers: boolean; // acess_modify_editing_users_business_writer
  canViewVincularOutros: boolean; // viewer
  canVincularOutros: boolean; // writer
  // ⬇️ se false, esconde os usuários "developer" (is_central_admin)
  canViewDevsUsers?: boolean;
};

export function EmpresaUsers({
  currentRole,
  canEditUsers,
  canViewVincularOutros,
  canVincularOutros,
  canViewDevsUsers = true,
}: Props) {
  const [users, setUsers] = useState<EmpresaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<EmpresaUser | null>(null);
  const [linkUser, setLinkUser] = useState<EmpresaUser | null>(null);

  const [form, setForm] = useState<EditFormState>({
    display_name: "",
    role: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/empresa/users");
        setUsers(res.data.users || []);
      } catch (err: any) {
        console.error(err);
        setError("Erro ao carregar usuários");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setForm({
        display_name: editingUser.display_name || "",
        role: editingUser.role || "MEMBER",
        newPassword: "",
        confirmPassword: "",
      });
      setFormError(null);
      setFormSuccess(null);
    }
  }, [editingUser]);

  function handleChange<K extends keyof EditFormState>(
    field: K,
    value: EditFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!editingUser) return;

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setFormError("As senhas não conferem.");
      return;
    }

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await api.put(`/empresa/users/${editingUser.id}`, {
        role: form.role,
        display_name: form.display_name || null,
        newPassword: form.newPassword || undefined,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                display_name: form.display_name || u.display_name,
                role: form.role || u.role,
              }
            : u
        )
      );

      setFormSuccess(
        form.newPassword
          ? "Usuário e senha atualizados com sucesso."
          : "Usuário atualizado com sucesso."
      );
      setTimeout(() => setEditingUser(null), 800);
    } catch (err: any) {
      console.error(err);
      setFormError(
        err?.response?.data?.error ||
          "Erro ao salvar alterações. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white shadow-sm rounded-2xl border border-slate-200 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl">
        {error}
      </div>
    );
  }

  const canShowAnyAction = canEditUsers || canViewVincularOutros;

  // 🔒 filtro: se não pode ver devs, esconde usuários com is_central_admin = true
  const visibleUsers = users.filter((u) => {
    if (!canViewDevsUsers && u.is_central_admin) {
      return false;
    }
    return true;
  });

  return (
    <>
      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Usuários da Empresa
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie quem tem acesso e os papéis de cada usuário.
            </p>
          </div>
        </div>

        {visibleUsers.length === 0 ? (
          <p className="text-slate-600 text-sm">
            Nenhum usuário vinculado ainda. Comece vinculando alguém do Auth
            Global.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <ul className="divide-y divide-slate-100">
              {visibleUsers.map((u) => (
                <li
                  key={u.id}
                  className="px-3 sm:px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.display_name || "Usuário"}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                        {(u.display_name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">
                          {u.display_name || "Usuário sem nome"}
                        </p>
                        {u.is_central_admin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            CENTRAL ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        ID Global: {u.auth_user_id}
                      </p>
                    </div>
                  </div>

                  {canShowAnyAction && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="hidden sm:inline-flex text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                        {u.role || "MEMBER"}
                      </span>

                      {canViewVincularOutros && u.can_link_other_empresas && (
                        <button
                          type="button"
                          onClick={() =>
                            canVincularOutros && setLinkUser(u)
                          }
                          disabled={!canVincularOutros}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border border-emerald-500/40 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Vincular em outras empresas
                        </button>
                      )}

                      {canEditUsers && (
                        <button
                          type="button"
                          onClick={() => setEditingUser(u)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border border-[#1282A2]/40 text-[#034078] bg-[#FEFCFB] hover:bg-[#1282A2]/5 transition"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !saving && setEditingUser(null)}
          />

          <div className="relative z-50 w-full max-w-md mx-4 rounded-2xl bg-white shadow-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                  Editar usuário
                </h3>
                <p className="text-xs text-slate-500">
                  Ajuste nome, função/role e redefina a senha do usuário.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome de exibição
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) =>
                    handleChange("display_name", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1282A2]/50 focus:border-[#1282A2]"
                  placeholder="Nome que aparece no sistema"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role / Função
                </label>
                <select
                  value={form.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1282A2]/50 focus:border-[#1282A2]"
                  disabled={saving}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-800 mb-1">
                  Redefinir senha
                </p>
                <p className="text-[11px] text-slate-500 mb-2">
                  Preencha os campos abaixo para alterar a senha do usuário.
                  Deixe em branco para não alterar.
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nova senha
                    </label>
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={(e) =>
                        handleChange("newPassword", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1282A2]/40"
                      placeholder="Deixe em branco para não alterar"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Confirmar nova senha
                    </label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        handleChange("confirmPassword", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1282A2]/40"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  {formSuccess}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => !saving && setEditingUser(null)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#1282A2] hover:bg-[#034078] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {linkUser && (
        <VincularUsuarioEmpresasModal
          open={!!linkUser}
          user={linkUser}
          onClose={() => setLinkUser(null)}
          onLinked={() => {
            // se quiser, recarrega lista aqui
          }}
        />
      )}
    </>
  );
}
