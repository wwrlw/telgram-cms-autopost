import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram';
import input from 'input';
import { CreatePostDto } from '../types/index.js';
import { MongoService } from './mongoService.js';
import { MediaService } from './mediaService.js';

export class TelegramService {
  private client: TelegramClient;
  private mongoService: MongoService;
  private mediaService: MediaService;

  constructor(
    private config: {
      apiId: number;
      apiHash: string;
      sessionString: string;
      targetChannelIds: number[];
      mongoUri: string;
      mongoDbName: string;
      mediaPath: string;
    }
  ) {
    const stringSession = new StringSession(config.sessionString);
    this.client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
      connectionRetries: 5,
    });

    this.mongoService = new MongoService(config.mongoUri, config.mongoDbName);
    this.mediaService = new MediaService(config.mediaPath);
  }

  async start(): Promise<void> {
    try {
      await this.mongoService.connect();

      await this.client.start({
        phoneNumber: async () => await input.text('Введите номер телефона: '),
        password: async () => await input.text('Введите пароль: '),
        phoneCode: async () => await input.text('Введите код из Telegram: '),
        onError: (err: any) => console.error('❌ Ошибка Telegram клиента:', err),
      });

      console.log('✅ Авторизация в Telegram успешна');
      console.log('🔐 Сессия:', this.client.session.save());

      this.client.addEventHandler(this.handleMessage.bind(this));
      this.client.addEventHandler(this.handleAllUpdates.bind(this));

      console.log('👂 Слушаем посты из всех каналов');
      
    } catch (error) {
      console.error('❌ Ошибка запуска сервиса:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.mongoService.disconnect();
      await this.client.disconnect();
      console.log('🛑 Сервис остановлен');
    } catch (error) {
      console.error('❌ Ошибка остановки сервиса:', error);
    }
  }

  private async checkChannelsAccess(): Promise<void> {
    console.log('🔍 Проверяем доступ к каналам...');
    
    for (const channelId of this.config.targetChannelIds) {
      try {
        const entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(channelId) as any }));
        const username = (entity as any).username || `channel_${channelId}`;
        const title = (entity as any).title || 'Unknown';
        console.log(`✅ Канал ${channelId}: ${title} (@${username})`);
      } catch (error) {
        console.error(`❌ Не удалось получить доступ к каналу ${channelId}:`, error);
      }
    }
  }

  async getChannelInfo(username: string): Promise<void> {
    try {
      const entity = await this.client.getEntity(username);
      console.log('📊 Информация о канале:', {
        id: (entity as any).id,
        title: (entity as any).title,
        username: (entity as any).username,
        participantsCount: (entity as any).participantsCount
      });
    } catch (error) {
      console.error('❌ Ошибка получения информации о канале:', error);
    }
  }

  private async handleMessage(update: any): Promise<void> {
    console.log('📨 Получено обновление:', update.className || 'unknown');
    
    // Обрабатываем все обновления, не фильтруем
    console.log('📨 Обрабатываем обновление:', update);
    
    // Проверяем, есть ли сообщение в обновлении
    if (!update.message) {
      console.log('⏭️ Нет сообщения в обновлении');
      return;
    }

    const msg = update.message;
    const peer = msg?.peerId;

    if (!peer) {
      console.log('⏭️ Нет peer в сообщении');
      return;
    }

    console.log('📨 Peer:', peer);

    try {
      const entity = await this.client.getEntity(peer);
      const username = (entity as any).username || `channel_${peer.channelId || peer.userId || peer.chatId}`;

      console.log(`📨 Сообщение из: ${username}`);

      // Формируем URL поста
      const postUrl = `https://t.me/${username}/${msg.id}`;

      // Проверяем, не обрабатывали ли мы уже этот пост
      const exists = await this.mongoService.checkPostExists(postUrl);
      if (exists) {
        console.log(`⏭️ Пост ${postUrl} уже существует, пропускаем`);
        return;
      }

      // Обрабатываем медиа
      const media = await this.mediaService.processMedia(
        this.client,
        msg,
        Number(peer.channelId || peer.userId || peer.chatId || 0),
        msg.id
      );

      // Создаем объект поста
      const postData: CreatePostDto = {
        source_channel: username,
        text: (msg as any).message || '',
        url: postUrl,
        media: media,
        is_unique: false
      };

      // Сохраняем в MongoDB
      await this.mongoService.savePost(postData);

      console.log(`📤 Обработан пост из ${username}:`, 
        postData.text.substring(0, 100) + (postData.text.length > 100 ? '...' : ''));

    } catch (error) {
      console.error('❌ Ошибка при обработке сообщения:', error);
    }
  }

  private async handleAllUpdates(update: any): Promise<void> {
    console.log('📨 Получено обновление:', update.className);
  }
} 