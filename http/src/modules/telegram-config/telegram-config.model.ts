export interface TelegramConfig {
  _id?: any;
  label: string;
  api_id: string;       // зашифровано
  api_hash: string;     // зашифровано
  session_string: string; // зашифровано
  phone: string;
  status: 'active' | 'pending_code' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CreateTelegramConfigDto {
  label: string;
  api_id: string;
  api_hash: string;
  phone: string;
}

export interface TelegramConfigPublic {
  _id: string;
  label: string;
  phone: string;
  status: string;
  has_session: boolean;
  created_at: Date;
  updated_at: Date;
}
