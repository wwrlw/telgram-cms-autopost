import { UserPermissions } from './user-permission.service';

export interface IUserPermissionService {
  verifyUserPermissions(userId: string): Promise<UserPermissions>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
  hasRole(userId: string, roles: string[]): Promise<boolean>;
}
