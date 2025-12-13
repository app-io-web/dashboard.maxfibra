import { useMemo, useState } from "react";
import type { EmpresaUserRow } from "../types";
import { GOD_USER_ID } from "../constants";

type Props = {
  activeUsers: EmpresaUserRow[];
  loadingUsers: boolean;
  usersError: string | null;
  canManageUsers: boolean;
  busyUserId: string | null;
  onReload: () => void;
  onInactivate: (u: EmpresaUserRow) => void;
};

export function UsersTableCard(props: Props) {
  const {
    activeUsers,
    loadingUsers,
    usersError,
    canManageUsers,
    busyUserId,
    onReload,
    onInactivate,
  } = props;

  const [confirmUser, setConfirmUser] = useState<EmpresaUserRow | null>(null);

  const confirmActionId = useMemo(() => {
    if (!confirmUser) return null;
    return confirmUser.auth_user_id || confirmUser.id;
  }, [confirmUser]);

  const confirmName = confirmUser?.name || "Usuário";

  function closeConfirm() {
    // se estiver “busy” no mesmo user, deixa o pai terminar primeiro
    if (confirmActionId && busyUserId === confirmActionId) return;
    setConfirmUser(null);
  }

  function handleConfirm() {
    if (!confirmUser) return;
    onInactivate(confirmUser);
    // fecha já pra ficar ligeiro (se quiser, dá pra fechar só quando concluir)
    setConfirmUser(null);
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
          className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 shadow-sm transition disabled:opacity-60"
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
                const actionId = u.auth_user_id || u.id;
                const isGod = actionId === GOD_USER_ID;

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

      {/* ✅ Modal de confirmação (sem window.confirm) */}
      {confirmUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeConfirm}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-900">
                Inativar usuário
              </h4>
              <p className="mt-1 text-xs text-slate-600">
                Tem certeza que deseja inativar <span className="font-semibold">{confirmName}</span>?
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
                {confirmActionId && busyUserId === confirmActionId ? "Inativando..." : "Inativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
