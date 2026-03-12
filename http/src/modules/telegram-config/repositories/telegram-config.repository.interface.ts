import { TelegramConfig, CreateTelegramConfigDto } from '../telegram-config.model';

export interface ITelegramConfigRepository {
  findActive(): Promise<TelegramConfig | null>;
  findAll(): Promise<TelegramConfig[]>;
  findById(id: string): Promise<TelegramConfig | null>;
  create(data: Omit<TelegramConfig, '_id'>): Promise<TelegramConfig>;
  updateStatus(id: string, status: TelegramConfig['status']): Promise<void>;
  updateSession(id: string, sessionString: string): Promise<void>;
  delete(id: string): Promise<void>;
}
