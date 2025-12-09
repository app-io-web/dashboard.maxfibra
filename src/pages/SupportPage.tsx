// src/pages/SupportPage.tsx
import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import { api } from "../lib/api";

import {
  CATEGORY_OPTIONS,
  type SupportTicket,
  type SupportTicketCategory,
} from "../types/support";

import { SupportNewTicketForm } from "../components/support/SupportNewTicketForm";
import { SupportTicketList } from "../components/support/SupportTicketList";

export function SupportPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const [category, setCategory] = useState<SupportTicketCategory>(
    (CATEGORY_OPTIONS[0]?.value as SupportTicketCategory) ?? "ERRO_SISTEMA"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subCategoryText, setSubCategoryText] = useState("");

  const [creating, setCreating] = useState(false);

  // NOVO: arquivos selecionados
  const [files, setFiles] = useState<File[]>([]);

  async function loadTickets() {
    try {
      setLoadingTickets(true);
      const res = await api.get<SupportTicket[]>("/support/tickets", {
        params: { mine_only: true },
      });
      setTickets(res.data);
    } catch (err) {
      console.error("Erro ao carregar chamados:", err);
    } finally {
      setLoadingTickets(false);
    }
  }

  async function handleCreateTicket(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setCreating(true);

      const payload = {
        category,
        subcategory: subCategoryText || null,
        title,
        description,
      };

      // 1) cria o chamado
      const res = await api.post<SupportTicket>("/support/tickets", payload);
      const ticket = res.data;

      // 2) se tiver arquivos, envia pra rota de anexos
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });

        await api.post(
          `/support/tickets/${ticket.id}/attachments`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      // 3) limpa form
      setTitle("");
      setDescription("");
      setSubCategoryText("");
      setCategory(
        (CATEGORY_OPTIONS[0]?.value as SupportTicketCategory) ?? "ERRO_SISTEMA"
      );
      setFiles([]);

      // 4) recarrega lista (ou poderia só dar push)
      await loadTickets();
    } catch (err) {
      console.error("Erro ao criar chamado:", err);
    } finally {
      setCreating(false);
    }
  }

  function handleSelectTicket(ticket: SupportTicket) {
    navigate(`/support/tickets/${ticket.id}`);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-brand-500" />
            <h1 className="text-xl font-semibold text-slate-900">
              Suporte & Chamados
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Abra chamados para erros, dúvidas e melhorias. Você será notificado
            sempre que houver uma resposta.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] items-start">
        {/* Card: Novo chamado */}
        <SupportNewTicketForm
          category={category}
          title={title}
          description={description}
          subCategoryText={subCategoryText}
          creating={creating}
          files={files}
          onChangeFiles={setFiles}
          onChangeCategory={setCategory}
          onChangeTitle={setTitle}
          onChangeDescription={setDescription}
          onChangeSubCategoryText={setSubCategoryText}
          onSubmit={handleCreateTicket}
        />

        {/* Card: Meus chamados */}
        <SupportTicketList
          tickets={tickets}
          loading={loadingTickets}
          selectedTicketId={null}
          onSelectTicket={handleSelectTicket}
        />
      </div>
    </div>
  );
}
