import dotenv from 'dotenv';
import cron from 'node-cron';
import { config } from './config/index.js';
import { MongoDatabase } from './core/database/mongo.client.js';
import { HttpClient } from './core/api/http.client.js';
import { TelegramClientService } from './modules/telegram/telegram.client.js';
import { TelegramConfigApi } from './modules/telegram-config/telegram-config.api.js';
import { startAuthServer } from './modules/telegram-config/auth.server.js';
import { ChannelApi } from './modules/channel/channel.api.js';
import { PostedChannelApi } from './modules/channel/posted-channel.api.js';
import { PostApi } from './modules/post/post.api.js';
import { PostRepository } from './modules/post/post.repository.js';
import { ChannelStatsRepository } from './modules/channel/channel.repository.js';
import { AnalyticsRepository } from './modules/analytics/analytics.repository.js';
import { ChannelService } from './modules/channel/channel.service.js';
import { MediaService } from './modules/media/media.service.js';
import { ConversionService } from './modules/stats/conversion.service.js';
import { StatsService } from './modules/stats/stats.service.js';
import { AnalyticsService } from './modules/analytics/analytics.service.js';
import { PublishService } from './modules/publish/publish.service.js';
import { ParserService } from './modules/parser/parser.service.js';
import { QueueWorker } from './workers/QueueWorker.js';
import { PostedChannel } from './types/index.js';

dotenv.config();

const db = new MongoDatabase(config.mongo.uri, config.mongo.dbName);
const httpClient = new HttpClient(config.api.baseUrl, config.api.username, config.api.password);
const channelApi = new ChannelApi(httpClient);
const postedChannelApi = new PostedChannelApi(httpClient);
const postApi = new PostApi(httpClient);
const telegramConfigApi = new TelegramConfigApi(httpClient);

let telegramClient: TelegramClientService;
let channelService: ChannelService;
let statsService: StatsService;
let analyticsService: AnalyticsService;
let parserService: ParserService;
let publishService: PublishService;
let postedChannels: PostedChannel[] = [];

async function initialize(): Promise<void> {
  try {
    console.log('🔍 Получаем каналы для парсинга...');
    const channelConfigs = await channelApi.getChannelConfigs();

    if (channelConfigs.length === 0) {
      console.warn('⚠️ Нет каналов для парсинга. Повторная попытка через 30 секунд...');
      setTimeout(initialize, 30000);
      return;
    }

    console.log(`🎯 Каналов для парсинга: ${channelConfigs.length}`);

    console.log('🔍 Получаем каналы для публикации...');
    postedChannels = await postedChannelApi.getActivePostedChannels();

    if (postedChannels.length === 0) {
      console.warn('⚠️ Нет активных каналов для публикации');
    }

    // Connect to MongoDB
    await db.connect();
    const dbInstance = db.getDb();

    // Repositories
    const postRepo = new PostRepository(dbInstance);
    const channelStatsRepo = new ChannelStatsRepository(dbInstance);
    const analyticsRepo = new AnalyticsRepository(dbInstance);

    // Services
    const mediaService = new MediaService(config.mediaPath);
    const conversionService = new ConversionService();

    // Загружаем Telegram credentials: сначала из бэкенда, fallback на env
    let tgApiId = config.telegram.apiId;
    let tgApiHash = config.telegram.apiHash;
    let tgSession = config.telegram.sessionString;

    const remoteConfig = await telegramConfigApi.getActiveConfig();
    if (remoteConfig?.status === 'active') {
      tgApiId = remoteConfig.apiId;
      tgApiHash = remoteConfig.apiHash;
      tgSession = remoteConfig.sessionString;
      console.log('🔑 Telegram credentials загружены из базы');
    } else if (!tgSession) {
      console.warn('⚠️  Нет активной Telegram сессии. Запускаем auth server...');
      startAuthServer(telegramConfigApi, 3002);
      return; // ждём авторизации, после неё parser перезапустится
    }

    // Connect to Telegram
    telegramClient = new TelegramClientService(tgApiId, tgApiHash, tgSession);
    await telegramClient.connect();
    const client = telegramClient.client;

    // Init domain services
    channelService = new ChannelService(client);
    await channelService.updateTargetChannels(channelConfigs);

    statsService = new StatsService(client, channelStatsRepo, postRepo, conversionService);
    analyticsService = new AnalyticsService(client, analyticsRepo);
    publishService = new PublishService(client);

    // Parser — listens to incoming messages
    parserService = new ParserService(client, postRepo, mediaService, statsService, conversionService, channelService);
    parserService.addEventHandlers();

    // Queue worker — processes publish/schedule/delete jobs
    const queueWorker = new QueueWorker(publishService, postApi);
    queueWorker.start();

    // Initial tasks on startup
    await statsService.updateChannelsStats(channelConfigs);
    await checkScheduledPosts();

    console.log('✅ Парсер запущен');
  } catch (error) {
    console.error('❌ Ошибка инициализации парсера:', error);
    console.log('🔄 Повторная попытка через 30 секунд...');
    setTimeout(initialize, 30000);
  }
}

