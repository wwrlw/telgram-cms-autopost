import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';

export class TelegramClientService {
  readonly client: TelegramClient;

  constructor(
    private apiId: number,
    private apiHash: string,
    private sessionString: string,
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
    const isEmptySession = !this.sessionString || this.sessionString.trim() === '';

    if (isEmptySession) {
      console.log('📝 STRING_SESSION не установлена, запускаем интерактивную авторизацию...');
      console.log('💡 После авторизации скопируйте сессию в STRING_SESSION');
    }

    try {
      await this.client.start({
        phoneNumber: async () => {
          if (!isEmptySession) throw new Error('Требуется интерактивный ввод, но STRING_SESSION уже установлена.');
          return await input.text('Введите номер телефона: ');
        },
        password: async () => {
          if (!isEmptySession) throw new Error('Требуется интерактивный ввод, но STRING_SESSION уже установлена.');
          return await input.text('Введите пароль (если есть 2FA): ');
        },
        phoneCode: async () => {
          if (!isEmptySession) throw new Error('Требуется интерактивный ввод, но STRING_SESSION уже установлена.');
          return await input.text('Введите код из Telegram: ');
        },
        onError: (err: any) => console.error('❌ Ошибка Telegram клиента:', err),
      });
    } catch (error: any) {
      if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
        console.error('❌ AUTH_KEY_DUPLICATED: Сессия уже используется где-то еще');
        console.error('💡 Остановите другие боты с этой сессией или сгенерируйте новую STRING_SESSION');
        console.log('⏳ Ждем 30 секунд перед повторной попыткой...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      throw error;
    }

    console.log('✅ Авторизация в Telegram успешна');

    const sessionStr = this.client.session.save();
    console.log('🔐 Текущая сессия (STRING_SESSION):', sessionStr);

    if (isEmptySession) {
      console.log('💡 Скопируйте строку выше в STRING_SESSION и перезапустите контейнер');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      console.log('🛑 Telegram клиент отключен');
    } catch (error) {
      console.error('❌ Ошибка при отключении Telegram клиента:', error);
    }
  }
}
