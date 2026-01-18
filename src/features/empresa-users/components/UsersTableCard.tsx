import { useMemo, useState, useEffect } from "react";
import type { EmpresaUserRow } from "../types";
import { GOD_USER_ID } from "../constants";

type Props = {
  activeUsers: EmpresaUserRow[];
  loadingUsers: boolean;
  usersError: string | null;
  canManageUsers: boolean;
  busyUserId: string | null; // ✅ deve ser o id do vínculo (u.id)
  onReload: () => void;
  onInactivate: (u: EmpresaUserRow) => void;
  onEdit: (userId: string, payload: any) => void | Promise<void>;
};

function formatCpf(value: string) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function UsersTableCard(props: Props) {
  const {
    activeUsers,
    loadingUsers,
    usersError,
    canManageUsers,
    busyUserId,
    onReload,
    onInactivate,
    onEdit,
  } = props;

  const [confirmUser, setConfirmUser] = useState<EmpresaUserRow | null>(null);
  const [editUser, setEditUser] = useState<EmpresaUserRow | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    cpf: "",
    profession: "",
    role: "",
    data_nascimento: "",
    remove_password: false,
  });

  // ✅ padroniza o id que trava tudo (vínculo)
  const confirmActionId = useMemo(() => confirmUser?.id ?? null, [confirmUser]);
  const editActionId = useMemo(() => editUser?.id ?? null, [editUser]);

  const confirmName = confirmUser?.name || "Usuário";

  function closeConfirm() {
    if (confirmActionId && busyUserId === confirmActionId) return;
    setConfirmUser(null);
  }

  function handleConfirm() {
    if (!confirmUser) return;
    onInactivate(confirmUser);
    setConfirmUser(null);
  }


