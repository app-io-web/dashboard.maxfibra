import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { NoteContentRenderer } from "../components/notes/NoteContentRenderer";
import { NoteEditorModal } from "../components/notes/NoteEditorModal";
import { NoteViewModal } from "../components/notes/NoteViewModal";
import type { NoteEditorSubmitValues } from "../components/notes/NoteEditorModal";

type ApiNote = {
  id: string;
  auth_empresa_id: string | null;
  auth_user_id: string;
  titulo: string;
  subtitulo: string | null;
  anotacao: string | null;
  show_on_dashboard?: boolean;
  valid_until?: string | null;
  is_urgent?: boolean;
  created_at: string;
  updated_at: string;
};

type Note = {
  id: string;
  title: string;
  subtitle?: string | null;
  content: string;
  showOnDashboard: boolean;
  createdAt: string;
  expiresAt?: string | null;
  isUrgent: boolean;
};

function mapApiNote(n: ApiNote): Note {
  return {
    id: n.id,
    title: n.titulo,
    subtitle: n.subtitulo,
    content: n.anotacao || "",
    showOnDashboard: !!n.show_on_dashboard,
    createdAt: n.created_at,
    expiresAt: n.valid_until || null,
    isUrgent: !!n.is_urgent,
  };
}

function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorInitialData, setEditorInitialData] =
    useState<NoteEditorSubmitValues | undefined>(undefined);

  // modal visualização
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // modal de confirmação de exclusão
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNotes() {
      try {
        const res = await api.get("/notes");
        const apiNotes: ApiNote[] = res.data.notes || [];
        const mapped = apiNotes.map(mapApiNote);
        if (isMounted) {
          setNotes(mapped);
        }
      } catch (err) {
        console.error("Erro ao carregar notas:", err);
        if (isMounted) {
          setError("Erro ao carregar notas.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  function isExpired(note: Note): boolean {
    if (!note.expiresAt) return false;
    const now = new Date();
    const end = new Date(note.expiresAt);
    return end.getTime() < now.getTime();
  }

  function openCreateModal() {
    setEditorMode("create");
    setEditorInitialData(undefined);
    setEditorOpen(true);
  }

  function openEditModal(note: Note) {
    setEditorMode("edit");
    setEditorInitialData({
      id: note.id,
      title: note.title,
      content: note.content,
      showOnDashboard: note.showOnDashboard,
      validUntil: toDateInputValue(note.expiresAt ?? null),
      isUrgent: note.isUrgent,
    });
    setEditorOpen(true);
  }

  async function handleSaveFromModal(values: NoteEditorSubmitValues) {
    setError(null);

    const payload = {
      titulo: values.title || "Sem título",
      subtitulo: null,
      anotacao: values.content || null,
      showOnDashboard: values.showOnDashboard,
      validUntil: values.validUntil || null,
      isUrgent: values.isUrgent,
    };

    try {
      if (values.id) {
        const res = await api.put(`/notes/${values.id}`, payload);
        const updated: ApiNote = res.data.note;
        const mapped = mapApiNote(updated);

        setNotes((prev) =>
          prev.map((n) => (n.id === mapped.id ? mapped : n))
        );
      } else {
        const res = await api.post("/notes", payload);
        const created: ApiNote = res.data.note;
        const mapped = mapApiNote(created);
        setNotes((prev) => [mapped, ...prev]);
      }
    } catch (err) {
      console.error("Erro ao salvar nota:", err);
      setError("Erro ao salvar nota. Tenta de novo daqui a pouco.");
      throw err;
    }
  }

  // toggle de checklist direto no card, salvando no backend
  async function handleToggleChecklist(note: Note, newContent: string) {
    try {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === note.id
            ? {
                ...n,
                content: newContent,
              }
            : n
        )
      );

      const payload = {
        titulo: note.title || "Sem título",
        subtitulo: note.subtitle ?? null,
        anotacao: newContent,
        showOnDashboard: note.showOnDashboard,
        validUntil: note.expiresAt ? note.expiresAt.slice(0, 10) : null,
        isUrgent: note.isUrgent,
      };

      await api.put(`/notes/${note.id}`, payload);
    } catch (err) {
      console.error("Erro ao atualizar checklist da nota:", err);
      setError(
        "Erro ao atualizar checklist. Pode ser necessário recarregar a página."
      );
    }
  }

  async function confirmDeleteNote() {
    if (!noteToDelete) return;
    setError(null);

    try {
      await api.delete(`/notes/${noteToDelete.id}`);

      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));

      // se estiver visualizando essa nota, fecha o modal
      setViewingNote((current) =>
        current && current.id === noteToDelete.id ? null : current
      );

      setNoteToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir nota:", err);
      setError("Erro ao excluir nota. Tenta de novo daqui a pouco.");
    }
  }

  function cancelDeleteNote() {
    setNoteToDelete(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Anotações internas
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Bloco rápido por empresa/usuário. Dá pra marcar pro dashboard,
            definir validade e destacar lembretes urgentes.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600"
        >
          Adicionar nova nota
        </button>
      </header>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando notas...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhuma nota ainda. Clique em &quot;Adicionar nova nota&quot; para
          criar a primeira.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => {
            const expired = isExpired(note);
            const isLong = (note.content || "").length > 500;
            const charLimit = isLong ? 250 : undefined;

            return (
              <article
                key={note.id}
                className={`flex flex-col gap-2 rounded-xl border bg-white p-3 shadow-sm ${
                  note.isUrgent
                    ? "border-red-300"
                    : expired
                    ? "border-amber-300"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                      {note.title}
                    </h3>
                    {note.subtitle && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {note.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-wrap gap-1 justify-end">
                      {note.isUrgent && (
                        <span className="inline-flex items-center rounded-full bg-red-50 border border-red-300 px-2 py-[1px] text-[9px] font-medium text-red-700">
                          Urgente
                        </span>
                      )}
                      {!note.showOnDashboard && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-[1px] text-[9px] font-medium text-slate-500 bg-slate-50">
                          Apenas Notas
                        </span>
                      )}
                      {note.showOnDashboard && (
                        <span className="inline-flex items-center rounded-full border border-amber-400 px-2 py-[1px] text-[9px] font-medium text-amber-700 bg-amber-50">
                          Dashboard
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <NoteContentRenderer
                  content={note.content}
                  interactive
                  onToggleChecklistItem={(newContent) =>
                    handleToggleChecklist(note, newContent)
                  }
                  variant="preview"
                  charLimit={charLimit}
                />

                {note.expiresAt && (
                  <p
                    className={`mt-1 text-[10px] ${
                      expired ? "text-red-500" : "text-amber-600"
                    }`}
                  >
                    Validade:{" "}
                    {new Date(note.expiresAt).toLocaleDateString("pt-BR")}
                    {expired ? " (vencida)" : ""}
                  </p>
                )}

                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">
                    Criada em{" "}
                    {new Date(note.createdAt).toLocaleString("pt-BR")}
                  </p>

                  <div className="flex items-center gap-2">
                    {isLong && (
                      <span className="text-[9px] text-slate-400">
                        Conteúdo reduzido
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setViewingNote(note)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M2.5 12s3-6 9.5-6 9.5 6 9.5 6-3 6-9.5 6S2.5 12 2.5 12Z"
                          strokeWidth={1.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          strokeWidth={1.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Ver
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(note)}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-medium"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => setNoteToDelete(note)}
                      className="text-[10px] text-red-600 hover:text-red-800 font-medium"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <NoteEditorModal
        isOpen={editorOpen}
        mode={editorMode}
        initialData={editorInitialData}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSaveFromModal}
      />

      {viewingNote && (
        <NoteViewModal
          isOpen={true}
          onClose={() => setViewingNote(null)}
          title={viewingNote.title}
          subtitle={viewingNote.subtitle}
          content={viewingNote.content}
          createdAt={new Date(viewingNote.createdAt)}
          expiresAt={
            viewingNote.expiresAt ? new Date(viewingNote.expiresAt) : null
          }
          isUrgent={viewingNote.isUrgent}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {noteToDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900">
              Excluir anotação
            </h3>
            <p className="mt-2 text-xs text-slate-600">
              Tem certeza que deseja excluir a anotação{" "}
              <span className="font-semibold text-slate-900">
                “{noteToDelete.title || "Sem título"}”
              </span>
              ?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelDeleteNote}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteNote}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Excluir mesmo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
