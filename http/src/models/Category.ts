import { ObjectId } from 'mongodb';

export interface Category {
  _id?: ObjectId;
  name: string;
  description?: string;
  color?: string; // Цвет для UI (hex код)
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

export interface Role {
  _id?: ObjectId;
  name: string;
  permissions: string[];
  created_at?: Date;
}

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor'
} as const;

export const PERMISSIONS = {
  // User management
  CREATE_USER: 'create_user',
  ASSIGN_ROLE: 'assign_role',
  VIEW_LOGS: 'view_logs',

  // Content management
  MANAGE_POSTS: 'manage_posts',
  MANAGE_CATEGORIES: 'manage_categories',

  // Channel management
  MANAGE_CHANNELS: 'manage_channels',
  MANAGE_PUBLICATION_CHANNELS: 'manage_publication_channels',

  // Analytics
  VIEW_ANALYTICS: 'view_analytics'
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.MANAGE_POSTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_CHANNELS,
    PERMISSIONS.MANAGE_PUBLICATION_CHANNELS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.MANAGE_POSTS,
    PERMISSIONS.MANAGE_CATEGORIES
  ]
} as const; 