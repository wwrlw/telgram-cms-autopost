import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  created_at?: Date;
  favorite_posts?: ObjectId[];
}

export interface CreateUserDto {
  username: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  favorite_posts?: string[];
}

export interface AuthResponse {
  token: string;
  userId: string;
} 