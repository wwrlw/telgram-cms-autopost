import { IUserService } from '../../user/user.service.interface';
import { LoginDto, AuthResponse } from '../../user/user.model';
import { ValidationError } from '../../../shared/exceptions/validation.error';
import { AuthenticationError } from '../../../shared/exceptions/authentication.error';

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