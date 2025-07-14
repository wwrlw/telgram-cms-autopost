import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram';
import input from 'input';
import { CreatePostDto, PostStats } from '../types/index.js';
import { MongoService } from './mongoService.js';
import { MediaService } from './mediaService.js';
import { PublishService } from './publishService.js';

export class TelegramService {
  private client: TelegramClient;
  private mongoService: MongoService;
  private mediaService: MediaService;
  private publishService: PublishService;

  private albumBuffer: { [groupedId: string]: any[] } = {};
  private albumTimers: { [groupedId: string]: NodeJS.Timeout } = {};

  constructor(
    private config: {
      apiId: number;
      apiHash: string;
      sessionString: string;
      targetChannelIds: number[];
      mongoUri: string;
      MONGO_DB: string;
      mediaPath: string;
    }
  ) {
    const stringSession = new StringSession(config.sessionString);
    this.client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
      connectionRetries: 5,
      deviceModel: 'Desktop',
      systemVersion: 'Windows 10',
      appVersion: '1.0.0',
      langCode: 'en',
      systemLangCode: 'en',
    });

    this.mongoService = new MongoService(config.mongoUri, config.MONGO_DB);
    this.mediaService = new MediaService(config.mediaPath);
    this.publishService = new PublishService();
  }

  async updateTargetChannels(newChannelIds: number[]): Promise<void> {
    console.log('🔄 Обновляем целевые каналы...');
    console.log('📋 Старые каналы:', this.config.targetChannelIds);
    console.log('📋 Новые каналы:', newChannelIds);
    
    this.config.targetChannelIds = newChannelIds;
    
    if (newChannelIds.length > 0) {
      await this.checkChannelsAccess();
      console.log(`✅ Обновлено ${newChannelIds.length} целевых каналов`);
    } else {
      console.log('⚠️ Список целевых каналов пуст');
    }
  }

  async start(): Promise<void> {
    try {
      await this.mongoService.connect();

      console.log('🔐 Подключаемся к Telegram...');
      
      const isEmptySession = !this.config.sessionString || this.config.sessionString.trim() === '';
      
      if (isEmptySession) {
        console.log('📝 STRING_SESSION не установлена, запускаем интерактивную авторизацию...');
        console.log('💡 После авторизации скопируйте полученную сессию в переменную STRING_SESSION');
      }
      
      try {
        await this.client.start({
          phoneNumber: async () => {
            if (!isEmptySession) {
              throw new Error('Требуется интерактивный ввод, но STRING_SESSION уже установлена. Проверьте её корректность.');
            }
            return await input.text('Введите номер телефона: ');
          },
          password: async () => {
            if (!isEmptySession) {
              throw new Error('Требуется интерактивный ввод, но STRING_SESSION уже установлена. Проверьте её корректность.');
            }
            return await input.text('Введите пароль (если есть 2FA): ');
          },
          phoneCode: async () => {
            if (!isEmptySession) {
              throw new Error('Требуется интерактивный ввод, но STRING_SESSION уже установлена. Проверьте её корректность.');
            }
            return await input.text('Введите код из Telegram: ');
          },
          onError: (err: any) => console.error('❌ Ошибка Telegram клиента:', err),
        });
      } catch (error: any) {
        if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
          console.error('❌ AUTH_KEY_DUPLICATED: Сессия уже используется где-то еще');
          console.error('💡 Решения:');
          console.error('   1. Остановите другие боты/клиенты с этой сессией');
          console.error('   2. Сгенерируйте новую STRING_SESSION');
          console.error('   3. Для этого необходимо локально через npm run dev запустить с папки parser, перенеся туда переменные окружения');
          console.error('   4. Вводим стринг session в переменные окружения главного env файла и удаляем env из папки parser');
          
          console.log('⏳ Ждем 30 секунд перед повторной попыткой...');
          await new Promise(resolve => setTimeout(resolve, 30000));
          throw error;
        }
        throw error;
      }

      console.log('✅ Авторизация в Telegram успешна');
      
      const sessionString = this.client.session.save();
      console.log('🔐 Сессия для сохранения в STRING_SESSION:');
      console.log(sessionString);
      
      if (isEmptySession) {
        console.log('💡 Скопируйте эту строку и установите как STRING_SESSION в переменных окружения');
        console.log('💡 Затем перезапустите контейнер для использования сохраненной сессии');
      }

      this.client.addEventHandler(this.handleMessage.bind(this));
      this.client.addEventHandler(this.handleAllUpdates.bind(this));

      console.log(`👂 Слушаем посты из ${this.config.targetChannelIds.length} целевых каналов:`, this.config.targetChannelIds);
      
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

  async updatePostsStats(): Promise<void> {
    try {
      console.log('🔄 Начинаем обновление статистики постов...');
      
      const statsLimit = Number(process.env.STATS_UPDATE_LIMIT) || 50;
      const recentPosts = await this.mongoService.getRecentPostsForStats(statsLimit);
      console.log(`📊 Найдено ${recentPosts.length} постов для обновления статистики (ограничение: ${statsLimit})`);
      
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const post of recentPosts) {
        try {
          const urlMatch = post.url.match(/https:\/\/t\.me\/([^/]+)\/(\d+)/);
          if (!urlMatch) {
            console.log(`⚠️ Не удалось извлечь данные из URL: ${post.url}`);
            skippedCount++;
            continue;
          }
          
          const [, channelIdentifier, messageIdStr] = urlMatch;
          const messageId = parseInt(messageIdStr);
          
          let entity;
          
          try {
            if (!channelIdentifier.startsWith('channel_')) {
              entity = await this.client.getEntity(channelIdentifier);
            } else {
              const channelId = parseInt(channelIdentifier.replace('channel_', ''));
              let telegramChannelId = Math.abs(channelId);
              
              if (telegramChannelId > 1_000_000_000_000) {
                telegramChannelId -= 1_000_000_000_000;
              }
              
              entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
            }
          } catch (entityError) {
            console.log(`⚠️ Не удалось получить entity для ${channelIdentifier}, пропускаем: ${entityError}`);
            skippedCount++;
            continue;
          }
          
          const messages = await this.client.getMessages(entity, { ids: [messageId] });
          
          if (messages && messages.length > 0) {
            const message = messages[0];
            const updatedStats = this.getPostStatsFromMessage(message);
            
            if (updatedStats) {
              await this.mongoService.updatePostStats(post.url, updatedStats);
              console.log(`✅ Обновлена статистика для ${post.url}:`, updatedStats);
              updatedCount++;
            } else {
              console.log(`⚠️ Нет статистики для ${post.url}`);
              skippedCount++;
            }
          } else {
            console.log(`⚠️ Сообщение не найдено для ${post.url}`);
            skippedCount++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Ошибка обновления статистики для ${post.url}:`, error);
          skippedCount++;
        }
      }
      
      console.log(`✅ Обновление статистики завершено. Обновлено: ${updatedCount}, Пропущено: ${skippedCount}`);
    } catch (error) {
      console.error('❌ Ошибка при обновлении статистики постов:', error);
    }
  }

  async cleanupDuplicates(): Promise<void> {
    try {
      await this.mongoService.cleanupDuplicates();
    } catch (error) {
      console.error('❌ Ошибка при очистке дубликатов:', error);
    }
  }

  private async checkChannelsAccess(): Promise<void> {
    console.log('🔍 Проверяем доступ к каналам...');
    
    for (const channelId of this.config.targetChannelIds) {
      try {
        let telegramChannelId = Math.abs(channelId);

        if (telegramChannelId > 1_000_000_000_000) {
          telegramChannelId -= 1_000_000_000_000;
        }
        
        const entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
        const username = (entity as any).username || `channel_${telegramChannelId}`;
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

  private getPostStatsFromMessage(message: any): PostStats | undefined {
    try {
      console.log(`📊 Извлекаем статистику из сообщения ${message.id}`);
      
      const stats: PostStats = {};

      if (message.views !== undefined) {
        stats.views = message.views;
        console.log(`👁️ Просмотры: ${stats.views}`);
      }

      if (message.forwards !== undefined) {
        stats.forwards = message.forwards;
        console.log(`🔄 Пересылки: ${stats.forwards}`);
      }

      if (message.replies && message.replies.replies !== undefined) {
        stats.comments = message.replies.replies;
        console.log(`💬 Комментарии: ${stats.comments}`);
      }

      if (message.reactions && message.reactions.results) {
        stats.reactions = message.reactions.results.reduce((total: number, reaction: any) => total + (reaction.count || 0), 0);
        stats.reactions_detail = {};
        
        for (const reaction of message.reactions.results) {
          if (reaction.reaction && 'emoticon' in reaction.reaction) {
            const emoji = reaction.reaction.emoticon;
            stats.reactions_detail[emoji] = reaction.count || 0;
          }
        }
        
        console.log(`😍 Реакции: ${stats.reactions}`, stats.reactions_detail);
      }

      return Object.keys(stats).length > 0 ? stats : undefined;
      
    } catch (error) {
      console.error('❌ Ошибка извлечения статистики из сообщения:', error);
      return undefined;
    }
  }

  private async handleMessage(update: any): Promise<void> {
    console.log('📨 Получено обновление:', update.className || 'unknown');
    
    console.log('📨 Обрабатываем обновление:', update);
    
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

    const channelId = Number(peer.channelId || peer.userId || peer.chatId || 0);
    
    const normalizeId = (id: number): number => {
      let n = Math.abs(id);
      if (n > 1_000_000_000_000) {
        n -= 1_000_000_000_000;
      }
      return n;
    };

    const normalizedIncomingId = normalizeId(channelId);
    const isTargetChannel = this.config.targetChannelIds
      .map(normalizeId)
      .includes(normalizedIncomingId);
    
    if (!isTargetChannel) {
      console.log(`⏭️ Сообщение из канала ${channelId} не в списке целевых каналов [${this.config.targetChannelIds.join(', ')}], пропускаем`);
      return;
    }

    // Проверяем дубликат по тексту на ранней стадии
    const messageText = (msg as any).message || '';
    if (messageText && await this.mongoService.checkTextDuplicate(messageText)) {
      console.log(`⏭️ Дубликат текста обнаружен на ранней стадии, пропускаем: ${messageText.substring(0, 50)}...`);
      return;
    }

    if (msg.groupedId) {
      const groupId = msg.groupedId.toString();
      if (!this.albumBuffer[groupId]) {
        this.albumBuffer[groupId] = [];
      }
      this.albumBuffer[groupId].push(msg);

      if (this.albumTimers[groupId]) {
        clearTimeout(this.albumTimers[groupId]);
      }

      this.albumTimers[groupId] = setTimeout(async () => {
        const albumMsgs = this.albumBuffer[groupId];
        let allMedia: any[] = [];
        let text = '';
        
        for (const m of albumMsgs) {
          const media = await this.mediaService.processMedia(
            this.client,
            m,
            Number(peer.channelId || peer.userId || peer.chatId || 0),
            m.id
          );
          allMedia = allMedia.concat(media);
          if (m.message && !text) text = m.message;
        }
        
        const entity = await this.client.getEntity(peer);
        const username = (entity as any).username || `channel_${peer.channelId || peer.userId || peer.chatId}`;
        const postUrl = `https://t.me/${username}/${albumMsgs[0].id}`;
        
        const stats = this.getPostStatsFromMessage(albumMsgs[0]);
        
        const postData: CreatePostDto = {
          source_channel: username,
          text,
          url: postUrl,
          media: allMedia,
          is_unique: false,
          stats
        };
        
        await this.mongoService.savePost(postData);
        delete this.albumBuffer[groupId];
        delete this.albumTimers[groupId];

         try {
          await this.publishService.publishPost(postData);
        } catch (publishError) {
          console.error('❌ Ошибка автоматической публикации альбома:', publishError);
        }

        console.log(`📤 Сохранён альбом-пост из ${username}:`, postData);
      }, 1500);
      return;
    }

    try {
      const entity = await this.client.getEntity(peer);
      const username = (entity as any).username || `channel_${peer.channelId || peer.userId || peer.chatId}`;

      console.log(`📨 Сообщение из целевого канала: ${username} (ID: ${channelId})`);

      const postUrl = `https://t.me/${username}/${msg.id}`;

      const exists = await this.mongoService.checkPostExists(postUrl);
      if (exists) {
        console.log(`⏭️ Пост ${postUrl} уже существует, пропускаем`);
        return;
      }

      console.log(`📝 Обрабатываем новый пост: ${postUrl}`);
      console.log(`📄 Текст: ${(msg as any).message ? (msg as any).message.substring(0, 100) + '...' : 'Без текста'}`);

      const media = await this.mediaService.processMedia(
        this.client,
        msg,
        Number(peer.channelId || peer.userId || peer.chatId || 0),
        msg.id
      );

      const stats = this.getPostStatsFromMessage(msg);

      const postData: CreatePostDto = {
        source_channel: username,
        text: (msg as any).message || '',
        url: postUrl,
        media: media,
        is_unique: false,
        stats
      };

      await this.mongoService.savePost(postData);

      console.log(`✅ Пост успешно сохранен: ${postUrl}`);
      console.log(`📊 Статистика: ${stats ? JSON.stringify(stats) : 'Нет данных'}`);

    } catch (error) {
      console.error('❌ Ошибка при обработке сообщения:', error);
    }
  }

  private async handleAllUpdates(update: any): Promise<void> {
    console.log('📨 Получено обновление:', update.className);
  }
} 