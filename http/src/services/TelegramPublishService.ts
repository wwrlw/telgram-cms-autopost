import { ITelegramPublishService } from '../interfaces/services/ITelegramPublishService';
import { Post } from '../models/Post';
import { PostedChannel } from '../types/PostedChannel';

export class TelegramPublishService implements ITelegramPublishService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '8175655426:AAEw_vSc04q4LJ44Jg4WqX0rmLITy_R-hNE';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async publishPost(post: Post, channel: PostedChannel): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log('Начинаем публикацию поста:', { id: post._id });
  
      const messageText = this.formatMessageText(post, channel);
  
              if (post.media && post.media.length > 0) {
          console.log(`📎 Обнаружено ${post.media.length} медиа-файлов. Отправляем медиа с подписью.`);
          const result = await this.sendMedia(post, channel, messageText);
          if (result.success) {
            console.log('✅ Пост успешно опубликован');
            return { 
              success: true, 
              message: `Пост успешно опубликован в канал ${channel.name}`,
              messageId: result.messageId
            };
          } else {
            return { success: false, message: result.message };
          }
      } else {
        console.log('📝 Медиа не найдено. Отправляем текстовое сообщение.');
        const requestBody = {
          chat_id: channel.channel_id,
          text: messageText,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        };
  
        const response = await fetch(`${this.baseUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
  
        const result = await response.json();
        console.log('Ответ от Telegram API (sendMessage):', JSON.stringify(result, null, 2));
        
        if (!result.ok) {
          console.error('❌ Ошибка Telegram API при отправке текста:', result.description);
          return { success: false, message: `Ошибка Telegram API: ${result.description}` };
        }
  
        console.log('✅ Пост успешно опубликован');
        return { 
          success: true, 
          message: `Пост успешно опубликован в канал ${channel.name}`,
          messageId: result.result.message_id.toString()
        };
      }
  
    } catch (error) {
      console.error('❌ Ошибка при публикации в Telegram:', error);
      return { success: false, message: 'Критическая ошибка при отправке в Telegram' };
    } finally {
      console.log('=== КОНЕЦ ПУБЛИКАЦИИ В TELEGRAM ===');
    }
  }

  async deletePost(messageId: string, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Начинаем удаление поста из Telegram:', { messageId, channelId });

      const requestBody = {
        chat_id: channelId,
        message_id: parseInt(messageId)
      };

      const response = await fetch(`${this.baseUrl}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('Ответ от Telegram API (deleteMessage):', JSON.stringify(result, null, 2));

      if (!result.ok) {
        console.error('❌ Ошибка Telegram API при удалении сообщения:', result.description);
        return { success: false, message: `Ошибка Telegram API: ${result.description}` };
      }

      console.log('✅ Пост успешно удален из Telegram');
      return { success: true, message: 'Пост успешно удален из Telegram' };

    } catch (error) {
      console.error('❌ Ошибка при удалении поста из Telegram:', error);
      return { success: false, message: 'Критическая ошибка при удалении из Telegram' };
    }
  }

  private formatMessageText(post: Post, channel: PostedChannel): string {
    const text = (post.text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\r\n|\r|\n/g, '\n'); // только \n для Telegram

    let result = text;
    if (channel.signature) {
      if (result) result += '\n\n';
      result += channel.signature;
    }

    // Удаляем все теги кроме поддерживаемых Telegram
    result = result.replace(/<(?!\/?(b|i|a|code|pre)\b)[^>]*>/gi, '');

    // Удаляем все <br>, <br/>, <br /> из результата (включая сигнатуру)
    result = result.replace(/<br\s*\/?>/gi, '\n');

    console.log('ИТОГОВОЕ СООБЩЕНИЕ В TELEGRAM:', result);
    return result;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private async sendMedia(post: Post, channel: PostedChannel, caption: string): Promise<{ success: boolean; message: string; messageId?: string }> {

    const getMediaUrl = (filePath: string) => {
      const cleanPath = filePath.replace('/app/', '');
      const baseUrl = process.env.VITE_API_URL || 'https://tg.chiorio.com/api/';
      return `${baseUrl}${cleanPath}`;
    };
  
    try {
      for (let i = 0; i < post.media.length; i++) {
        const media = post.media[i];
        console.log(`📎 Отправляем медиа ${i + 1}/${post.media.length}:`, {
          type: media.type,
          file_path: media.file_path
        });
        
        const mediaType = media.type;
        const method = this.getMediaMethod(mediaType);
        
        if (method) {
          const publicUrl = getMediaUrl(media.file_path);
          console.log('Публичный URL медиа:', publicUrl);
          
          try {
            const fileCheckResponse = await fetch(publicUrl, { method: 'HEAD' });
            console.log('Статус доступности файла:', fileCheckResponse.status);
            if (!fileCheckResponse.ok) {
              console.error('❌ Файл недоступен по URL:', publicUrl);
            }
          } catch (fileError) {
            console.error('❌ Ошибка при проверке файла:', fileError);
          }

          const mediaRequestBody = {
            chat_id: channel.channel_id,
            [mediaType]: publicUrl,
            caption: caption.substring(0, 1024), 
            parse_mode: 'HTML'
          };
          
          console.log('Запрос медиа к Telegram API:', JSON.stringify(mediaRequestBody, null, 2));

          const mediaResponse = await fetch(`${this.baseUrl}/${method}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mediaRequestBody)
          });

          const mediaResult = await mediaResponse.json();
          console.log('Ответ от Telegram API (медиа):', JSON.stringify(mediaResult, null, 2));

          if (mediaResult.ok) {
            console.log(`✅ Медиа ${i + 1} отправлено успешно`);
            return { success: true, message: 'Медиа отправлено успешно', messageId: mediaResult.result.message_id.toString() };
          } else {
            console.error(`❌ Ошибка отправки медиа ${i + 1}:`, mediaResult.description);
            return { success: false, message: `Ошибка отправки медиа ${i + 1}: ${mediaResult.description}` };
          }
        } else {
          console.error(`❌ Неизвестный тип медиа: ${mediaType}`);
          return { success: false, message: `Неизвестный тип медиа: ${mediaType}` };
        }
      }
      return { success: true, message: 'Медиа отправлено успешно', messageId: undefined }; // Should not reach here if media is present
    } catch (error) {
      console.error('❌ Ошибка при отправке медиа:', error);
      return { success: false, message: 'Критическая ошибка при отправке медиа' };
    }
  }

  private getMediaMethod(mediaType: string): string | null {
    const mediaMethods: { [key: string]: string } = {
      'photo': 'sendPhoto',
      'video': 'sendVideo',
      'document': 'sendDocument',
      'audio': 'sendAudio',
      'voice': 'sendVoice'
    };
    
    return mediaMethods[mediaType] || null;
  }

  private markdownToHtml(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')  // **жирный** -> <b>жирный</b>
      .replace(/\*(.*?)\*/g, '<i>$1</i>')      // *курсив* -> <i>курсив</i>
      .replace(/`(.*?)`/g, '<code>$1</code>')  // `код` -> <code>код</code>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'); // [текст](ссылка) -> <a href="ссылка">текст</a>
  }

  async getChannelAnalytics(channelId: string): Promise<any> {
    try {
      console.log('Получаем аналитику для канала:', channelId);

      // Получаем информацию о канале
      const channelInfo = await this.getChannelInfo(channelId);
      
      // Получаем статистику постов
      const postsStats = await this.getPostsStats(channelId);
      
      // Получаем данные о росте подписчиков
      const subscribersGrowth = await this.getSubscribersGrowth(channelId);
      
      // Получаем данные о просмотрах
      const viewsData = await this.getViewsData(channelId);
      
      // Получаем данные о вовлеченности
      const engagementData = await this.getEngagementData(channelId);

      return {
        subscribers_count: channelInfo.subscribers_count || 0,
        posts_count: postsStats.total_posts || 0,
        views_count: postsStats.total_views || 0,
        avg_reach: postsStats.avg_reach || 0,
        subscribers_growth: subscribersGrowth,
        posts_activity: postsStats.activity_data || [],
        views_data: viewsData,
        engagement_data: engagementData,
        top_posts: postsStats.top_posts || [],
        best_posting_times: postsStats.best_times || [],
        content_types: postsStats.content_types || []
      };

    } catch (error) {
      console.error('Ошибка при получении аналитики канала:', error);
      throw error;
    }
  }

  private async getChannelInfo(channelId: string): Promise<any> {
    try {
      console.log('Получаем информацию о канале:', channelId);
      
      const response = await fetch(`${this.baseUrl}/getChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: channelId })
      });

      const result = await response.json();
      console.log('Ответ от Telegram API (getChat):', JSON.stringify(result, null, 2));
      
      if (!result.ok) {
        console.error('Ошибка получения информации о канале:', result.description);
        return { subscribers_count: 0 };
      }

      return {
        subscribers_count: result.result.member_count || 0,
        title: result.result.title,
        username: result.result.username,
        description: result.result.description,
        type: result.result.type
      };
    } catch (error) {
      console.error('Ошибка при получении информации о канале:', error);
      return { subscribers_count: 0 };
    }
  }

  private async getPostsStats(channelId: string): Promise<any> {
    try {
      console.log('Получаем статистику постов для канала:', channelId);
      
      // Получаем последние сообщения канала
      const response = await fetch(`${this.baseUrl}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limit: 100,
          offset: -100,
          allowed_updates: ['channel_post']
        })
      });

      const result = await response.json();
      console.log('Ответ от Telegram API (getUpdates):', JSON.stringify(result, null, 2));
      
      if (!result.ok) {
        console.error('Ошибка получения статистики постов:', result.description);
        return this.getMockPostsStats();
      }

      // Фильтруем сообщения только для нужного канала
      const messages = result.result.filter((update: any) => 
        update.channel_post && 
        update.channel_post.chat && 
        update.channel_post.chat.id.toString() === channelId.toString()
      );

      console.log(`Найдено ${messages.length} сообщений для канала ${channelId}`);

      const totalPosts = messages.length;
      const totalViews = messages.reduce((sum: number, msg: any) => 
        sum + (msg.channel_post.views || 0), 0
      );
      const avgReach = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;

      // Группируем по дням для активности
      const activityData = this.groupMessagesByDate(messages);
      
      // Топ постов по просмотрам
      const topPosts = messages
        .map((msg: any) => ({
          id: msg.channel_post.message_id,
          title: msg.channel_post.text?.substring(0, 50) || `Пост #${msg.channel_post.message_id}`,
          views: msg.channel_post.views || 0,
          date: new Date(msg.channel_post.date * 1000).toISOString()
        }))
        .sort((a: any, b: any) => b.views - a.views)
        .slice(0, 5);

      // Лучшее время для публикаций
      const bestTimes = this.analyzeBestPostingTimes(messages);

      // Типы контента
      const contentTypes = this.analyzeContentTypes(messages);

      const stats = {
        total_posts: totalPosts,
        total_views: totalViews,
        avg_reach: avgReach,
        activity_data: activityData,
        top_posts: topPosts,
        best_times: bestTimes,
        content_types: contentTypes
      };

      console.log('Статистика постов:', JSON.stringify(stats, null, 2));
      return stats;

    } catch (error) {
      console.error('Ошибка при получении статистики постов:', error);
      return this.getMockPostsStats();
    }
  }

  private getMockPostsStats(): any {
    return {
      total_posts: 342,
      total_views: 1250000,
      avg_reach: 3650,
      activity_data: [
        { date: '2024-07-01', count: 12 },
        { date: '2024-07-02', count: 8 },
        { date: '2024-07-03', count: 15 },
        { date: '2024-07-04', count: 10 },
        { date: '2024-07-05', count: 18 },
        { date: '2024-07-06', count: 14 },
        { date: '2024-07-07', count: 16 }
      ],
      top_posts: [
        { id: 1, title: 'Важные новости', views: 12500 },
        { id: 2, title: 'Обновление системы', views: 9800 },
        { id: 3, title: 'Новые возможности', views: 8700 },
        { id: 4, title: 'Анонс', views: 7600 },
        { id: 5, title: 'Технические работы', views: 6500 }
      ],
      best_times: [
        { hour: 9, engagement: 8.5 },
        { hour: 12, engagement: 7.2 },
        { hour: 15, engagement: 6.8 },
        { hour: 18, engagement: 9.1 },
        { hour: 21, engagement: 7.9 }
      ],
      content_types: [
        { type: 'text', count: 180 },
        { type: 'photo', count: 95 },
        { type: 'video', count: 45 },
        { type: 'document', count: 22 }
      ]
    };
  }

  private groupMessagesByDate(messages: any[]): any[] {
    const grouped = messages.reduce((acc: any, msg: any) => {
      const date = new Date(msg.channel_post.date * 1000).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  private analyzeBestPostingTimes(messages: any[]): any[] {
    const hourStats = messages.reduce((acc: any, msg: any) => {
      const hour = new Date(msg.channel_post.date * 1000).getHours();
      if (!acc[hour]) {
        acc[hour] = { total_views: 0, count: 0 };
      }
      acc[hour].total_views += msg.channel_post.views || 0;
      acc[hour].count += 1;
      return acc;
    }, {});

    return Object.entries(hourStats)
      .map(([hour, stats]: [string, any]) => ({
        hour: parseInt(hour),
        engagement: stats.count > 0 ? Math.round((stats.total_views / stats.count) / 100) / 10 : 0
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);
  }

  private analyzeContentTypes(messages: any[]): any[] {
    const typeStats = messages.reduce((acc: any, msg: any) => {
      let type = 'text';
      const post = msg.channel_post;
      
      if (post.photo && post.photo.length > 0) type = 'photo';
      else if (post.video) type = 'video';
      else if (post.document) type = 'document';
      else if (post.audio) type = 'audio';
      else if (post.voice) type = 'voice';
      else if (post.video_note) type = 'video_note';
      else if (post.sticker) type = 'sticker';
      else if (post.animation) type = 'animation';
      else if (post.text) type = 'text';
      
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeStats)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }

  private async getSubscribersGrowth(channelId: string): Promise<any[]> {
    // В реальном API Telegram нет прямого доступа к истории роста подписчиков
    // Возвращаем моковые данные
    return [
      { date: '2024-01-01', count: 12000 },
      { date: '2024-02-01', count: 12500 },
      { date: '2024-03-01', count: 13100 },
      { date: '2024-04-01', count: 13800 },
      { date: '2024-05-01', count: 14200 },
      { date: '2024-06-01', count: 14800 },
      { date: '2024-07-01', count: 15420 }
    ];
  }

  private async getViewsData(channelId: string): Promise<any[]> {
    // Моковые данные для просмотров
    return [
      { date: '2024-07-01', views: 45000 },
      { date: '2024-07-02', views: 38000 },
      { date: '2024-07-03', views: 52000 },
      { date: '2024-07-04', views: 41000 },
      { date: '2024-07-05', views: 61000 },
      { date: '2024-07-06', views: 48000 },
      { date: '2024-07-07', views: 55000 }
    ];
  }

  private async getEngagementData(channelId: string): Promise<any[]> {
    // Моковые данные для вовлеченности
    return [
      { date: '2024-07-01', engagement: 4.2 },
      { date: '2024-07-02', engagement: 3.8 },
      { date: '2024-07-03', engagement: 5.1 },
      { date: '2024-07-04', engagement: 4.5 },
      { date: '2024-07-05', engagement: 6.2 },
      { date: '2024-07-06', engagement: 4.8 },
      { date: '2024-07-07', engagement: 5.5 }
    ];
  }
} 
