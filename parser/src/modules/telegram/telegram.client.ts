import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

export class TelegramClientService {
  readonly client: TelegramClient;

  constructor(
    apiId: number,
    apiHash: string,
    sessionString: string,
  ) {
    this.client = new TelegramClient(
      new StringSession(sessionString),
      apiId,
      apiHash,
      {
        connectionRetries: 5,
        deviceModel: 'Desktop',
        systemVersion: 'Windows 10',
        appVersion: '1.0.0',
        langCode: 'en',
        systemLangCode: 'en',
      },
    );
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();

      if (!await this.client.isUserAuthorized()) {
        throw new Error('SESSION_INVALID');
      }

      console.log('✅ Telegram подключён и авторизован');
    } catch (error: any) {
      if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
        console.error('❌ AUTH_KEY_DUPLICATED: сессия уже используется в другом месте');
        console.error('💡 Сгенерируйте новую сессию через Settings → Telegram Config');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      console.log('🛑 Telegram клиент отключён');
    } catch (error) {
      console.error('❌ Ошибка при отключении:', error);
    }
  }
}
