import { IUserService } from '../user.service.interface';
import { CreateUserDto, UserResponse } from '../user.model';
import { ValidationError } from '../../../shared/exceptions/validation.error';
import { ROLES } from '../../category/category.model';

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