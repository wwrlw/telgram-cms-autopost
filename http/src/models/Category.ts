import { ObjectId } from 'mongodb';

export interface Category {
  _id?: ObjectId;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
} 