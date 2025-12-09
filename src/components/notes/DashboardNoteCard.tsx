import { useState } from "react";
import { api } from "../../lib/api";
import { NoteContentRenderer } from "./NoteContentRenderer";

export type DashboardNote = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  anotacao: string | null;
  show_on_dashboard?: boolean;
  valid_until?: string | null;
  is_urgent?: boolean;
  created_at: string;
};

type DashboardNoteCardProps = {
  note: DashboardNote;
};

// função simples para detectar se o conteúdo possui imagem (markdown ou HTML)
function hasImage(content: string) {
  if (!content) return false;

  const hasMarkdownImage = /!\[[^\]]*]\([^)]*\)/i.test(content); // ![alt](url)
  const hasHtmlImage = /<img\s/i.test(content); // <img ...>

  return hasMarkdownImage || hasHtmlImage;
}

export function DashboardNoteCard({ note }: DashboardNoteCardProps) {
  const [content, setContent] = useState(note.anotacao || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImages, setShowImages] = useState(false);

  const createdAt = new Date(note.created_at);

  const expiresAt = note.valid_until ? new Date(note.valid_until) : null;
  const expired =
    expiresAt && !Number.isNaN(expiresAt.getTime())
      ? expiresAt.getTime() < Date.now()
      : false;

  async function handleToggleChecklist(newContent: string) {
    setError(null);
    setContent(newContent);
    setSaving(true);

    try {
      const payload = {
        titulo: note.titulo || "Sem título",
        subtitulo: note.subtitulo ?? null,
        anotacao: newContent,
        showOnDashboard: note.show_on_dashboard ?? true,
        validUntil: note.valid_until ? note.valid_until.slice(0, 10) : null,
        isUrgent: note.is_urgent ?? false,
      };

      await api.put(`/notes/${note.id}`, payload);
    } catch (err) {
      console.error("Erro ao atualizar checklist (dashboard):", err);
      setError("Erro ao atualizar checklist.");
      setContent(note.anotacao || "");
    } finally {
      setSaving(false);
    }
  }

  const contentHasImage = hasImage(content);

  return (
    <article
      className={`flex flex-col gap-2 rounded-xl border bg-white p-3 shadow-sm ${
        note.is_urgent
          ? "border-red-300"
          : expired
          ? "border-amber-300"
          : "border-slate-200"
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            {note.titulo}
          </h4>
          {note.subtitulo && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              {note.subtitulo}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap gap-1 justify-end">
            {note.is_urgent && (
              <span className="inline-flex items-center rounded-full bg-red-50 border border-red-300 px-2 py-[1px] text-[9px] font-medium text-red-700">
                Urgente
              </span>
            )}

            {note.show_on_dashboard && (
              <span className="inline-flex items-center rounded-full border border-amber-400 px-2 py-[1px] text-[9px] font-medium text-amber-700 bg-amber-50">
                Dashboard
              </span>
            )}
          </div>

          {saving && (
            <span className="text-[9px] text-slate-400">
              Salvando alterações...
            </span>
          )}
        </div>
      </div>

      {/* Botão de mostrar imagem */}
      {contentHasImage && (
        <button
          onClick={() => setShowImages((prev) => !prev)}
          className="self-start text-[11px] mt-1 mb-1 px-2 py-[3px] rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
        >
          {showImages ? "Ocultar imagens" : "Mostrar imagens"}
        </button>
      )}

      {/* Conteúdo */}
      <div className="max-h-40 overflow-y-auto pr-1">
        <NoteContentRenderer
          content={content}
          interactive
          onToggleChecklistItem={handleToggleChecklist}
          showImages={showImages}
          variant="preview"
        />
      </div>

      {/* Validade */}
      {expiresAt && !Number.isNaN(expiresAt.getTime()) && (
        <p
          className={`mt-1 text-[10px] ${
            expired ? "text-red-500" : "text-amber-600"
          }`}
        >
          Validade: {expiresAt.toLocaleDateString("pt-BR")}
          {expired ? " (vencida)" : ""}
        </p>
      )}

      {/* Criada em */}
      <div className="mt-1 flex items-center justify-between">
        <p className="text-[10px] text-slate-400">
          Criada em {createdAt.toLocaleString("pt-BR")}
        </p>
      </div>

      {error && (
        <p className="text-[10px] text-red-500 mt-1">{error}</p>
      )}
    </article>
  );
}
