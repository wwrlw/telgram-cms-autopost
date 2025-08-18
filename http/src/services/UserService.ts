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
      username: user.username,
      role: user.role
    };
  }

  async login(loginData: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByUsername(loginData.username);
    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    console.log('Found user:', { id: user._id, username: user.username, role: user.role }); // Debug log

    const isValidPassword = await this.authService.comparePassword(
      loginData.password, 
      user.password
    );

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid username or password');
    }

    const token = this.authService.generateToken(user);
    const response = { 
      token,
      userId: user._id?.toString() || '',
      role: user.role
    };
    
    console.log('Login response:', response); // Debug log
    
    return response;
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user._id?.toString() || '',
      username: user.username,
      role: user.role,
      favorite_posts: user.favorite_posts?.map(postId => postId.toString()) || []
    };
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findByUsername(username);
  }

  async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => ({
      id: user._id?.toString() || '',
      username: user.username,
      role: user.role,
      favorite_posts: user.favorite_posts?.map(postId => postId.toString()) || []
    }));
  }

  async updateUserRole(userId: string, role: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.userRepository.update(userId, { role });
    
    return {
      id: user._id?.toString() || '',
      username: user.username,
      role: role,
      favorite_posts: user.favorite_posts?.map(postId => postId.toString()) || []
    };
  }

  async addFavoritePost(userId: string, postId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { ObjectId } = await import('mongodb');
    const postObjectId = new ObjectId(postId);
    
    if (!user.favorite_posts) {
      user.favorite_posts = [];
    }

    if (!user.favorite_posts.some(id => id.equals(postObjectId))) {
      user.favorite_posts.push(postObjectId);
      await this.userRepository.update(userId, { favorite_posts: user.favorite_posts });
    }

    return {
      id: user._id?.toString() || '',
      username: user.username,
      role: user.role,
      favorite_posts: user.favorite_posts.map(postId => postId.toString())
    };
  }

  async removeFavoritePost(userId: string, postId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { ObjectId } = await import('mongodb');
    const postObjectId = new ObjectId(postId);
    
    if (user.favorite_posts) {
      user.favorite_posts = user.favorite_posts.filter(id => !id.equals(postObjectId));
      await this.userRepository.update(userId, { favorite_posts: user.favorite_posts });
    }

    return {
      id: user._id?.toString() || '',
      username: user.username,
      role: user.role,
      favorite_posts: user.favorite_posts?.map(postId => postId.toString()) || []
    };
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await this.authService.comparePassword(password, hash);
  }
} 