export type EmpresaSettings = {
  id: string;
  auth_empresa_id: string;
  display_name: string | null;
};

export type CreatedUser = {
  id: string;
  name: string;
  email?: string | null;
};

export type EmpresaUserRow = {
  id: string; // id do vínculo OU qualquer id que vier (mantém)
  auth_user_id?: string; // id global do usuário (quando vier)
  name: string;
  email: string | null;
  role: string | null;
  profession: string | null;
  is_enabled: boolean;
};

export type ProfileItem = {
  id: string;
  name: string;
  slug?: string | null;
  key?: string | null;
  is_enabled?: boolean;
};
