import { useCallback, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import type { EmpresaSettings, EmpresaUserRow } from "../types";
import { normalizeUserRow } from "../utils";
import { GOD_USER_ID } from "../constants";

export function useEmpresaUsers(params: {
  empresa: EmpresaSettings | null;
  canManageUsers: boolean;
  loggedUserId: string | null;
}) {
  const { empresa, canManageUsers, loggedUserId } = params;

  const [users, setUsers] = useState<EmpresaUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);

    try {
      const res = await api.get<any>("/empresa/users");

      const raw =
        res.data?.users ??
        res.data?.rows ??
        (Array.isArray(res.data) ? res.data : res.data?.data);

      let list = Array.isArray(raw) ? raw.map(normalizeUserRow) : [];

      list.sort((a: EmpresaUserRow, b: EmpresaUserRow) =>
        (a.name || "").localeCompare(b.name || "", "pt-BR", {
          sensitivity: "base",
        })
      );

      setUsers(list);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.error || "Erro ao carregar usuários da empresa.";
      setUsersError(msg);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleInactivate = useCallback(
    async (row: EmpresaUserRow) => {
      if (!empresa) return;
      if (!canManageUsers) return;

      const targetId = row.auth_user_id || row.id;
      if (!targetId) return;

      // ❌ nunca inativar o Jota por aqui
      if (targetId === GOD_USER_ID) return;

      // ✅ SEM CONFIRM AQUI. Quem confirma é o modal do componente.
      setBusyUserId(targetId);
      setUsersError(null);

      try {
        await api.patch(`/users/${targetId}/inactivate`, {
          empresaId: empresa.auth_empresa_id,
        });

        setUsers((prev) =>
          prev.filter((u) => (u.auth_user_id || u.id) !== targetId)
        );
      } catch (err: any) {
        console.error(err);
        const msg = err?.response?.data?.error || "Erro ao inativar usuário.";
        setUsersError(msg);
      } finally {
        setBusyUserId(null);
      }
    },
    [empresa, canManageUsers]
  );

  const activeUsers = useMemo(() => {
    const list = users.filter((u) => u.is_enabled !== false);

    // se não for o próprio Jota logado, filtra ele fora
    if (loggedUserId !== GOD_USER_ID) {
      return list.filter((u) => (u.auth_user_id || u.id) !== GOD_USER_ID);
    }

    return list;
  }, [users, loggedUserId]);

  return {
    users,
    activeUsers,
    loadingUsers,
    usersError,
    setUsersError,
    busyUserId,
    loadUsers,
    handleInactivate,
  };
}
