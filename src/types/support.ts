// src/types/support.ts

export type SupportTicketStatus =
  | "ENVIADO"
  | "PENDENTE"
  | "ATRIBUIDO"
  | "SOLUCIONADO"
  | "FECHADO";

export const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  ENVIADO: "Enviado",
  PENDENTE: "Pendente",
  ATRIBUIDO: "Atribuído",
  SOLUCIONADO: "Solucionado",
  FECHADO: "Fechado",
};

export const CATEGORY_OPTIONS = [
  { value: "ERRO_SISTEMA", label: "Erro de Sistema" },
  { value: "ERRO_CADASTRO", label: "Erro de Cadastro" },
  {
    value: "MELHORIA_CRIACAO_USUARIO",
    label: "Melhoria - Criação de Usuário",
  },
  {
    value: "MELHORIA_SOLICITA_PERMISSAO_SUPERADMIN",
    label: "Melhoria - Solicitar Permissão SuperAdmin",
  },
];

export type SupportTicketAttachment = {
  id: string;
  ticket_id: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
};


export type SupportTicket = {
  id: string;
  empresa_id: string;
  created_by_auth_user_id: string;
  assigned_to_auth_user_id: string | null;
  category: string;
  subcategory: string | null;
  title: string;
  description: string;
  status: SupportTicketStatus;
  created_at: string;
  updated_at: string;
  attachments?: SupportTicketAttachment[];
  screenshot_url?: string | null;
  attachment_url?: string | null;
  image_url?: string | null;
  attachment_name?: string | null;
};

export type SupportTicketMessage = {
  id: string;
  ticket_id?: string;
  author_auth_user_id: string;
  message: string;
  created_at: string;
};
