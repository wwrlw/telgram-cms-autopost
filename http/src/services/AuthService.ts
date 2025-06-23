import { IAuthService } from '../interfaces/services/IAuthService';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService implements IAuthService {
  constructor(private jwtSecret: string) {}

  generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user._id?.toString(), 
        username: user.username 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
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