import { FormEvent, useEffect, useState } from "react";

export type NoteEditorSubmitValues = {
  id?: string;
  title: string;
  content: string;
  showOnDashboard: boolean;
  validUntil: string; // "YYYY-MM-DD" ou ""
  isUrgent: boolean;
};

type NoteEditorModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: NoteEditorSubmitValues;
  onClose: () => void;
  onSubmit: (values: NoteEditorSubmitValues) => Promise<void>;
};

export function NoteEditorModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: NoteEditorModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showOnDashboard, setShowOnDashboard] = useState(false);
  const [validUntil, setValidUntil] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal interno pra imagem
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setError(null);

    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setShowOnDashboard(!!initialData.showOnDashboard);
      setValidUntil(initialData.validUntil || "");
      setIsUrgent(!!initialData.isUrgent);
    } else {
      setTitle("");
      setContent("");
      setShowOnDashboard(false);
      setValidUntil("");
      setIsUrgent(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  function insertSnippet(snippet: string) {
    setContent((prev) => {
      const needsNewline = prev && !prev.endsWith("\n") ? "\n" : "";
      return prev + needsNewline + snippet;
    });
  }

  function handleAddChecklist() {
    insertSnippet("- [ ] Item 1\n- [ ] Item 2\n");
  }

  function handleOpenImageModal() {
    setImageUrl("");
    setImageAlt("");
    setImageModalOpen(true);
  }

  function handleConfirmImage() {
    if (!imageUrl.trim()) {
      return;
    }
    const altText = imageAlt.trim() || "imagem";
    insertSnippet(`![${altText}](${imageUrl.trim()})\n`);
    setImageModalOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    setSaving(true);
    setError(null);

    const payload: NoteEditorSubmitValues = {
      id: initialData?.id,
      title: title.trim() || "Sem título",
      content: content.trim(),
      showOnDashboard,
      validUntil,
      isUrgent,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar nota (modal):", err);
      setError("Erro ao salvar nota. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Overlay principal do modal de nota */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              {mode === "create" ? "Adicionar nova nota" : "Editar nota"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Fechar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row">
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Título da nota"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                type="submit"
                disabled={saving}
                className="mt-1 inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed md:mt-0"
              >
                {saving
                  ? mode === "create"
                    ? "Criando..."
                    : "Salvando..."
                  : mode === "create"
                  ? "Adicionar nota"
                  : "Salvar alterações"}
              </button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <textarea
                className="h-32 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Escreva detalhes, checklists, links, imagens..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="w-full md:w-64 flex flex-col gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-medium text-slate-700">
                    Validade (opcional)
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Dá pra usar depois no dashboard pra destacar notas vencidas
                    ou perto de vencer.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                  />
                  <span>Lembrete urgente</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={showOnDashboard}
                    onChange={(e) => setShowOnDashboard(e.target.checked)}
                  />
                  <span>Mostrar no dashboard</span>
                </label>

                <div className="border-t border-slate-100 pt-2 space-y-1">
                  <p className="text-[11px] font-medium text-slate-700">
                    Atalhos de formatação
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddChecklist}
                      className="rounded-full border border-slate-200 px-2 py-[3px] text-[11px] hover:bg-slate-50"
                    >
                      + Checklist
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenImageModal}
                      className="rounded-full border border-slate-200 px-2 py-[3px] text-[11px] hover:bg-slate-50"
                    >
                      + Imagem
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Checklist e imagens já aparecem renderizados nos cards,
                    com checkbox clicável.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </form>
        </div>
      </div>

      {/* Modal interno específico pra adicionar imagem (sem prompt do navegador) */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Adicionar imagem
            </h4>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  URL da imagem
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  placeholder="https://exemplo.com/imagem.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Descrição (alt)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  placeholder="Ex: Banner da campanha X"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmImage}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                disabled={!imageUrl.trim()}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
