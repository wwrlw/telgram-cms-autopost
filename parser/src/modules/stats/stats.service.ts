import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { ChannelConfig, ChannelStats, PostStats } from '../../types/index.js';
import { IChannelStatsRepository } from '../channel/channel.repository.interface.js';
import { IPostRepository } from '../post/post.repository.interface.js';
import { ConversionService } from './conversion.service.js';

export class StatsService {
  constructor(
    private client: TelegramClient,
    private channelStatsRepo: IChannelStatsRepository,
    private postRepository: IPostRepository,
    private conversionService: ConversionService,
  ) {}

  // ===== From ChannelStatsService =====

  async updateChannelsStats(targetChannels: ChannelConfig[]): Promise<void> {
    let updatedCount = 0;
    let skippedCount = 0;

    for (const channelConfig of targetChannels) {
      try {
        const subscribersCount = await this.getChannelSubscribersCount(channelConfig);

        if (subscribersCount !== null) {
          const sourceChannel = await this.getChannelIdentifierFromConfig(channelConfig);

          const channelStats: ChannelStats = {
            channel_id: channelConfig.id,
            source_channel: sourceChannel,
            subscribers_count: subscribersCount,
            last_updated: new Date()
          };

          await this.channelStatsRepo.saveChannelStats(channelStats);
          updatedCount++;
        } else {
          skippedCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Ошибка обновления статистики канала ${channelConfig.id}:`, error);
        skippedCount++;
      }
    }
  }

  async getChannelSubscribersFromDB(channelId: number): Promise<number> {
    try {
      const channelStats = await this.channelStatsRepo.getChannelStats(channelId);

      if (channelStats && channelStats.subscribers_count !== null && channelStats.subscribers_count !== undefined) {
        return channelStats.subscribers_count;
      } else {
        return 1000;
      }
    } catch (error) {
      console.error(`❌ Ошибка получения подписчиков канала ${channelId} из БД:`, error);
      return 1000;
    }
  }

  private async getChannelSubscribersCount(channelConfig: ChannelConfig): Promise<number | null> {
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

      let participantsCount = null;

      try {
        const fullChannel = await this.client.invoke(new Api.channels.GetFullChannel({
          channel: entity
        }));

        if (fullChannel.fullChat && (fullChannel.fullChat as any).participantsCount !== undefined) {
          participantsCount = (fullChannel.fullChat as any).participantsCount;
        }
      } catch (fullChannelError: any) {
      }

      if (participantsCount !== null && participantsCount !== undefined && participantsCount > 0) {
        return Number(participantsCount);
      } else {
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Ошибка получения подписчиков для канала ${channelConfig.id}:`, error?.message || error);
      return null;
    }
  }

  private async getChannelIdentifierFromConfig(channelConfig: ChannelConfig): Promise<string> {
    try {
      if (!channelConfig.is_private && channelConfig.username) {
        return channelConfig.username.replace('@', '');
      }

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

      if ((entity as any).username) {
        return (entity as any).username;
      }

      return `channel_${Math.abs(channelConfig.id)}`;
    } catch (error) {
      console.error('❌ Ошибка получения идентификатора канала:', error);
      return `channel_${Math.abs(channelConfig.id)}`;
    }
  }

  // ===== From TelegramService.updatePostsStats =====

  async updatePostsStats(targetChannels: ChannelConfig[]): Promise<void> {
    try {
      console.log('🔄 Начинаем обновление статистики постов с конверсией...');

      const statsLimit = Number(process.env.STATS_UPDATE_LIMIT) || 150;
      const recentPosts = await this.postRepository.getRecentPostsForStats(statsLimit);

      let updatedCount = 0;
      let skippedCount = 0;

      for (const post of recentPosts) {
        try {
          const urlMatch = post.url.match(/https:\/\/t\.me\/([^/]+)\/(\d+)/);
          if (!urlMatch) {
            skippedCount++;
            continue;
          }

          const [, channelIdentifier, messageIdStr] = urlMatch;
          const messageId = parseInt(messageIdStr);

          let entity;

          try {
            const channelConfig = targetChannels.find(c => {
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
              const subscribersCount = await this.getChannelSubscribersFromDB(post.channel_id);

              const conversionMetrics = this.conversionService.calculateConversionMetrics(updatedStats, subscribersCount);

              if (conversionMetrics) {
                await this.postRepository.updatePostStats(post.url, conversionMetrics);

                this.conversionService.logConversionMetrics(conversionMetrics, post.url);

                updatedCount++;
              } else {
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

  private getPostStatsFromMessage(message: any): PostStats | undefined {
    try {
      if (!message || !message.id) {
        console.log('⚠️ Некорректное сообщение для извлечения статистики');
        return undefined;
      }

      const stats: PostStats = {};
      let hasStats = false;

      if (message.views !== undefined && message.views !== null) {
        stats.views = Number(message.views);
        hasStats = true;
      }

      if (message.forwards !== undefined && message.forwards !== null) {
        stats.forwards = Number(message.forwards);
        hasStats = true;
      }

      if (message.replies && message.replies.replies !== undefined && message.replies.replies !== null) {
        stats.comments = Number(message.replies.replies);
        hasStats = true;
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
}
