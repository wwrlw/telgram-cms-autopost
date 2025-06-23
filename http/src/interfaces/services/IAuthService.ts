import { User } from '../../models/User';

export interface IAuthService {
  generateToken(user: User): string;
  verifyToken(token: string): any;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
} 