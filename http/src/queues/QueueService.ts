import Queue from 'bull';

export class QueueService {
  private publishQueue: Queue.Queue;

  constructor() {
    this.publishQueue = new Queue('publish-queue', process.env.REDIS_URL || 'redis://localhost:6379', {
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });
  }

  async publishPost(postId: string, channelId: string, post: any, channel: any) {
    const job = await this.publishQueue.add('PUBLISH_POST', {
      postId,
      channelId,
      post,
      channel
    });
    
    console.log(`📤 Задача публикации добавлена в очередь: ${job.id}`);
    return job.id?.toString() || '';
  }

  async deletePost(messageId: string, channelId: string) {
    const job = await this.publishQueue.add('DELETE_POST', {
      messageId,
      channelId
    });
    
    console.log(`📤 Задача удаления добавлена в очередь: ${job.id}`);
    return job.id?.toString() || '';
  }

  async schedulePost(postId: string, channelId: string, post: any, channel: any, scheduleDate: Date) {
    const job = await this.publishQueue.add('SCHEDULE_POST', {
      postId,
      channelId,
      post,
      channel,
      scheduleDate: scheduleDate.toISOString()
    });
    
    console.log(`📤 Задача планирования добавлена в очередь: ${job.id} (дата публикации: ${scheduleDate.toISOString()})`);
    return job.id?.toString() || '';
  }
  async getScheduledMessages(channelId: string) {
    const job = await this.publishQueue.add('GET_SCHEDULED_MESSAGES', {
      channelId
    });
    
    console.log(`📤 Задача получения отложенных сообщений добавлена в очередь: ${job.id}`);
    return job.id?.toString() || '';
  }

  async deleteScheduledMessage(scheduledMessageId: number, channelId: string) {
    const job = await this.publishQueue.add('DELETE_SCHEDULED_MESSAGE', {
      scheduledMessageId,
      channelId
    });
    
    console.log(`📤 Задача удаления отложенного сообщения добавлена в очередь: ${job.id}`);
    return job.id?.toString() || '';
  }

  async sendScheduledMessages(scheduledMessageIds: number[], channelId: string) {
    const job = await this.publishQueue.add('SEND_SCHEDULED_MESSAGES', {
      scheduledMessageIds,
      channelId
    });
    
    console.log(`📤 Задача отправки отложенных сообщений добавлена в очередь: ${job.id}`);
    return job.id?.toString() || '';
  }
}