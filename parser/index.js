import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import axios from 'axios';
import dotenv from 'dotenv';
import { Api } from 'telegram';

dotenv.config();
 
const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const sessionString = process.env.STRING_SESSION;
const targetChannels = process.env.TARGET_CHANNELS?.split(',') || [];
const API_URL = process.env.API_URL;

const stringSession = new StringSession(sessionString); // пустая строка для первой авторизации

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

(async () => {
  await client.start({
    phoneNumber: async () => await input.text('Введите номер телефона: '),
    password: async () => await input.text('Введите пароль: '),
    phoneCode: async () => await input.text('Введите код из Telegram: '),
    onError: (err) => console.error(err),
  });

  console.log('✅ Авторизация успешна');
  console.log('🔐 Сессия:', client.session.save());

  client.addEventHandler(async (update) => {
    if (!(update instanceof Api.UpdateNewChannelMessage)) return;

    const msg = update.message;
    const peer = msg.peerId;

    if (!(peer instanceof Api.PeerChannel)) return;

    try {
      const entity = await client.getEntity(peer);
      const username = entity.username || `channel_${peer.channelId}`;

      if (!targetChannels.includes(username)) return;

      const post = {
        id: `${peer.channelId}_${msg.id}`,
        source_channel: username,
        text: msg.message || '',
        timestamp: new Date(msg.date * 1000).toISOString(),
        url: `https://t.me/${username}/${msg.id}`,
        media: null
      };

      if (msg.media) {
        try {
          const filePath = await client.downloadMedia(msg, {
            outputFile: `media/${peer.channelId}_${msg.id}`
          });
          post.media = {
            type: msg.media.className,
            file_path: filePath
          };
        } catch (err) {
          console.error('Ошибка при скачивании медиа:', err);
          post.media = { error: 'download_failed' };
        }
      }
      await axios.post(API_URL, post);
      console.log(`📤 Отправлен пост из ${username}:`, post.text);
    } catch (err) {
      console.error('Ошибка при обработке сообщения:', err.message);
    }
  });

  console.log('👂 Слушаем посты из каналов:', targetChannels.join(', '));
})();
