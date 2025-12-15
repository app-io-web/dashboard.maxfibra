import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import {
  filterBirthdaysToday,
  type BirthdayAlertItem,
} from "../../components/birthdays/BirthdayAlertModal";

type ApiBirthday = {
  auth_user_id?: string;
  nome?: string;
  name?: string;
  data_nascimento?: string;
  profession?: string | null;
  empresa_role?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  sector?: string | null;
};

type UseDashboardBirthdaysResult = {
  birthdays: BirthdayAlertItem[];
  birthdaysToday: BirthdayAlertItem[];
  birthdaysLoading: boolean;
  birthdaysError: string | null;
};

export function useDashboardBirthdays(
  empresaId: string | null
): UseDashboardBirthdaysResult {
  const [birthdays, setBirthdays] = useState<BirthdayAlertItem[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);
  const [birthdaysError, setBirthdaysError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBirthdays() {
      if (!empresaId) {
        setBirthdays([]);
        setBirthdaysLoading(false);
        setBirthdaysError(null);
        return;
      }

      try {
        setBirthdaysLoading(true);
        setBirthdaysError(null);

        const res = await api.get("/aniversariantes", {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          params: { _ts: Date.now() }, // cache-buster
        });

        const data = res.data;

        const apiBirthdays: ApiBirthday[] =
          data?.birthdays || data?.aniversariantes || data || [];

        const mapped: BirthdayAlertItem[] = apiBirthdays.map((b, index) => ({
          id: b.auth_user_id || String(index),
          name: b.nome || b.name || "Sem nome",
          role: b.profession || b.empresa_role || b.role || "Colaborador",
          date: b.data_nascimento ?? null,
          sector: b.sector ?? undefined,
          avatarUrl: b.avatar_url ?? null,
        }));

        if (isMounted) setBirthdays(mapped);
      } catch (err) {
        console.error("Erro ao carregar aniversariantes:", err);
        if (isMounted) {
          setBirthdays([]);
          setBirthdaysError("Erro ao carregar aniversariantes de hoje.");
        }
      } finally {
        if (isMounted) setBirthdaysLoading(false);
      }
    }

    loadBirthdays();

    return () => {
      isMounted = false;
    };
  }, [empresaId]);

  const birthdaysToday = useMemo(
    () => filterBirthdaysToday(birthdays),
    [birthdays]
  );

  return { birthdays, birthdaysToday, birthdaysLoading, birthdaysError };
}
