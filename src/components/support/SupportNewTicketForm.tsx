// src/components/support/SupportNewTicketForm.tsx
import { FormEvent, ChangeEvent } from "react";
import { CATEGORY_OPTIONS, type SupportTicketCategory } from "../../types/support";
import { Paperclip, UploadCloud } from "lucide-react";

type Props = {
  category: SupportTicketCategory;
  title: string;
  description: string;
  subCategoryText: string;
  creating: boolean;

  // NOVO: arquivos selecionados
  files: File[];
  onChangeFiles: (files: File[]) => void;

  onChangeCategory: (value: SupportTicketCategory) => void;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeSubCategoryText: (value: string) => void;

  onSubmit: (e: FormEvent) => void;
};

export function SupportNewTicketForm({
  category,
  title,
  description,
  subCategoryText,
  creating,
  files,
  onChangeFiles,
  onChangeCategory,
  onChangeTitle,
  onChangeDescription,
  onChangeSubCategoryText,
  onSubmit,
}: Props) {
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    // converte FileList em array
    const arr = Array.from(list);
    onChangeFiles(arr);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]" />
          Abrir novo chamado
        </h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Categoria */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => onChangeCategory(e.target.value as SupportTicketCategory)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assunto */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Assunto (título)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Ex.: Erro ao salvar cadastro de cliente"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-inner placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Detalhes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Detalhes
          </label>
          <textarea
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder="Descreva o que aconteceu, passos para reproduzir, prints etc."
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-inner placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Observações / Subcategoria */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Observações / Subcategoria (opcional)
          </label>
          <input
            type="text"
            value={subCategoryText}
            onChange={(e) => onChangeSubCategoryText(e.target.value)}
            placeholder="Ex.: Criação de usuário para novo colaborador"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-inner placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* NOVO BLOCO: Anexos */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Paperclip className="w-3 h-3 text-slate-500" />
            Anexos (imagem ou PDF)
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-brand-400 hover:bg-white transition">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-700">
                  Clique para selecionar arquivos
                </span>
                <span className="text-[11px] text-slate-500">
                  PNG, JPG ou PDF – até 5MB cada
                </span>
              </div>
            </div>
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
          </label>

          {files.length > 0 && (
            <div className="mt-1 space-y-1.5">
              <p className="text-[11px] text-slate-500">
                {files.length} arquivo(s) selecionado(s):
              </p>
              <ul className="space-y-0.5 rounded-lg bg-slate-50/70 p-2">
                {files.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-[11px] text-slate-600"
                  >
                    <span className="truncate max-w-[220px]">{file.name}</span>
                    <span className="text-slate-400">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Botão enviar */}
        <div className="pt-1 flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition",
              "bg-brand-500 text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-300",
              creating ? "opacity-70 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
              <span className="text-xs">✈️</span>
            </span>
            {creating ? "Enviando..." : "Enviar chamado"}
          </button>
        </div>
      </form>
    </div>
  );
}
