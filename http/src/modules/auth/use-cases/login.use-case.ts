import { IUserService } from '../interfaces/services/IUserService';
import { LoginDto, AuthResponse } from '../models/User';
import { ValidationError } from '../exceptions/ValidationError';
import { AuthenticationError } from '../exceptions/AuthenticationError';

export class LoginUseCase {
  constructor(private userService: IUserService) {}

  async execute(loginData: LoginDto): Promise<AuthResponse> {
    if (!loginData.username || loginData.username.trim() === '') {
      throw new ValidationError('Username is required');
    }

    if (!loginData.password || loginData.password.trim() === '') {
      throw new ValidationError('Password is required');
    }

    try {
      return await this.userService.login(loginData);
    } catch (error) {
      throw new AuthenticationError('Invalid username or password');
    }
  }
} 