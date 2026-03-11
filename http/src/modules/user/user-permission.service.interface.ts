import { UserPermissions } from '../../services/UserPermissionService';

export interface IUserPermissionService {
  verifyUserPermissions(userId: string): Promise<UserPermissions>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
  hasRole(userId: string, roles: string[]): Promise<boolean>;
  isSuperAdmin(userId: string): Promise<boolean>;
  isAdminOrHigher(userId: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<string[]>;
}
