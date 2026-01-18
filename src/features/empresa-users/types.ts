export type EmpresaSettings = {
  id: string;
  auth_empresa_id: string;
  display_name: string | null;
};

export type CreatedUser = {
  id: string;
  name: string;
  email: string | null; // deixa consistente
};

export type EmpresaUserRow = {
  // id do vínculo (central_user_empresas.id)
  id: string;

  // id real do usuário (users.id)
  auth_user_id: string;

  name: string;
  email: string | null;
  role: string | null;
  profession: string | null;
  is_enabled: boolean;

  // ✅ agora NÃO some mais
  cpf: string | null;

  // "YYYY-MM-DD" (ou null)
  data_nascimento: string | null;
};

export type ProfileItem = {
  id: string;
  name: string;
  slug: string | null;
  key: string | null;
  is_enabled: boolean;
};
