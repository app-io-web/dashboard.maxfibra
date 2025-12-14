// src/pages/SupportTicketPage.tsx
import { useEffect, useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { LifeBuoy, ArrowLeft } from "lucide-react";
import {
  CATEGORY_OPTIONS,
  STATUS_LABEL,
  type SupportTicket,
  type SupportTicketMessage,
  type SupportTicketStatus,
  type SupportTicketAttachment,
} from "../types/support";
import { SupportTicketDetail } from "../components/support/SupportTicketDetail";

function statusBadgeClass(status: SupportTicketStatus) {
  switch (status) {
    case "ENVIADO":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "PENDENTE":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "ATRIBUIDO":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "SOLUCIONADO":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "FECHADO":
      return "bg-slate-200 text-slate-700 border border-slate-300";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export function SupportTicketPage() {
  const { id } = useParams<{ id: string }>();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [attachments, setAttachments] = useState<SupportTicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTicket() {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.get<{
        ticket: SupportTicket;
        messages: SupportTicketMessage[];
        attachments: SupportTicketAttachment[];
      }>(`/support/tickets/${id}`);

      setTicket(res.data.ticket);
      setMessages(res.data.messages || []);
      setAttachments(res.data.attachments || []);
    } catch (err) {
      console.error("Erro ao carregar chamado:", err);
      setError("Não foi possível carregar o chamado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply(e: FormEvent) {
    e.preventDefault();
    if (!ticket || !newMessage.trim()) return;

    // se estiver solucionado ou fechado, não deixa enviar
    if (ticket.status === "SOLUCIONADO" || ticket.status === "FECHADO") {
      return;
    }

    try {
      setSendingReply(true);
      const res = await api.post<SupportTicketMessage>(
        `/support/tickets/${ticket.id}/messages`,
        { message: newMessage }
      );

      setMessages((old) => [...old, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Erro ao enviar resposta:", err);
    } finally {
      setSendingReply(false);
    }
  }

  async function handleUploadAttachments(files: FileList | null) {
    if (!ticket || !files || files.length === 0) return;

    // se estiver solucionado/fechado, não faz nada
    if (ticket.status === "SOLUCIONADO" || ticket.status === "FECHADO") {
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      setUploadingAttachments(true);

      const res = await api.post<SupportTicketAttachment[]>(
        `/support/tickets/${ticket.id}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAttachments((old) => [...old, ...(res.data || [])]);
    } catch (err) {
      console.error("Erro ao enviar anexos:", err);
      // opcional: setar erro global
    } finally {
      setUploadingAttachments(false);
    }
  }

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* topo: voltar + ícone */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/support"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-3 h-3" />
          Voltar para suporte
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <LifeBuoy className="w-5 h-5 text-brand-500" />
        <h1 className="text-xl font-semibold text-slate-900">
          Detalhes do chamado
        </h1>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm text-sm text-slate-500">
          Carregando chamado...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-600">
          {error}
        </div>
      ) : !ticket ? (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-500">
          Chamado não encontrado.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          {/* header do ticket */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                #{ticket.id} — {ticket.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span>
                  Categoria:{" "}
                  {
                    CATEGORY_OPTIONS.find(
                      (c) => c.value === ticket.category
                    )?.label
                  }
                </span>
                <span>•</span>
                <span>
                  Criado em:{" "}
                  {new Date(ticket.created_at).toLocaleString("pt-BR")}
                </span>
                <span>•</span>
                <span>
                  Atualizado em:{" "}
                  {new Date(ticket.updated_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            <span
              className={[
                "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold",
                statusBadgeClass(ticket.status),
              ].join(" ")}
            >
              {STATUS_LABEL[ticket.status]}
            </span>
          </div>

          {/* “chat” do chamado + caixa de resposta */}
          <SupportTicketDetail
            ticket={ticket}
            messages={messages}
            attachments={attachments}
            newMessage={newMessage}
            sendingReply={sendingReply}
            uploadingAttachments={uploadingAttachments}
            onChangeNewMessage={setNewMessage}
            onSubmitReply={handleSendReply}
            onUploadAttachments={handleUploadAttachments}
            canReply={
              ticket.status !== "SOLUCIONADO" && ticket.status !== "FECHADO"
            }
          />
        </div>
      )}
    </div>
  );
}
