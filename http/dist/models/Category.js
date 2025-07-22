"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.PERMISSIONS = exports.ROLES = void 0;
exports.ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    EDITOR: 'editor'
};
exports.PERMISSIONS = {
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
};
exports.ROLE_PERMISSIONS = {
    [exports.ROLES.SUPER_ADMIN]: Object.values(exports.PERMISSIONS),
    [exports.ROLES.ADMIN]: [
        exports.PERMISSIONS.MANAGE_POSTS,
        exports.PERMISSIONS.MANAGE_CATEGORIES,
        exports.PERMISSIONS.MANAGE_CHANNELS,
        exports.PERMISSIONS.MANAGE_PUBLICATION_CHANNELS,
        exports.PERMISSIONS.VIEW_ANALYTICS
    ],
    [exports.ROLES.EDITOR]: [
        exports.PERMISSIONS.MANAGE_POSTS,
        exports.PERMISSIONS.MANAGE_CATEGORIES
    ]
};