function openEdit(u: EmpresaUserRow) {
  console.log("[openEdit] user row recebido:", u);
  // Remova ou atualize esses logs se quiser:
  // console.log("[openEdit] cpf recebido:", u.cpf, "data_nascimento:", u.data_nascimento);

  setEditUser(u);

  let dataNascFormatted = "";
  if (u.data_nascimento) {
    const date = new Date(u.data_nascimento);
    if (!isNaN(date.getTime())) {
      dataNascFormatted = date.toISOString().split("T")[0];
    } else {
      dataNascFormatted = String(u.data_nascimento).split("T")[0];
    }
  }

  const nextForm = {
    name: u.name || "",
    email: u.email || "",
    cpf: formatCpf(u.cpf || ""),
    profession: u.profession || "",
    role: u.role || "",
    data_nascimento: dataNascFormatted,
    remove_password: false,
  };

  console.log("[openEdit] editForm montado:", nextForm);
  setEditForm(nextForm);
}

  function normStr(v: any) {
    const s = String(v ?? "").trim();
    return s;
  }

  function closeEdit() {
    if (editActionId && busyUserId === editActionId) return;
    setEditUser(null);
  }


  function normNullStr(v: any) {
    const s = normStr(v);
    return s === "" ? null : s;
  }

  function normCpfDigits(v: any) {
    const digits = String(v ?? "").replace(/\D/g, "");
    return digits === "" ? null : digits;
  }

  async function submitEdit() {
    if (!editUser) return;
    const id = editUser.id; // id do vínculo

    // baseline (original)
    // baseline (original) — agora usando os campos reais do editUser
    const base = {
      name: normStr(editUser.name),
      email: normNullStr(editUser.email),
      cpf: normCpfDigits(editUser.cpf),                    // ← sem as any
      profession: normNullStr(editUser.profession),
      role: normStr(editUser.role),
      data_nascimento: normNullStr(editUser.data_nascimento), // ← sem as any
    };

    // current (form)
    const curr = {
      name: normStr(editForm.name),
      email: normNullStr(editForm.email),
      cpf: normCpfDigits(editForm.cpf),
      profession: normNullStr(editForm.profession),
      role: normStr(editForm.role),
      data_nascimento: normNullStr(editForm.data_nascimento),
    };

    // monta PATCH só com o que mudou
    const patch: any = {};
    (Object.keys(curr) as Array<keyof typeof curr>).forEach((k) => {
      if (curr[k] !== base[k]) patch[k] = curr[k];
    });

    // só manda remove_password quando marcar
    if (editForm.remove_password) patch.remove_password = true;

    // Se nada mudou e não marcou reset de senha, nem chama API
    if (Object.keys(patch).length === 0) {
      setEditUser(null);
      return;
    }

    await onEdit(id, patch);
    setEditUser(null);
  }


  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Usuários ativos</h3>
          <p className="text-[11px] text-slate-500">
            Inativados somem daqui e não conseguem logar.
          </p>
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={loadingUsers}
          className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-500 shadow-sm transition disabled:opacity-60"
        >
          {loadingUsers ? "Atualizando..." : "Atualizar lista"}
        </button>
      </div>

      {usersError && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {usersError}
        </div>
      )}

      {loadingUsers ? (
        <div className="text-sm text-slate-600">Carregando usuários...</div>
      ) : activeUsers.length === 0 ? (
        <div className="text-sm text-slate-600">Nenhum usuário ativo encontrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Cargo</th>
                <th className="py-2 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {activeUsers.map((u) => {
                const actionId = u.id; // ✅ id do vínculo sempre
                const isGod = (u.auth_user_id || "") === GOD_USER_ID; // ✅ god checa no global

                return (
                  <tr key={actionId} className="text-sm text-slate-800">
                    <td className="py-2 pr-3 font-medium">{u.name}</td>
                    <td className="py-2 pr-3 text-slate-600">
                      {u.email || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-2 pr-3">{u.role || "—"}</td>
                    <td className="py-2 pr-3">{u.profession || "—"}</td>

                    <td className="py-2 text-right">
                      {canManageUsers ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            disabled={busyUserId === actionId || isGod}
                            className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition disabled:opacity-60"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmUser(u)}
                            disabled={busyUserId === actionId || isGod}
                            className="text-xs rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 hover:border-rose-300 hover:bg-rose-100 transition disabled:opacity-60"
                          >
                            {isGod
                              ? "Intocável"
                              : busyUserId === actionId
                              ? "Inativando..."
                              : "Inativar"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sem permissão</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Modal de confirmação */}
      {confirmUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-900">Inativar usuário</h4>
              <p className="mt-1 text-xs text-slate-600">
                Tem certeza que deseja inativar{" "}
                <span className="font-semibold">{confirmName}</span>?
              </p>
              <p className="mt-2 text-[11px] text-rose-700">
                Ele vai sumir da lista e não vai conseguir logar.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={!!confirmActionId && busyUserId === confirmActionId}
                className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400 transition disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!!confirmActionId && busyUserId === confirmActionId}
                className="text-xs rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 hover:border-rose-300 hover:bg-rose-100 transition disabled:opacity-60"
              >
                {!!confirmActionId && busyUserId === confirmActionId
                  ? "Inativando..."
                  : "Inativar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal editar */}
      {editUser && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-900">Editar usuário</h4>

              <div className="mt-3 space-y-2">
                <input
                  placeholder="Nome"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />

                <input
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />

                <input
                  placeholder="CPF"
                  value={editForm.cpf}
                  onChange={(e) =>
                    setEditForm({ ...editForm, cpf: formatCpf(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  inputMode="numeric"
                  maxLength={14}
                />

                <input
                  placeholder="Cargo"
                  value={editForm.profession}
                  onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />

                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="">—</option>
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>

                <input
                  type="date"
                  value={editForm.data_nascimento}
                  onChange={(e) =>
                    setEditForm({ ...editForm, data_nascimento: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />

                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={editForm.remove_password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, remove_password: e.target.checked })
                    }
                  />
                  Remover senha (forçar primeiro acesso)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={!!editActionId && busyUserId === editActionId}
                className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400 transition disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={submitEdit}
                disabled={!!editActionId && busyUserId === editActionId}
                className="text-xs rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700 hover:border-blue-300 hover:bg-blue-100 transition disabled:opacity-60"
              >
                {!!editActionId && busyUserId === editActionId ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
