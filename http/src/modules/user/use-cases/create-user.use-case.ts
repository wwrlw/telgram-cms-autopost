import { IUserService } from '../interfaces/services/IUserService';
import { CreateUserDto, UserResponse } from '../models/User';
import { ValidationError } from '../exceptions/ValidationError';
import { ROLES } from '../models/Category';

export class CreateUserUseCase {
  constructor(private userService: IUserService) {}

  async execute(userData: CreateUserDto): Promise<UserResponse> {
    if (!userData.username || userData.username.trim() === '') {
      throw new ValidationError('Username is required');
    }

    if (!userData.password || userData.password.trim() === '') {
      throw new ValidationError('Password is required');
    }

    if (userData.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Default role is editor if not specified
    if (!userData.role) {
      userData.role = ROLES.EDITOR;
    }

    try {
      return await this.userService.createUser(userData);
    } catch (error) {
      throw error;
    }
  }
} 