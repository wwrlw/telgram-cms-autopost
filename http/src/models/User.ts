import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  created_at?: Date;
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
}

export interface AuthResponse {
  token: string;
  userId: string;
} 