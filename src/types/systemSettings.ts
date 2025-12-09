// src/types/systemSettings.ts
export type SystemSetting<T = unknown> = {
  key: string;
  value: T;
  description: string | null;
  is_sensitive: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
  updated_by_auth_user_id: string | null;
};
