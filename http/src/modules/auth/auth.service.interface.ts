import { User } from '../user/user.model';

export interface IAuthService {
  generateAccessToken(user: User): string;
  generateRefreshToken(user: User): string;
  verifyAccessToken(token: string): any;
  verifyRefreshToken(token: string): any;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
} 