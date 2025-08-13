import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '../models/Category';
import { IUserPermissionService } from '../interfaces/services/IUserPermissionService';

export interface UserPermissions {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastVerified: Date;
}

export class UserPermissionService implements IUserPermissionService {
  constructor(private userRepository: UserRepository) {}

    /**
   * Проверяет актуальность прав пользователя и возвращает его текущие права
   */
     async verifyUserPermissions(userId: string): Promise<UserPermissions> {
    try {
      // ПРИНУДИТЕЛЬНО получаем актуальные данные пользователя из БД
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Проверяем, что пользователь не заблокирован
      if (user.role === ROLES.BANNED) {
        throw new Error('User account is banned');
      }

      // Проверяем, что пользователь активен (можно добавить поле is_active в модель User)
      const isActive = true; // Пока всегда true, можно расширить модель

      // Получаем права для роли
      const permissions = [...(ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [])];

       console.log(`UserPermissionService: Verified user ${user.username} with role ${user.role} and permissions:`, permissions);

       return {
         userId: user._id!.toString(),
         username: user.username,
         role: user.role,
         permissions,
         isActive,
         lastVerified: new Date()
       };
     } catch (error) {
       console.error(`UserPermissionService: Error verifying permissions for user ${userId}:`, error);
       throw new Error(`Failed to verify user permissions: ${error}`);
     }
   }

  /**
   * Проверяет, имеет ли пользователь конкретное право
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userPermissions = await this.verifyUserPermissions(userId);
      return userPermissions.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Проверяет, имеет ли пользователь одну из указанных ролей
   */
  async hasRole(userId: string, roles: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.verifyUserPermissions(userId);
      return roles.includes(userPermissions.role);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * Проверяет, является ли пользователь супер-администратором
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, [ROLES.SUPER_ADMIN]);
  }

  /**
   * Проверяет, является ли пользователь администратором или выше
   */
  async isAdminOrHigher(userId: string): Promise<boolean> {
    return this.hasRole(userId, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  }

  /**
   * Получает все права пользователя
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const userPermissions = await this.verifyUserPermissions(userId);
      return userPermissions.permissions;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }
}
