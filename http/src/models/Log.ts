import { ObjectId } from 'mongodb';

export interface Log {
  _id?: ObjectId;
  userId: ObjectId;
  username: string;
  action: string;
  method: string;
  url: string;
  body?: any;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
} 