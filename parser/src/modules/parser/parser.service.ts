import { TelegramClient } from 'telegram';
import { NewMessage } from 'telegram/events/index.js';
import { CreatePostDto, ChannelConfig, PostStats } from '../../types/index.js';
import { IPostRepository } from '../post/post.repository.interface.js';
import { MediaService } from '../media/media.service.js';
import { StatsService } from '../stats/stats.service.js';
import { ConversionService } from '../stats/conversion.service.js';
import { ChannelService } from '../channel/channel.service.js';
import { toRawId, peerToStoredId } from '../channel/channel-id.utils.js';

export class ParserService {
  private albumBuffer: { [groupedId: string]: any[] } = {};
  private albumTimers: { [groupedId: string]: NodeJS.Timeout } = {};

  constructor(
    private client: TelegramClient,
    private postRepository: IPostRepository,
    private mediaService: MediaService,
    private statsService: StatsService,
    private conversionService: ConversionService,
    private channelService: ChannelService,
  ) {}

  addEventHandlers(): void {
    this.client.addEventHandler(
      this.handleMessage.bind(this),
      new NewMessage({}),
    );
    console.log('👂 [Parser] Event handler зарегистрирован (NewMessage, all)');
  }

  private getPostStatsFromMessage(message: any): PostStats | undefined {
    try {
      if (!message?.id) return undefined;

      const stats: PostStats = {};
      let hasStats = false;

      if (message.views != null) { stats.views = Number(message.views); hasStats = true; }
      if (message.forwards != null) { stats.forwards = Number(message.forwards); hasStats = true; }
      if (message.replies?.replies != null) { stats.comments = Number(message.replies.replies); hasStats = true; }

      if (message.reactions?.results?.length) {
        const totalReactions = message.reactions.results.reduce(
          (total: number, r: any) => total + (Number(r.count) || 0), 0
        );
        if (totalReactions > 0) {
          stats.reactions = totalReactions;
          stats.reactions_detail = {};
          for (const r of message.reactions.results) {
            if (r.reaction && 'emoticon' in r.reaction) {
              const count = Number(r.count) || 0;
              if (count > 0) stats.reactions_detail[r.reaction.emoticon] = count;
            }
          }
          hasStats = true;
        }
      }

      if (!hasStats) return undefined;
      if (stats.views === undefined) stats.views = 0;
      if (stats.forwards === undefined) stats.forwards = 0;
      return stats;
    } catch (error) {
      console.error('❌ Ошибка извлечения статистики из сообщения:', error);
      return undefined;
    }
  }

  private async buildAndSavePost(
    peer: any,
    msg: any,
    mediaMessages: any,
    text: string,
    channelConfig: ChannelConfig | undefined,
    normalizedIncomingId: number,
  ): Promise<void> {
    const sourceChannel = await this.channelService.getChannelIdentifier(peer, channelConfig);
    const postUrl = `https://t.me/${sourceChannel}/${msg.id}`;

    const media = await this.mediaService.processMedia(
      this.client,
      mediaMessages,
      Number(peer.channelId || peer.userId || peer.chatId || 0),
      msg.id,
    );

    const stats = this.getPostStatsFromMessage(msg);
    const subscribersCount = await this.statsService.getChannelSubscribersFromDB(peerToStoredId(peer));
    const conversionMetrics = this.conversionService.calculateConversionMetrics(stats, subscribersCount);

    const postData: CreatePostDto = {
      source_channel: sourceChannel,
      channel_id: peerToStoredId(peer),
      text,
      url: postUrl,
      media,
      is_unique: false,
      conversion_metrics: conversionMetrics,
    };

    await this.postRepository.savePost(postData);
    this.conversionService.logConversionMetrics(conversionMetrics, postUrl);
  }

