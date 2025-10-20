import dotenv from 'dotenv';
dotenv.config();
import { FastifyMongoObject } from '@fastify/mongodb';
import { PostRepository } from '../repositories/PostRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ChannelRepository } from '../repositories/ChannelRepository';
import { PublicationChannelRepository } from '../repositories/PublicationChannelRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { PostService } from '../services/PostService';
import { UserService } from '../services/UserService';
import { ChannelService } from '../services/ChannelService';
import { PublicationChannelService } from '../services/PublicationChannelService';
import { CategoryService } from '../services/CategoryService';
import { AuthService } from '../services/AuthService';
import { YandexGPTService } from '../services/YandexGPTService';
import { UserPermissionService } from '../services/UserPermissionService';
import { CreateUserUseCase } from '../use-cases/CreateUserUseCase';
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { TelegramPublishService } from '../services/TelegramPublishService';
import { PublishPostUseCase } from '../use-cases/PublishPostUseCase';
import { PostedChannelRepository } from '../repositories/PostedChannelRepository';
import { PostedChannelService } from '../services/PostedChannelService';


export class DependencyContainer {
  private static instance: DependencyContainer;
  private mongo: FastifyMongoObject | null = null;
  // Кэш инстансов для избежания лишних аллокаций и единообразного жизненного цикла
  private postRepository?: PostRepository;
  private userRepository?: UserRepository;
  private channelRepository?: ChannelRepository;
  private publicationChannelRepository?: PublicationChannelRepository;
  private categoryRepository?: CategoryRepository;
  private postedChannelRepository?: PostedChannelRepository;

  private authService?: AuthService;
  private userPermissionService?: UserPermissionService;
  private yandexGptService?: YandexGPTService;
  private telegramPublishService?: TelegramPublishService;

  private postService?: PostService;
  private userService?: UserService;
  private channelService?: ChannelService;
  private publicationChannelService?: PublicationChannelService;
  private categoryService?: CategoryService;
  private postedChannelService?: PostedChannelService;

  private constructor() {}

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  setMongo(mongo: FastifyMongoObject) {
    this.mongo = mongo;
  }

  getPostRepository(): PostRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    if (!this.postRepository) this.postRepository = new PostRepository(this.mongo);
    return this.postRepository;
  }
  getTelegramPublishService(): TelegramPublishService {
    if (!this.telegramPublishService) this.telegramPublishService = new TelegramPublishService();
    return this.telegramPublishService;
  }
  
  getPublishPostUseCase(): PublishPostUseCase {
    return new PublishPostUseCase(
      this.getPostRepository(),
      this.getTelegramPublishService()
    );
  }

  getUserRepository(): UserRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    if (!this.userRepository) this.userRepository = new UserRepository(this.mongo);
    return this.userRepository;
  }

  getChannelRepository(): ChannelRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    if (!this.channelRepository) this.channelRepository = new ChannelRepository(this.mongo);
    return this.channelRepository;
  }

  getPublicationChannelRepository(): PublicationChannelRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    if (!this.publicationChannelRepository) this.publicationChannelRepository = new PublicationChannelRepository(this.mongo);
    return this.publicationChannelRepository;
  }

  getCategoryRepository(): CategoryRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    if (!this.categoryRepository) this.categoryRepository = new CategoryRepository(this.mongo);
    return this.categoryRepository;
  }

  getPostedChannelRepository(): PostedChannelRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    if (!this.postedChannelRepository) this.postedChannelRepository = new PostedChannelRepository(this.mongo);
    return this.postedChannelRepository;
  }

  getAuthService(): AuthService {
    const accessSecret = process.env.JWT_SECRET || '';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '';
    const accessTtl = process.env.JWT_ACCESS_TTL || '24h';
    const refreshTtl = process.env.JWT_REFRESH_TTL || '30d';
    if (!refreshTtl || !accessTtl || !accessSecret || !refreshSecret) {
      throw new Error('JWT_SECRET or JWT_REFRESH_SECRET or JWT_ACCESS_TTL or JWT_REFRESH_TTL is not set in .env');
    }
    if (!this.authService) this.authService = new AuthService(accessSecret, refreshSecret, accessTtl, refreshTtl);
    return this.authService;
  }

  getUserPermissionService(): UserPermissionService {
    if (!this.userPermissionService) this.userPermissionService = new UserPermissionService(this.getUserRepository());
    return this.userPermissionService;
  }

  getYandexGPTService(): YandexGPTService {
    if (!this.yandexGptService) this.yandexGptService = new YandexGPTService();
    return this.yandexGptService;
  }

  getPostService(): PostService {
    if (!this.postService) this.postService = new PostService(this.getPostRepository(), this.getYandexGPTService());
    return this.postService;
  }

  getUserService(): UserService {
    if (!this.userService) this.userService = new UserService(this.getUserRepository(), this.getAuthService());
    return this.userService;
  }

  getChannelService(): ChannelService {
    if (!this.channelService) this.channelService = new ChannelService(this.getChannelRepository());
    return this.channelService;
  }

  getPublicationChannelService(): PublicationChannelService {
    if (!this.publicationChannelService) this.publicationChannelService = new PublicationChannelService(this.getPublicationChannelRepository());
    return this.publicationChannelService;
  }

  getCategoryService(): CategoryService {
    if (!this.categoryService) this.categoryService = new CategoryService(this.getCategoryRepository());
    return this.categoryService;
  }

  getPostedChannelService(): PostedChannelService {
    if (!this.postedChannelService) this.postedChannelService = new PostedChannelService(this.getPostedChannelRepository());
    return this.postedChannelService;
  }

  getCreateUserUseCase(): CreateUserUseCase {
    return new CreateUserUseCase(this.getUserService());
  }

  getLoginUseCase(): LoginUseCase {
    return new LoginUseCase(this.getUserService());
  }
} 