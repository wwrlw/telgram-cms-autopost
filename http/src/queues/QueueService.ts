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
    }, {
      delay: scheduleDate.getTime() - Date.now()
    });
    
    console.log(`📤 Задача планирования добавлена в очередь: ${job.id}`);
    return job.id?.toString() || '';
  }
}