  private async handleMessage(update: any): Promise<void> {
    // --- RAW UPDATE DEBUG ---
    const updateType = update?.className || update?.constructor?.name || typeof update;
    const msgObj = update.message;

    if (!msgObj) {
      console.log(`[Parser] ⚠️  update без .message — тип: ${updateType}`);
      return;
    }

    const msg = msgObj;
    const peer = msg?.peerId;

    if (!peer) {
      console.log(`[Parser] ⚠️  message без peerId — msgId=${msg.id}, тип: ${updateType}`);
      return;
    }

    const rawChannelIdBig = peer.channelId ?? peer.userId ?? peer.chatId ?? 0;
    const channelId = Number(rawChannelIdBig);
    const normalizedIncomingId = toRawId(channelId);

    const peerType = peer.channelId ? 'channel' : peer.userId ? 'user' : peer.chatId ? 'chat' : 'unknown';

    const targetChannels = this.channelService.getTargetChannels();
    const normalizedTargetIds = targetChannels.map(c => toRawId(c.id));

    console.log(
      `[Parser] 📨 Сообщение msgId=${msg.id} | peer=${peerType} rawId=${rawChannelIdBig} → normalizedId=${normalizedIncomingId}` +
      ` | targets=[${normalizedTargetIds.join(',')}]`,
    );

    const isTargetChannel = normalizedTargetIds.includes(normalizedIncomingId);

    if (!isTargetChannel) {
      console.log(
        `[Parser] ⏭️  Не целевой канал: normalizedId=${normalizedIncomingId}` +
        ` не найден среди [${normalizedTargetIds.join(',')}] (всего каналов в конфиге: ${targetChannels.length})`,
      );
      return;
    }

    const channelConfig = targetChannels.find(c => toRawId(c.id) === normalizedIncomingId);
    console.log(`[Parser] ✅ Целевой канал найден: id=${channelConfig?.id}, is_private=${channelConfig?.is_private}`);

    if (msg.groupedId) {
      const groupId = msg.groupedId.toString();
      console.log(`[Parser] 🖼️  Альбом groupedId=${groupId}, буферизуем msgId=${msg.id}`);
      if (!this.albumBuffer[groupId]) this.albumBuffer[groupId] = [];
      if (!this.albumBuffer[groupId].some((m: any) => m.id === msg.id)) {
        this.albumBuffer[groupId].push(msg);
      }

      if (this.albumTimers[groupId]) clearTimeout(this.albumTimers[groupId]);

      this.albumTimers[groupId] = setTimeout(async () => {
        const albumMsgs = this.albumBuffer[groupId];
        delete this.albumBuffer[groupId];
        delete this.albumTimers[groupId];

        if (!albumMsgs?.length) return;

        console.log(`[Parser] 🖼️  Сохраняем альбом groupedId=${groupId} (${albumMsgs.length} шт.)`);
        try {
          const text = albumMsgs.find((m: any) => m.message)?.message || '';
          const mediaList = albumMsgs.map((m: any) => m.media).filter(Boolean);
          await this.buildAndSavePost(peer, albumMsgs[0], { media: mediaList }, text, channelConfig, normalizedIncomingId);
        } catch (error) {
          console.error('❌ Ошибка при обработке альбома сообщений:', error);
        }
      }, 1000);
      return;
    }

    try {
      const sourceChannel = await this.channelService.getChannelIdentifier(peer, channelConfig);
      const postUrl = `https://t.me/${sourceChannel}/${msg.id}`;

      const alreadyExists = await this.postRepository.checkPostExists(postUrl);
      if (alreadyExists) {
        console.log(`[Parser] ♻️  Дубликат, пропускаем: ${postUrl}`);
        return;
      }

      console.log(`[Parser] 📝 Сохраняем новый пост: ${postUrl}`);
      await this.buildAndSavePost(peer, msg, msg, msg.message || '', channelConfig, normalizedIncomingId);
      console.log(`[Parser] 💾 Пост сохранён: ${postUrl}`);
    } catch (error) {
      console.error('❌ Ошибка при обработке сообщения:', error);
    }
  }
}
