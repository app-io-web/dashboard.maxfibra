export type BirthdayItem = {
  id: string;
  name: string;
  role: string;
  date: string;
  sector?: string;
  avatarUrl?: string | null;
  is_manual?: boolean; // 👈 vem do backend agora
};

export type ApiAniversariante = {
  auth_user_id: string;
  auth_empresa_id: string | null;
  nome: string;
  profession: string | null;
  data_nascimento: string;
  empresa_role: string | null;
  avatar_url: string | null;
  is_manual?: boolean;
};

export type BirthdayWithInfo = BirthdayItem & {
  info: {
    nextBirthday: Date;
    daysUntil: number;
    ageAtNext: number;
  };
};
