import { IUserService } from '../interfaces/services/IUserService';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { IAuthService } from '../interfaces/services/IAuthService';
import { 
  User, 
  CreateUserDto, 
  LoginDto, 
  UserResponse, 
  AuthResponse 
} from '../models/User';
import { NotFoundError } from '../exceptions/NotFoundError';
import { AuthenticationError } from '../exceptions/AuthenticationError';

export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  async createUser(userData: CreateUserDto): Promise<UserResponse> {
    const existingUser = await this.userRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.authService.hashPassword(userData.password);
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    });

    return {
      id: user._id?.toString() || '',
      username: user.username
    };
  }

  async login(loginData: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByUsername(loginData.username);
    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    const isValidPassword = await this.authService.comparePassword(
      loginData.password, 
      user.password
    );

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid username or password');
    }

    const token = this.authService.generateToken(user);
    return { 
      token,
      userId: user._id?.toString() || ''
    };
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user._id?.toString() || '',
      username: user.username
    };
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await this.authService.comparePassword(password, hash);
  }
} 