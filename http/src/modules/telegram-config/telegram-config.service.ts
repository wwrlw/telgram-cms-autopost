import { ITelegramConfigRepository } from './repositories/telegram-config.repository.interface';
import { EncryptionService } from './encryption.service';
import { TelegramConfig, CreateTelegramConfigDto, TelegramConfigPublic } from './telegram-config.model';

export class TelegramConfigService {
  constructor(
    private repo: ITelegramConfigRepository,
    private encryption: EncryptionService,
    private parserInternalUrl: string,
  ) {}

  // Возвращает публичное представление (без расшифрованных секретов)
  private toPublic(config: TelegramConfig): TelegramConfigPublic {
    return {
      _id: config._id.toString(),
      label: config.label,
      phone: config.phone,
      status: config.status,
      has_session: !!config.session_string,
      created_at: config.created_at,
      updated_at: config.updated_at,
    };
  }

  async getAll(): Promise<TelegramConfigPublic[]> {
    const configs = await this.repo.findAll();
    return configs.map(c => this.toPublic(c));
  }

  // Используется парсером — возвращает расшифрованные данные
  async getActiveDecrypted(): Promise<{ apiId: number; apiHash: string; sessionString: string; status: string } | null> {
    const config = await this.repo.findActive();
    if (!config) return null;
    return {
      apiId: Number(this.encryption.decrypt(config.api_id)),
      apiHash: this.encryption.decrypt(config.api_hash),
      sessionString: config.session_string ? this.encryption.decrypt(config.session_string) : '',
      status: config.status,
    };
  }

  async create(dto: CreateTelegramConfigDto): Promise<TelegramConfigPublic> {
    const config = await this.repo.create({
      label: dto.label,
      api_id: this.encryption.encrypt(dto.api_id),
      api_hash: this.encryption.encrypt(dto.api_hash),
      session_string: '',
      phone: dto.phone,
      status: 'inactive',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.toPublic(config);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  // Шаг 1: проксируем send-code на парсер
  async sendCode(id: string, phone?: string): Promise<{ phoneCodeHash: string }> {
    const config = await this.repo.findById(id);
    if (!config) throw new Error('Config not found');

    const apiId = this.encryption.decrypt(config.api_id);
    const apiHash = this.encryption.decrypt(config.api_hash);
    const phoneNumber = phone || config.phone;

    const res = await fetch(`${this.parserInternalUrl}/internal/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiId, apiHash, phone: phoneNumber }),
    });

    if (!res.ok) {
      const err = await res.json() as any;
      throw new Error(err.message || 'Parser send-code failed');
    }

    await this.repo.updateStatus(id, 'pending_code');
    const data = await res.json() as any;
    return { phoneCodeHash: data.data.phoneCodeHash };
  }

  // Шаг 2: проксируем verify-code на парсер
  async verifyCode(id: string, code: string, phoneCodeHash: string): Promise<{ needsPassword: boolean }> {
    const res = await fetch(`${this.parserInternalUrl}/internal/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, phoneCodeHash }),
    });

    if (!res.ok) {
      const err = await res.json() as any;
      throw new Error(err.message || 'Parser verify-code failed');
    }

    const data = await res.json() as any;
    const needsPassword = data.data?.needsPassword === true;

    if (!needsPassword) {
      await this.repo.updateStatus(id, 'active');
    }

    return { needsPassword };
  }

  // Шаг 3: проксируем verify-password на парсер (2FA)
  async verifyPassword(id: string, password: string): Promise<void> {
    const res = await fetch(`${this.parserInternalUrl}/internal/auth/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const err = await res.json() as any;
      throw new Error(err.message || 'Parser verify-password failed');
    }

    await this.repo.updateStatus(id, 'active');
  }

  // Вызывается парсером после успешной авторизации
  async saveSession(id: string, sessionString: string): Promise<void> {
    const encrypted = this.encryption.encrypt(sessionString);
    await this.repo.updateSession(id, encrypted);
  }
}
