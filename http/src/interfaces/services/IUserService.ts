import { User, CreateUserDto, LoginDto, UserResponse, AuthResponse } from '../../models/User';

export interface IUserService {
  createUser(userData: CreateUserDto): Promise<UserResponse>;
  login(loginData: LoginDto): Promise<AuthResponse>;
  getUserById(id: string): Promise<UserResponse>;
  findByUsername(username: string): Promise<User | null>;
  getAllUsers(): Promise<UserResponse[]>;
  updateUserRole(userId: string, role: string): Promise<UserResponse>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  addFavoritePost(userId: string, postId: string): Promise<UserResponse>;
  removeFavoritePost(userId: string, postId: string): Promise<UserResponse>;
} 