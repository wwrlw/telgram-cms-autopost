import { UserRepository } from './repositories/user.repository';
import { ROLES, ROLE_PERMISSIONS } from '../category/category.model';
import { IUserPermissionService } from './user-permission.service.interface';

export interface UserPermissions {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
}

export class UserPermissionService implements IUserPermissionService {
  constructor(private userRepository: UserRepository) {}

  async verifyUserPermissions(userId: string): Promise<UserPermissions> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      (error as any).code = 'USER_NOT_FOUND';
      throw error;
    }

    if (user.role === ROLES.BANNED) {
      throw new Error('User account is banned');
    }

    return {
      userId: user._id!.toString(),
      username: user.username,
      role: user.role,
      permissions: [...(ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [])],
    };
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const { permissions } = await this.verifyUserPermissions(userId);
      return permissions.includes(permission);
    } catch {
      return false;
    }
  }

  async hasRole(userId: string, roles: string[]): Promise<boolean> {
    try {
      const { role } = await this.verifyUserPermissions(userId);
      return roles.includes(role);
    } catch {
      return false;
    }
  }
}
