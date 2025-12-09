// src/components/support/SupportTicketDetail.tsx
import { FormEvent } from "react";
import type {
  SupportTicket,
  SupportTicketMessage,
  SupportTicketAttachment,
} from "../../types/support";

type Props = {
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
  attachments: SupportTicketAttachment[];
  newMessage: string;
  sendingReply: boolean;
  uploadingAttachments: boolean;
  canReply: boolean;
  onChangeNewMessage: (value: string) => void;
  onSubmitReply: (e: FormEvent<HTMLFormElement>) => void;
  onUploadAttachments: (files: FileList | null) => void;
};

function isImageMime(mime: string | null | undefined) {
  return !!mime && mime.startsWith("image/");
}

const API_BASE_URL =
  (import.meta.env.VITE_CENTRAL_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "").replace(/\/+$/, "");

function resolveFileUrl(fileUrl: string): string {
  if (!fileUrl) return fileUrl;

  // já é absolute?
  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  // garante que comece com /
  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;

  // se API_BASE_URL está vazio == ENV NÃO CARREGOU
  if (!API_BASE_URL) {
    console.warn("⚠️ VITE_CENTRAL_API_URL NÃO CARREGADO! Usando path relativo.");
    return path;
  }

  return `${API_BASE_URL}${path}`;
}


export function SupportTicketDetail({
  ticket,
  messages,
  attachments,
  newMessage,
  sendingReply,
  uploadingAttachments,
  canReply,
  onChangeNewMessage,
  onSubmitReply,
  onUploadAttachments,
}: Props) {
  const anyTicket = ticket as any;

  const rawAttachmentUrl: string | null =
    anyTicket.screenshot_url ||
    anyTicket.attachment_url ||
    anyTicket.image_url ||
    null;

  const attachmentUrl = rawAttachmentUrl
    ? resolveFileUrl(rawAttachmentUrl)
    : null;

  const attachmentName: string =
    anyTicket.attachment_name || "Arquivo em anexo";

  const hasExtraAttachments = attachments && attachments.length > 0;

  return (
    <div className="space-y-6">
      {/* Detalhes do chamado */}
      <div className="border-t border-slate-200 pt-4">
        <h2 className="text-xs font-semibold text-slate-500 tracking-wide mb-2">
          DETALHES DO CHAMADO
        </h2>

        {ticket.subject && (
          <p className="text-sm font-semibold text-slate-900 mb-1">
            {ticket.subject}
          </p>
        )}

        {ticket.description && (
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {ticket.description}
          </p>
        )}

        {/* Anexo inicial (se o ticket tiver esse campo legado) */}
        {attachmentUrl && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
              Anexo inicial
            </p>

            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-slate-200 bg-slate-50/80 p-3 hover:border-brand-400 hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="w-full max-h-72 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img
                    src={attachmentUrl}
                    alt={attachmentName}
                    className="w-full h-full max-h-72 object-contain"
                  />
                </div>
                <span className="text-[11px] text-slate-500 truncate">
                  {attachmentName} (clique para abrir em outra aba)
                </span>
              </div>
            </a>
          </div>
        )}

        {/* Anexos enviados */}
        {hasExtraAttachments && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Anexos enviados
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {attachments.map((att) => {
                const url = resolveFileUrl(att.file_url);

                return (
                  <a
                    key={att.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl border border-slate-200 bg-slate-50/80 p-3 hover:border-brand-400 hover:bg-slate-50 transition-colors flex flex-col gap-2"
                  >
                    {isImageMime(att.mime_type) ? (
                      <div className="w-full max-h-52 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <img
                          src={url}
                          alt={att.file_name}
                          className="w-full h-full max-h-52 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-500">
                        Arquivo: {att.mime_type || "arquivo"}
                      </div>
                    )}

                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-600 truncate">
                        {att.file_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(att.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mensagens */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhuma interação no chamado ainda.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-700">
                  {msg.author_name || msg.author_role || "Usuário"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-line">
                {msg.message}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Responder + anexar (mantém o que já tínhamos) */}
      <form onSubmit={onSubmitReply} className="mt-4 space-y-3">
        <label className="text-xs font-medium text-slate-600">
          Escreva sua resposta...
        </label>

        <textarea
          rows={4}
          value={newMessage}
          onChange={(e) => onChangeNewMessage(e.target.value)}
          disabled={!canReply}
          placeholder={
            canReply
              ? "Digite sua mensagem para o suporte..."
              : "Chamado solucionado/fechado. Não é possível responder."
          }
          className={[
            "w-full rounded-2xl border px-3 py-2 text-sm resize-none",
            "bg-white/90 text-slate-800 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400",
            !canReply ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "",
          ].join(" ")}
        />

        <div className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Anexar arquivos</span>
          <p className="text-[11px] text-slate-400">
            Imagens ou PDF, até 5 arquivos (máx. 5MB cada).
          </p>

          <label
            className={[
              "mt-1 inline-flex items-center justify-between gap-2 rounded-xl border border-dashed px-3 py-2",
              "border-slate-300 bg-slate-50/70 hover:border-brand-400 hover:bg-slate-50",
              "text-xs text-slate-600 cursor-pointer transition-colors",
              !canReply || uploadingAttachments
                ? "opacity-60 cursor-not-allowed"
                : "",
            ].join(" ")}
          >
            <span className="truncate">
              {uploadingAttachments
                ? "Enviando anexos..."
                : "Clique para selecionar arquivos"}
            </span>
            <span className="text-[10px] text-slate-400">.png .jpg .pdf</span>

            <input
              type="file"
              multiple
              className="hidden"
              disabled={!canReply || uploadingAttachments}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  onUploadAttachments(files);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              !canReply || sendingReply || newMessage.trim().length === 0
            }
            className={[
              "inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold shadow-sm",
              canReply && newMessage.trim().length > 0 && !sendingReply
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "bg-slate-200 text-slate-500 cursor-not-allowed",
              "transition-colors",
            ].join(" ")}
          >
            {sendingReply ? "Enviando..." : "Responder"}
          </button>
        </div>
      </form>
    </div>
  );
}
