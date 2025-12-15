import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { DashboardNote } from "../../components/notes/DashboardNoteCard";

type UseDashboardPinnedNotesResult = {
  notes: DashboardNote[];
  notesLoading: boolean;
  notesError: string | null;
};

export function useDashboardPinnedNotes(
  empresaId: string | null
): UseDashboardPinnedNotesResult {
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPinnedNotes() {
      if (!empresaId) {
        // sem empresa selecionada ainda
        setNotes([]);
        setNotesLoading(false);
        setNotesError(null);
        return;
      }

      try {
        setNotesLoading(true);
        setNotesError(null);

        const res = await api.get("/notes/dashboard", {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          params: { _ts: Date.now() }, // cache-buster
        });

        const apiNotes: DashboardNote[] = res.data?.notes || [];

        if (isMounted) {
          setNotes(apiNotes);
        }
      } catch (err) {
        console.error("Erro ao carregar notas do dashboard:", err);
        if (isMounted) {
          setNotes([]);
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
  }, [empresaId]);

  return { notes, notesLoading, notesError };
}
