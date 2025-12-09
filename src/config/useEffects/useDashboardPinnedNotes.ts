import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { DashboardNote } from "../../components/notes/DashboardNoteCard";

type UseDashboardPinnedNotesResult = {
  notes: DashboardNote[];
  notesLoading: boolean;
  notesError: string | null;
};

export function useDashboardPinnedNotes(): UseDashboardPinnedNotesResult {
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPinnedNotes() {
      try {
        const res = await api.get("/notes/dashboard");
        const apiNotes: DashboardNote[] = res.data.notes || [];
        if (isMounted) {
          setNotes(apiNotes);
        }
      } catch (err) {
        console.error("Erro ao carregar notas do dashboard:", err);
        if (isMounted) {
          setNotesError("Erro ao carregar notas destacadas.");
        }
      } finally {
        if (isMounted) {
          setNotesLoading(false);
        }
      }
    }

    loadPinnedNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  return { notes, notesLoading, notesError };
}
