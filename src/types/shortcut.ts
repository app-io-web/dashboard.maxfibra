// src/types/shortcut.ts
export type ShortcutScope = "global" | "empresa" | "usuario";

export type ApiShortcut = {
  id: string;
  auth_empresa_id: string | null;
  auth_user_id: string;
  titulo: string | null;
  url: string;
  img_url: string | null;
  anotacoes: string | null;
  email: string | null;
  is_global: boolean;
  is_private: boolean;
  show_on_dashboard: boolean;
  password_status: string | null; // "[ENCRYPTED]" ou null
  created_at: string;
  updated_at: string;
};
