import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Cake, Clock, PartyPopper } from "lucide-react";

type BirthdayItem = {
  id: string;
  name: string;
  role: string;
  date: string; // ISO (pelo menos YYYY-MM-DD)
  sector?: string;
  avatarUrl?: string | null;
};

type ApiAniversariante = {
  auth_user_id: string;
  auth_empresa_id: string | null;
  nome: string;
  profession: string | null;
  data_nascimento: string;
  empresa_role: string | null;
  avatar_url: string | null;
};

function extractYMD(dateStr: string): { year: number; month: number; day: number } {
  const [datePart] = dateStr.split("T");
  const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10));
  return { year: y, month: m, day: d };
}

function getNextBirthdayInfo(dateStr: string) {
  const { year: birthYear, month, day } = extractYMD(dateStr);

  const today = new Date();
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let nextYear = today.getFullYear();
  let nextBirthday = new Date(nextYear, month - 1, day);

  // se o aniversário deste ano já passou, pula pro próximo ano
  if (nextBirthday < todayDate) {
    nextYear += 1;
    nextBirthday = new Date(nextYear, month - 1, day);
  }

  const oneDayMs = 1000 * 60 * 60 * 24;
  const diffMs = nextBirthday.getTime() - todayDate.getTime();
  const daysUntil = Math.round(diffMs / oneDayMs);

  const ageAtNext = nextYear - birthYear;

  return { nextBirthday, daysUntil, ageAtNext };
}

function formatDate(dateStr: string) {
  const { month, day } = extractYMD(dateStr);
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${dd}/${mm}`;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar(props: {
  name: string;
  avatarUrl?: string | null;
  variant: "today" | "upcoming";
}) {
  const { name, avatarUrl, variant } = props;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-sm"
      />
    );
  }

  const colorClass =
    variant === "today"
      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
      : "bg-[#1282A2] text-white";

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
    >
      {getInitials(name)}
    </div>
  );
}

export function AniversariantesPage() {
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get("/aniversariantes");
        const data: ApiAniversariante[] = response.data.aniversariantes || [];

        const mapped: BirthdayItem[] = data.map((item) => ({
          id: item.auth_user_id,
          name: item.nome,
          role: item.profession || item.empresa_role || "Colaborador",
          date: item.data_nascimento,
          sector: undefined,
          avatarUrl: item.avatar_url,
        }));

        setBirthdays(mapped);
      } catch (err) {
        console.error("Erro ao carregar aniversariantes:", err);
        setError("Não foi possível carregar a lista de aniversariantes.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const withInfo = birthdays.map((b) => ({
    ...b,
    info: getNextBirthdayInfo(b.date),
  }));

  const todayBirthdays = withInfo.filter((b) => b.info.daysUntil === 0);
  const upcomingBirthdays = withInfo
    .filter((b) => b.info.daysUntil > 0)
    .sort((a, b) => a.info.daysUntil - b.info.daysUntil);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">
          Aniversariantes
        </h2>
      </header>

      {loading && (
        <p className="text-sm text-slate-500">Carregando aniversariantes...</p>
      )}

      {error && !loading && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && birthdays.length === 0 && (
        <p className="text-sm text-slate-500">
          Nenhum aniversariante encontrado para esta empresa.{" "}
          Preencha a data de nascimento dos usuários em Configurações do
          usuário.
        </p>
      )}

      {!loading && !error && birthdays.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          {/* Hoje */}
          <div className="rounded-2xl border border-slate-200 bg-[#FEFCFB] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Hoje</h3>
                <p className="text-xs text-slate-500">
                  Quem está soprando velinhas agora.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-100">
                <PartyPopper size={14} strokeWidth={2} />
                {todayBirthdays.length}{" "}
                {todayBirthdays.length === 1 ? "aniversário" : "aniversários"}
              </span>
            </div>

            {todayBirthdays.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Ninguém faz aniversário hoje.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {todayBirthdays.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5 shadow-[0_1px_0_rgba(16,185,129,0.15)]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={b.name}
                        avatarUrl={b.avatarUrl}
                        variant="today"
                      />
                      <div>
                        <p className="text-sm font-semibold text-emerald-950">
                          {b.name}
                        </p>
                        <p className="text-xs text-emerald-900/80">
                          {b.role}
                          {b.sector ? ` • ${b.sector}` : null}
                          {` • Faz ${b.info.ageAtNext} anos`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-100">
                        <Cake size={12} strokeWidth={2} />
                        Hoje
                      </span>
                      <span className="text-[11px] font-medium text-emerald-900/80">
                        {formatDate(b.date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Próximos dias */}
          <div className="rounded-2xl border border-slate-200 bg-[#FEFCFB] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Próximos dias
                </h3>
                <p className="text-xs text-slate-500">
                  Quem está chegando perto do parabéns.
                </p>
              </div>
              {upcomingBirthdays.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                  <Clock size={14} strokeWidth={2} />
                  {upcomingBirthdays.length}{" "}
                  {upcomingBirthdays.length === 1 ? "próximo" : "próximos"}
                </span>
              )}
            </div>

            {upcomingBirthdays.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Nenhum aniversário cadastrado para os próximos dias.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {upcomingBirthdays.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={b.name}
                        avatarUrl={b.avatarUrl}
                        variant="upcoming"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {b.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {b.role}
                          {b.sector ? ` • ${b.sector}` : null}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Em{" "}
                          <span className="font-semibold text-[#034078]">
                            {b.info.daysUntil} dia
                            {b.info.daysUntil === 1 ? "" : "s"}
                          </span>{" "}
                          • Vai fazer{" "}
                          <span className="font-semibold text-[#034078]">
                            {b.info.ageAtNext} anos
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                        {formatDate(b.date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