async function updateChannels(): Promise<void> {
  try {
    const channelConfigs = await channelApi.getChannelConfigs();
    if (channelService) await channelService.updateTargetChannels(channelConfigs);
  } catch (error) {
    console.error('❌ Ошибка обновления каналов:', error);
  }
}

async function updatePostedChannels(): Promise<void> {
  try {
    postedChannels = await postedChannelApi.getActivePostedChannels();
    console.log(`✅ Каналы публикации обновлены: ${postedChannels.length}`);
  } catch (error) {
    console.error('❌ Ошибка обновления каналов публикации:', error);
  }
}

async function updatePostsStats(): Promise<void> {
  try {
    if (statsService && channelService) {
      await statsService.updatePostsStats(channelService.getTargetChannels());
    }
  } catch (error) {
    console.error('❌ Ошибка обновления статистики постов:', error);
  }
}

async function updateChannelsStats(): Promise<void> {
  try {
    if (statsService && channelService) {
      await statsService.updateChannelsStats(channelService.getTargetChannels());
    }
  } catch (error) {
    console.error('❌ Ошибка обновления статистики каналов:', error);
  }
}

async function collectAnalytics(): Promise<void> {
  try {
    if (analyticsService) {
      await analyticsService.collectPostedChannelsAnalytics(postedChannels);
    }
  } catch (error) {
    console.error('❌ Ошибка сбора аналитики:', error);
  }
}

async function collectDailySnapshots(): Promise<void> {
  try {
    if (analyticsService) {
      await analyticsService.collectDailySnapshots(postedChannels);
    }
  } catch (error) {
    console.error('❌ Ошибка дневных срезов аналитики:', error);
  }
}

async function checkScheduledPosts(): Promise<void> {
  try {
    if (!publishService) return;

    const scheduledPosts = await postApi.getScheduledPosts();
    const activeChannels = await postedChannelApi.getActivePostedChannels();

    for (const post of scheduledPosts) {
      if (!post.scheduled_at) continue;

      const scheduledDate = new Date(post.scheduled_at);
      if (scheduledDate > new Date()) continue;

      const channel = activeChannels.find((c: PostedChannel) => c.channel_id === post.scheduled_channel_id);
      if (!channel || !post.scheduled_message_id) continue;

      try {
        const scheduledMessages = await publishService.getScheduledMessages(channel.channel_id);
        const stillExists = scheduledMessages.find(
          (msg: any) => msg.id?.toString() === post.scheduled_message_id.toString(),
        );

        if (!stillExists) {
          await postApi.updateScheduledPostAsPublished(post._id);
        }
      } catch (error) {
        console.error(`❌ Ошибка проверки отложенного сообщения для поста ${post._id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка проверки отложенных сообщений:', error);
  }
}

async function shutdown(): Promise<void> {
  console.log('\n🛑 Останавливаем сервис...');
  if (telegramClient) await telegramClient.disconnect();
  await db.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

(async () => {
  try {
    await initialize();

    cron.schedule('*/10 * * * *', updateChannels);
    cron.schedule('*/10 * * * *', updatePostedChannels);
    cron.schedule('*/5 * * * *', updatePostsStats);
    cron.schedule('*/30 * * * *', updateChannelsStats);
    cron.schedule('*/2 * * * *', checkScheduledPosts);
    cron.schedule('0 3 * * *', collectAnalytics);
    cron.schedule('15 3 * * *', collectDailySnapshots);
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
})();
