import { IAuthService } from './auth.service.interface';
import { User } from '../user/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService implements IAuthService {
  constructor(
    private accessSecret: string,
    private refreshSecret: string,
    private accessTtl: string = '15m',
    private refreshTtl: string = '30d'
  ) {}

  private parseTtlToSeconds(ttl: string): number {
    const trimmed = (ttl || '').toString().trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
    const match = trimmed.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return 900; // 15m по умолчанию
    }
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900;
    }
  }

  generateAccessToken(user: User): string {
    const expSeconds = this.parseTtlToSeconds(this.accessTtl);
    return jwt.sign(
      {
        userId: user._id?.toString(),
        username: user.username,
        role: user.role
      },
      this.accessSecret,
      { expiresIn: expSeconds }
    );
  }

  generateRefreshToken(user: User): string {
    const expSeconds = this.parseTtlToSeconds(this.refreshTtl);
    return jwt.sign(
      {
        userId: user._id?.toString(),
        username: user.username,
        role: user.role,
        type: 'refresh'
      },
      this.refreshSecret,
      { expiresIn: expSeconds }
    );
  }

  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.accessSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
} 