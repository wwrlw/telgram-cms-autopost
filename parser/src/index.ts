import dotenv from 'dotenv';
import { TelegramService } from './services/telegramService.js';
import { ApiService } from './services/apiService.js';
import { SchedulerService } from './services/SchedulerService.js';

dotenv.config();

const mongoUsername = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST || 'localhost';
const mongoPort = process.env.MONGO_PORT || '27019';
const MONGO_DB = process.env.MONGO_DB_NAME || 'parse-news';

let mongoUri = `mongodb://${mongoHost}:${mongoPort}/${MONGO_DB}`;
if (mongoUsername && mongoPassword) {
  mongoUri = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${MONGO_DB}?authSource=admin`;
}

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
const apiUsername = process.env.API_USERNAME || "myuser";
const apiPassword = process.env.API_PASSWORD || "mypassword";

if (!apiUsername || !apiPassword) {
  console.error('❌ API_USERNAME и API_PASSWORD должны быть установлены в переменных окружения');
  process.exit(1);
}

const config = {
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH!,
  sessionString: process.env.STRING_SESSION!,
  mongoUri: process.env.MONGO_URI || mongoUri,
  MONGO_DB,
  mediaPath: process.env.MEDIA_PATH || './media'
};

console.log('🔗 API URL:', apiBaseUrl);
console.log('📁 Media path:', config.mediaPath);
console.log('🗄️ MongoDB:', config.mongoUri);

const apiService = new ApiService(apiBaseUrl, apiUsername, apiPassword);

const schedulerService = new SchedulerService(apiService);

let telegramService: TelegramService;

async function initializeParser() {
  try {
    console.log('🔍 Получаем каналы из API...');
    
    const channelIds = await apiService.getChannelIds();
    
    if (channelIds.length === 0) {
      console.warn('⚠️ Не найдено каналов для парсинга. Добавьте каналы через веб-интерфейс.');
      setTimeout(initializeParser, 30000);
      return;
    }
    
    console.log('🎯 Target channel IDs:', channelIds);
    
    const channels = await apiService.getAllChannels();
    console.log('📋 Channels info:');
    channels.forEach(channel => {
      console.log(`  - ${channel.username} (ID: ${channel.channel_id})`);
    });

    telegramService = new TelegramService({
      ...config,
      targetChannelIds: channelIds
    });

    await telegramService.start();
    schedulerService.start();

    
  } catch (error) {
    console.error('❌ Ошибка инициализации парсера:', error);
    console.log('🔄 Повторная попытка через 30 секунд...');
    setTimeout(initializeParser, 30000);
  }
}

async function updateChannels() {
  try {
    console.log('🔄 Обновляем список каналов...');
    const channelIds = await apiService.getChannelIds();
    
    if (telegramService) {
      await telegramService.updateTargetChannels(channelIds);
    }
    
    console.log('✅ Список каналов обновлен:', channelIds);
  } catch (error) {
    console.error('❌ Ошибка обновления каналов:', error);
  }
}

async function updatePostsStats() {
  try {
    if (telegramService) {
      console.log('📊 Запускаем обновление статистики постов...');
      await telegramService.updatePostsStats();
    }
  } catch (error) {
    console.error('❌ Ошибка обновления статистики постов:', error);
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Получен сигнал SIGINT, останавливаем сервис...');
  schedulerService.stop();
  if (telegramService) {
    await telegramService.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Получен сигнал SIGTERM, останавливаем сервис...');
  schedulerService.stop();
  if (telegramService) {
    await telegramService.stop();
  }
  process.exit(0);
});

(async () => {
  try {
    await initializeParser();
    
    // Обновляем список каналов каждые 2,5 минут
    setInterval(updateChannels, 5 * 60 * 100);
    
    // Обновляем статистику постов каждые 2 часа
    setInterval(updatePostsStats, 2 * 60 * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
})(); 