import { User, CreateUserDto } from '../user.model';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: CreateUserDto): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User | null>;
  deleteById(id: string): Promise<boolean>;
} 