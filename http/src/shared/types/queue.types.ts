export interface PublishPostJob {
    type: 'PUBLISH_POST';
    data : {
        postId: string;
        channelId: string;
        post: any;
        channel: any;
    }
}
export interface DeletePostJob {
    type: 'DELETE_POST';
    data: {
      messageId: string;
      channelId: string;
    };
  }
  
  export interface SchedulePostJob {
    type: 'SCHEDULE_POST';
    data: {
      postId: string;
      channelId: string;
      post: any;
      channel: any;
      scheduleDate: string;
    };
  }
  
  export type QueueJob = PublishPostJob | DeletePostJob | SchedulePostJob;