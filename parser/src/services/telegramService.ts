import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram';
import input from 'input';
import { CreatePostDto, PostStats, ChannelConfig, ConversionMetrics } from '../types/index.js';
import { MongoService } from './mongoService.js';
import { MediaService } from './mediaService.js';
import { PublishService } from './publishService.js';
import { ConversionService } from './conversionService.js';
import { ChannelStatsService } from './channelStatsService.js';
import { PostedChannel, ChannelAnalytics } from '../types/index.js';
import { ChannelAnalyticsService } from './channelAnalyticsService.js';

export class TelegramService {
  private client: TelegramClient;
  private mongoService: MongoService;
  private mediaService: MediaService;
  private publishService: PublishService;
  private conversionService: ConversionService;
  private channelStatsService: ChannelStatsService;
  private channelAnalyticsService: ChannelAnalyticsService; // Добавляем

  private albumBuffer: { [groupedId: string]: any[] } = {};
  private albumTimers: { [groupedId: string]: NodeJS.Timeout } = {};
  
  // Добавляем поле для каналов публикации
  private postedChannels: PostedChannel[] = [];

  constructor(
    private config: {
      apiId: number;
      apiHash: string;
      sessionString: string;
      targetChannels: ChannelConfig[];
      postedChannels: PostedChannel[]; // Добавляем в конфиг
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
    this.conversionService = new ConversionService();
    this.channelStatsService = new ChannelStatsService(this.client, this.mongoService);
    this.postedChannels = config.postedChannels || [];
    this.channelAnalyticsService = new ChannelAnalyticsService(this.client, this.mongoService);
  }

  async updateTargetChannels(newChannels: ChannelConfig[]): Promise<void> {
    console.log('🔄 Обновляем целевые каналы...');
    console.log('📋 Старые каналы:', this.config.targetChannels.map(c => c.id));
    console.log('📋 Новые каналы:', newChannels.map(c => c.id));
    
    this.config.targetChannels = newChannels;
    
    if (newChannels.length > 0) {
      await this.checkChannelsAccess();
      console.log(`✅ Обновлено ${newChannels.length} целевых каналов`);
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

      console.log(`👂 Слушаем посты из ${this.config.targetChannels.length} целевых каналов:`, this.config.targetChannels.map(c => c.id));
      
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
      console.log('🔄 Начинаем обновление статистики постов с конверсией...');
      
      const statsLimit = Number(process.env.STATS_UPDATE_LIMIT) || 150;
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
            const channelConfig = this.config.targetChannels.find(c => {
              if (c.username && c.username.replace('@', '') === channelIdentifier) {
                return true;
              }
              return false;
            });
            
            if (channelConfig) {
              if (channelConfig.is_private) {
                let telegramChannelId = Math.abs(channelConfig.id);
                
                if (telegramChannelId < 1_000_000_000_000) {
                  telegramChannelId = 1_000_000_000_000 + telegramChannelId;
                }
                
                try {
                  entity = await this.client.getEntity(telegramChannelId);
                } catch (firstError) {
                  try {
                    entity = await this.client.getEntity(-telegramChannelId);
                  } catch (secondError) {
                    entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
                  }
                }
              } else {
                entity = await this.client.getEntity(channelIdentifier);
              }
            } else {
              if (!/^\d+$/.test(channelIdentifier)) {
                entity = await this.client.getEntity(channelIdentifier);
              } else {
                const channelId = parseInt(channelIdentifier);
                let telegramChannelId = Math.abs(channelId);
                
                if (telegramChannelId < 1_000_000_000_000) {
                  telegramChannelId = 1_000_000_000_000 + telegramChannelId;
                }
                
                // Try multiple approaches to get the entity
                try {
                  entity = await this.client.getEntity(telegramChannelId);
                } catch (firstError) {
                  try {
                    entity = await this.client.getEntity(-telegramChannelId);
                  } catch (secondError) {
                    entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
                  }
                }
              }
            }
          } catch (entityError: any) {
            if (entityError.errorMessage === 'CHANNEL_INVALID') {
              console.log(`⚠️ Канал ${channelIdentifier} недоступен или был удален, пропускаем`);
            } else {
              console.log(`⚠️ Не удалось получить entity для ${channelIdentifier}: ${entityError.message || entityError}`);
            }
            skippedCount++;
            continue;
          }
          
          const messages = await this.client.getMessages(entity, { ids: [messageId] });
          
          if (messages && messages.length > 0) {
            const message = messages[0];
            
            if (!message) {
              console.log(`⚠️ Сообщение ${messageId} не найдено или недоступно`);
              continue;
            }
            
            const updatedStats = this.getPostStatsFromMessage(message);
            
            if (updatedStats) {
              // Получаем количество подписчиков канала для расчета конверсии
              const subscribersCount = await this.channelStatsService.getChannelSubscribersFromDB(post.channel_id);
              
              // Рассчитываем метрики конверсии
              const conversionMetrics = this.conversionService.calculateConversionMetrics(updatedStats, subscribersCount);
              
              // Обновляем конверсию в БД
              if (conversionMetrics) {
                await this.mongoService.updatePostStats(post.url, conversionMetrics);
                
                // Логируем конверсию
                this.conversionService.logConversionMetrics(conversionMetrics, post.url);
                
                console.log(`✅ Обновлена конверсия для ${post.url}:`, conversionMetrics);
                updatedCount++;
              } else {
                console.log(`⚠️ Не удалось рассчитать конверсию для ${post.url}`);
                skippedCount++;
              }
            } else {
              console.log(`⚠️ Нет статистики для ${post.url}`);
              skippedCount++;
            }
          } else {
            console.log(`⚠️ Сообщение не найдено для ${post.url}`);
            skippedCount++;
          }
          
          // Add delay between requests to avoid rate limiting
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

  /**
   * Обновляет статистику каналов (количество подписчиков)
   */
  async updateChannelsStats(): Promise<void> {
    try {
      console.log('🔄 Начинаем обновление статистики каналов...');
      await this.channelStatsService.updateChannelsStats(this.config.targetChannels);
      console.log('✅ Обновление статистики каналов завершено');
    } catch (error) {
      console.error('❌ Ошибка при обновлении статистики каналов:', error);
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
    
    for (const channelConfig of this.config.targetChannels) {
      try {
        let entity;
        
        if (channelConfig.is_private) {
          let telegramChannelId = Math.abs(channelConfig.id);

          if (telegramChannelId > 1_000_000_000_000) {
            telegramChannelId -= 1_000_000_000_000;
          }
          
          entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
        } else {
          if (channelConfig.username) {
            entity = await this.client.getEntity(channelConfig.username.replace('@', ''));
          } else {
            let telegramChannelId = Math.abs(channelConfig.id);

            if (telegramChannelId > 1_000_000_000_000) {
              telegramChannelId -= 1_000_000_000_000;
            }
            
            entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
          }
        }
        
        const username = (entity as any).username || `channel_${Math.abs(channelConfig.id)}`;
        const title = (entity as any).title || 'Unknown';
        const privacyStatus = channelConfig.is_private ? '🔒 Private' : '🔓 Public';
        console.log(`✅ Канал ${channelConfig.id}: ${title} (@${username}) [${privacyStatus}]`);
      } catch (error) {
        console.error(`❌ Не удалось получить доступ к каналу ${channelConfig.id}:`, error);
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
      if (!message || !message.id) {
        console.log('⚠️ Некорректное сообщение для извлечения статистики');
        return undefined;
      }
      
      console.log(`📊 Извлекаем статистику из сообщения ${message.id}`);
      
      const stats: PostStats = {};
      let hasStats = false;

      // Views - most common statistic
      if (message.views !== undefined && message.views !== null) {
        stats.views = Number(message.views);
        hasStats = true;
        console.log(`👁️ Просмотры: ${stats.views}`);
      }

      // Forwards
      if (message.forwards !== undefined && message.forwards !== null) {
        stats.forwards = Number(message.forwards);
        hasStats = true;
        console.log(`🔄 Пересылки: ${stats.forwards}`);
      }

      // Comments/Replies
      if (message.replies && message.replies.replies !== undefined && message.replies.replies !== null) {
        stats.comments = Number(message.replies.replies);
        hasStats = true;
        console.log(`💬 Комментарии: ${stats.comments}`);
      }

      if (message.reactions && message.reactions.results && Array.isArray(message.reactions.results)) {
        const totalReactions = message.reactions.results.reduce((total: number, reaction: any) => {
          return total + (Number(reaction.count) || 0);
        }, 0);
        
        if (totalReactions > 0) {
          stats.reactions = totalReactions;
          stats.reactions_detail = {};
          
          for (const reaction of message.reactions.results) {
            if (reaction.reaction && 'emoticon' in reaction.reaction) {
              const emoji = reaction.reaction.emoticon;
              const count = Number(reaction.count) || 0;
              if (count > 0) {
                stats.reactions_detail[emoji] = count;
              }
            }
          }
          
          hasStats = true;
          console.log(`😍 Реакции: ${stats.reactions}`, stats.reactions_detail);
        }
      }

      if (hasStats) {
        if (stats.views === undefined) stats.views = 0;
        if (stats.forwards === undefined) stats.forwards = 0;
        
        return stats;
      }
      
      console.log(`⚠️ Нет статистики для сообщения ${message.id}`);
      return undefined;
      
    } catch (error) {
      console.error('❌ Ошибка извлечения статистики из сообщения:', error);
      return undefined;
    }
  }

  private async getChannelIdentifier(peer: any, channelConfig?: ChannelConfig): Promise<string> {
    try {
      const entity = await this.client.getEntity(peer);
      
      if (channelConfig) {
        if (channelConfig.is_private) {
          const channelId = peer.channelId || peer.userId || peer.chatId;
          return channelId.toString();
        } else {
          if (channelConfig.username) {
            return channelConfig.username.replace('@', '');
          }
          if ((entity as any).username) {
            return (entity as any).username;
          }
        }
      }
      
      if ((entity as any).username) {
        return (entity as any).username;
      }
      
      const channelId = peer.channelId || peer.userId || peer.chatId;
      return channelId.toString();
    } catch (error) {
      console.error('❌ Ошибка получения идентификатора канала:', error);
      const channelId = peer.channelId || peer.userId || peer.chatId;
      return channelId.toString();
    }
  }

  private getFullChannelId(peer: any): number {
    const rawChannelId = Number(peer.channelId || peer.userId || peer.chatId || 0);
    
    if (peer.channelId) {
      return -100 * 10000000000 - rawChannelId;
    }
    
    return rawChannelId;
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
    const isTargetChannel = this.config.targetChannels
      .map(c => normalizeId(c.id))
      .includes(normalizedIncomingId);
    
    if (!isTargetChannel) {
      console.log(`⏭️ Сообщение из канала ${channelId} не в списке целевых каналов [${this.config.targetChannels.map(c => c.id).join(', ')}], пропускаем`);
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

        const meidaToProcces: any[] = albumMsgs.map(m => m.media).filter(Boolean);
        let text = albumMsgs.find(m => m.message)?.message || '';
        
        const allMedia = await this.mediaService.processMedia(
          this.client,
          { media: meidaToProcces },
          Number(peer.channelId || peer.userId || peer.chatId || 0),
          albumMsgs[0].id
        )
        // let allMedia: any[] = [];
        // let text = '';
        
        // for (const m of albumMsgs) {
        //   const media = await this.mediaService.processMedia(
        //     this.client,
        //     m,
        //     Number(peer.channelId || peer.userId || peer.chatId || 0),
        //     m.id
        //   );
        //   allMedia = allMedia.concat(media);
        //   if (m.message && !text) text = m.message;
        // }
        
        const channelConfig = this.config.targetChannels.find(c => normalizeId(c.id) === normalizedIncomingId);
        const sourceChannel = await this.getChannelIdentifier(peer, channelConfig);
        const postUrl = `https://t.me/${sourceChannel}/${albumMsgs[0].id}`;
        
        const stats = this.getPostStatsFromMessage(albumMsgs[0]);
        
        // Получаем количество подписчиков для расчета конверсии
        const subscribersCount = await this.channelStatsService.getChannelSubscribersFromDB(this.getFullChannelId(peer));
        const conversionMetrics = this.conversionService.calculateConversionMetrics(stats, subscribersCount);
        
        const postData: CreatePostDto = {
          source_channel: sourceChannel,
          channel_id: this.getFullChannelId(peer),
          text,
          url: postUrl,
          media: allMedia,
          is_unique: false,
          conversion_metrics: conversionMetrics
        };
        
        await this.mongoService.savePost(postData);
        delete this.albumBuffer[groupId];
        delete this.albumTimers[groupId];

         try {
          await this.publishService.publishPost(postData);
        } catch (publishError) {
          console.error('❌ Ошибка автоматической публикации альбома:', publishError);
        }

        // Логируем конверсию
        this.conversionService.logConversionMetrics(conversionMetrics, postUrl);
        console.log(`📤 Сохранён альбом-пост из ${sourceChannel}:`, postData);
      }, 1500);
      return;
    }

    try {
      const channelConfig = this.config.targetChannels.find(c => normalizeId(c.id) === normalizedIncomingId);
      const sourceChannel = await this.getChannelIdentifier(peer, channelConfig);

      console.log(`📨 Сообщение из целевого канала: ${sourceChannel} (ID: ${channelId})`);

      const postUrl = `https://t.me/${sourceChannel}/${msg.id}`;

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
      
      // Получаем количество подписчиков для расчета конверсии
      const subscribersCount = await this.channelStatsService.getChannelSubscribersFromDB(this.getFullChannelId(peer));
      const conversionMetrics = this.conversionService.calculateConversionMetrics(stats, subscribersCount);

      const postData: CreatePostDto = {
        source_channel: sourceChannel,
        channel_id: this.getFullChannelId(peer),
        text: (msg as any).message || '',
        url: postUrl,
        media: media,
        is_unique: false,
        conversion_metrics: conversionMetrics
      };

      await this.mongoService.savePost(postData);

      // Логируем конверсию
      this.conversionService.logConversionMetrics(conversionMetrics, postUrl);
      
      console.log(`✅ Пост успешно сохранен: ${postUrl}`);
      console.log(`📊 Статистика: ${stats ? JSON.stringify(stats) : 'Нет данных'}`);

    } catch (error) {
      console.error('❌ Ошибка при обработке сообщения:', error);
    }
  }

  private async handleAllUpdates(update: any): Promise<void> {
    console.log('📨 Получено обновление:', update.className);
  }

  async updatePostedChannels(newPostedChannels: PostedChannel[]): Promise<void> {
    console.log('🔄 Обновляем каналы публикации...');
    console.log('📋 Старые каналы публикации:', this.postedChannels.map(c => c.name));
    console.log('📋 Новые каналы публикации:', newPostedChannels.map(c => c.name));
    
    this.postedChannels = newPostedChannels;
    
    if (newPostedChannels.length > 0) {
      console.log(`✅ Обновлено ${newPostedChannels.length} каналов публикации`);
    } else {
      console.log('⚠️ Список каналов публикации пуст');
    }
  }

  getPostedChannels(): PostedChannel[] {
    return this.postedChannels;
  }


  async collectPostedChannelsAnalytics(): Promise<void> {
    try {
      if (this.postedChannels.length === 0) {
        console.log('⚠️ Нет каналов публикации для анализа');
        return;
      }
      
      await this.channelAnalyticsService.collectPostedChannelsAnalytics(this.postedChannels);
    } catch (error) {
      console.error('❌ Ошибка сбора аналитики по каналам публикации:', error);
    }
  }
} 