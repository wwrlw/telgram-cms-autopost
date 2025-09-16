import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  role: string;
  created_at?: Date;
  favorite_posts?: ObjectId[];
}

export interface CreateUserDto {
  username: string;
  password: string;
  role?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  role: string;
  favorite_posts?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: string;
} 