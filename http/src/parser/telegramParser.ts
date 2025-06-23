import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { Db } from 'mongodb';

dotenv.config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH as string;
const sessionString = process.env.STRING_SESSION as string;
const targetChannels = (process.env.TARGET_CHANNELS || '').split(',').map(s => s.trim()).filter(Boolean);
const MEDIA_DIR = path.resolve(__dirname, '../../media');

if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

const stringSession = new StringSession(sessionString);
const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

export async function startTelegramParser(db: Db) {
  await client.start({
    phoneNumber: async () => '',
    password: async () => '',
    phoneCode: async () => '',
    onError: (err) => console.error('Telegram auth error:', err),
  });
  console.log('✅ Telegram parser authorized');

  client.addEventHandler(async (update) => {
    if (!(update instanceof Api.UpdateNewChannelMessage)) return;
    const msg = update.message;
    if (!(msg instanceof Api.Message)) return;
    const peer = msg.peerId;
    if (!(peer instanceof Api.PeerChannel)) return;
    try {
      const entity: any = await client.getEntity(peer);
      const username = entity.username || `channel_${peer.channelId}`;
      if (!targetChannels.includes(username)) return;
      const mediaArr: { type: string; file_path: string }[] = [];
      if (msg.media) {
        // Поддержка нескольких медиа: фото, видео, документы
        const mediaTypes = ['photo', 'document', 'video'];
        for (const type of mediaTypes) {
          if ((msg.media as any)[type]) {
            const filePath = path.join(MEDIA_DIR, `${peer.channelId}_${msg.id}_${type}`);
            try {
              await client.downloadMedia(msg, { outputFile: filePath });
              mediaArr.push({ type, file_path: path.relative(path.resolve(__dirname, '../../'), filePath) });
            } catch (err) {
              console.error('Ошибка при скачивании медиа:', err);
            }
          }
        }
      }
      const post = {
        source_channel: username,
        text: msg.message || '',
        timestamp: new Date(msg.date * 1000).toISOString(),
        url: `https://t.me/${username}/${msg.id}`,
        media: mediaArr,
        is_unique: false,
        created_at: new Date(),
      };
      await db.collection('parse-news').insertOne(post);
      console.log(`📤 Сохранён пост из ${username}:`, post.text);
    } catch (err: any) {
      console.error('Ошибка при обработке сообщения:', err.message);
    }
  });
  console.log('👂 Telegram parser is listening for new posts in:', targetChannels.join(', '));
} 