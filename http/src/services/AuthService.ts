import { IAuthService } from '../interfaces/services/IAuthService';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService implements IAuthService {
  constructor(private jwtSecret: string) {}

  generateToken(user: User): string {
    console.log('AuthService.generateToken called with user:', { 
      id: user._id, 
      username: user.username, 
      role: user.role 
    }); // Debug log
    
    return jwt.sign(
      { 
        userId: user._id?.toString(), 
        username: user.username,
        role: user.role
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