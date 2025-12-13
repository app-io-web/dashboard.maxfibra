import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ACCESS_TOKEN_KEY } from "../../../lib/api";
import type { ApiAniversariante, BirthdayItem, BirthdayWithInfo } from "../types";
import { getNextBirthdayInfo } from "../utils/birthdayDate";

const GOD_USER_ID = "a736e9f5-72e0-4faa-946c-8c5a62b6bb77";

function getLoggedUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id ?? payload?.userId ?? payload?.auth_user_id ?? payload?.sub ?? null;
  } catch {
    return null;
  }
}

function mapApiToBirthdayItem(item: ApiAniversariante): BirthdayItem {
  return {
    id: item.auth_user_id,
    name: item.nome,
    role: item.profession || item.empresa_role || "Colaborador",
    date: item.data_nascimento,
    sector: undefined,
    avatarUrl: item.avatar_url,
    is_manual: item.is_manual === true,
  };
}

export function useBirthdays() {
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loggedUserId = getLoggedUserIdFromToken();

      const response = await api.get("/aniversariantes");
      const data: ApiAniversariante[] = response.data?.aniversariantes || [];

      const filtered =
        loggedUserId === GOD_USER_ID ? data : data.filter((x) => x.auth_user_id !== GOD_USER_ID);

      setBirthdays(filtered.map(mapApiToBirthdayItem));
    } catch (err) {
      console.error("Erro ao carregar aniversariantes:", err);
      setError("Não foi possível carregar a lista de aniversariantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withInfo: BirthdayWithInfo[] = useMemo(
    () => birthdays.map((b) => ({ ...b, info: getNextBirthdayInfo(b.date) })),
    [birthdays]
  );

  const todayBirthdays = useMemo(
    () => withInfo.filter((b) => b.info.daysUntil === 0),
    [withInfo]
  );

  const upcomingBirthdays = useMemo(
    () => withInfo.filter((b) => b.info.daysUntil > 0).sort((a, b) => a.info.daysUntil - b.info.daysUntil),
    [withInfo]
  );

  const appendBirthday = useCallback((novo: BirthdayItem) => {
    setBirthdays((prev) => [...prev, novo]);
  }, []);

  const removeBirthdayById = useCallback((id: string) => {
    setBirthdays((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    birthdays,
    loading,
    error,
    reload: load,
    todayBirthdays,
    upcomingBirthdays,
    appendBirthday,
    removeBirthdayById,
  };
}
