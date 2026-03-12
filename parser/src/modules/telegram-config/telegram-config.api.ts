import { HttpClient } from '../../core/api/http.client.js';

export interface TelegramCredentials {
  apiId: number;
  apiHash: string;
  sessionString: string;
  status: 'active' | 'pending_code' | 'inactive';
}

export class TelegramConfigApi {
  constructor(private http: HttpClient) {}

  async getActiveConfig(): Promise<TelegramCredentials | null> {
    try {
      const res = await this.http.request<{ success: boolean; data: TelegramCredentials }>('/telegram-config/active');
      return res.success ? res.data : null;
    } catch {
      return null;
    }
  }

  async saveSession(sessionString: string): Promise<void> {
    await this.http.request('/telegram-config/session', {
      method: 'POST',
      body: JSON.stringify({ sessionString }),
    });
  }
}
