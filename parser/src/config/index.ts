import dotenv from 'dotenv';
dotenv.config();

export const config = {
  telegram: {
    apiId: Number(process.env.API_ID),
    apiHash: process.env.API_HASH!,
    sessionString: process.env.STRING_SESSION!,
  },
  mongo: {
    uri: buildMongoUri(),
    dbName: process.env.MONGO_DB_NAME || 'parse-news',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
    username: process.env.API_USERNAME || 'myuser',
    password: process.env.API_PASSWORD || 'mypassword',
  },
  mediaPath: process.env.MEDIA_PATH || './media',
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6380' },
};

function buildMongoUri(): string {
  const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOST, MONGO_PORT, MONGO_DB_NAME } = process.env;
  if (MONGO_USERNAME && MONGO_PASSWORD) {
    return `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME || 'parse-news'}?authSource=admin`;
  }
  return process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/parse-news';
}
