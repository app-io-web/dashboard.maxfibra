import { useState } from "react";
import { Cake } from "lucide-react";

import { BirthdayManualModal } from "../components/birthdays/BirthdayManualModal";
import { useEmpresaSettingsPermissions } from "../config/useEffects/useEmpresaSettingsPermissions";

import { useBirthdays } from "../features/birthdays/hooks/useBirthdays";
import { BirthdaySectionCard } from "../features/birthdays/components/BirthdaySectionCard";
import type { BirthdayItem } from "../features/birthdays/types";
import { api } from "../lib/api";

export function AniversariantesPage() {
  const { canManageUsers } = useEmpresaSettingsPermissions();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    loading,
    error,
    birthdays,
    todayBirthdays,
    upcomingBirthdays,
    appendBirthday,
    removeBirthdayById,
  } = useBirthdays();

  async function handleDeleteManual(id: string) {
    // só garantia extra (UI já esconde, mas vai que né…)
    if (!canManageUsers) return;

    const ok = window.confirm("Deseja remover esse aniversariante manual?");
    if (!ok) return;

    try {
      await api.delete(`/aniversariantes/manual/${id}`);
      removeBirthdayById(id);
    } catch (err) {
      console.error("Erro ao remover aniversariante manual:", err);
      alert("Não foi possível remover o aniversariante manual.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Aniversariantes</h2>
          <p className="text-xs text-slate-500">Visão geral dos aniversários desta empresa.</p>
        </div>

        {canManageUsers && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="
              inline-flex items-center gap-2 rounded-xl
              border border-blue-200 bg-blue-50
              px-3 py-1.5 text-xs font-medium text-blue-900
              shadow-sm hover:bg-blue-100 hover:border-blue-300
              transition
            "
          >
            <Cake size={14} />
            <span>Cadastrar aniversariante</span>
          </button>
        )}
      </header>

      {loading && <p className="text-sm text-slate-500">Carregando aniversariantes...</p>}
      {error && !loading && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && birthdays.length === 0 && (
        <p className="text-sm text-slate-500">
          Nenhum aniversariante encontrado para esta empresa. Preencha a data de nascimento dos usuários em
          Configurações do usuário ou cadastre aniversariantes manualmente.
        </p>
      )}

      {!loading && !error && birthdays.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          <BirthdaySectionCard
            title="Hoje"
            subtitle="Quem está soprando velinhas agora."
            variant="today"
            items={todayBirthdays}
            canDeleteManual={canManageUsers}
            onDeleteManual={handleDeleteManual}
          />

          <BirthdaySectionCard
            title="Próximos dias"
            subtitle="Quem está chegando perto do parabéns."
            variant="upcoming"
            items={upcomingBirthdays}
            canDeleteManual={canManageUsers}
            onDeleteManual={handleDeleteManual}
          />
        </section>
      )}

      {canManageUsers && (
        <BirthdayManualModal
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(novo: BirthdayItem) => appendBirthday(novo)}
        />
      )}
    </div>
  );
}
