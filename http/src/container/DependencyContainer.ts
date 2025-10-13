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
import { GetPostUseCase } from '../use-cases/GetPostUseCase';
import { GetPostsUseCase } from '../use-cases/GetPostsUseCase';
import { GetPostsWithQueryUseCase } from '../use-cases/GetPostsWithQueryUseCase';
import { GetPostsInfiniteScrollUseCase } from '../use-cases/GetPostsInfiniteScrollUseCase';
import { GetPostsStatsUseCase } from '../use-cases/GetPostsStatsUseCase';
import { DeletePostUseCase } from '../use-cases/DeletePostUseCase';
import { UniquizePostUseCase } from '../use-cases/UniquizePostUseCase';
import { CreateUserUseCase } from '../use-cases/CreateUserUseCase';
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { CreatePublicationChannelUseCase } from '../use-cases/CreatePublicationChannelUseCase';
import { GetPublicationChannelsUseCase } from '../use-cases/GetPublicationChannelsUseCase';
import { GetActivePublicationChannelsUseCase } from '../use-cases/GetActivePublicationChannelsUseCase';
import { UpdatePublicationChannelUseCase } from '../use-cases/UpdatePublicationChannelUseCase';
import { DeletePublicationChannelUseCase } from '../use-cases/DeletePublicationChannelUseCase';
import { TelegramPublishService } from '../services/TelegramPublishService';
import { PublishPostUseCase } from '../use-cases/PublishPostUseCase';
import { CreateManualPostUseCase } from '../use-cases/CreateManualPostUseCase';


export class DependencyContainer {
  private static instance: DependencyContainer;
  private mongo: FastifyMongoObject | null = null;
  // Кэш инстансов для избежания лишних аллокаций и единообразного жизненного цикла
  private postRepository?: PostRepository;
  private userRepository?: UserRepository;
  private channelRepository?: ChannelRepository;
  private publicationChannelRepository?: PublicationChannelRepository;
  private categoryRepository?: CategoryRepository;

  private authService?: AuthService;
  private userPermissionService?: UserPermissionService;
  private yandexGptService?: YandexGPTService;
  private telegramPublishService?: TelegramPublishService;

  private postService?: PostService;
  private userService?: UserService;
  private channelService?: ChannelService;
  private publicationChannelService?: PublicationChannelService;
  private categoryService?: CategoryService;

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
    return new PublishPostUseCase(this.getPostRepository(), this.getTelegramPublishService());
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

  getGetPostUseCase(): GetPostUseCase {
    return new GetPostUseCase(this.getPostService());
  }

  getGetPostsUseCase(): GetPostsUseCase {
    return new GetPostsUseCase(this.getPostService());
  }

  getGetPostsWithQueryUseCase(): GetPostsWithQueryUseCase {
    return new GetPostsWithQueryUseCase(this.getPostService());
  }

  getGetPostsInfiniteScrollUseCase(): GetPostsInfiniteScrollUseCase {
    return new GetPostsInfiniteScrollUseCase(this.getPostService());
  }

  getGetPostsStatsUseCase(): GetPostsStatsUseCase {
    return new GetPostsStatsUseCase(this.getPostService());
  }

  getDeletePostUseCase(): DeletePostUseCase {
    return new DeletePostUseCase(this.getPostService());
  }

  getCreateUserUseCase(): CreateUserUseCase {
    return new CreateUserUseCase(this.getUserService());
  }

  getLoginUseCase(): LoginUseCase {
    return new LoginUseCase(this.getUserService());
  }

  // CRUD каналов и вспомогательные методы теперь идут через ChannelController -> ChannelService

  getCreatePublicationChannelUseCase(): CreatePublicationChannelUseCase {
    return new CreatePublicationChannelUseCase(this.getPublicationChannelService());
  }

  getGetPublicationChannelsUseCase(): GetPublicationChannelsUseCase {
    return new GetPublicationChannelsUseCase(this.getPublicationChannelService());
  }

  getGetActivePublicationChannelsUseCase(): GetActivePublicationChannelsUseCase {
    return new GetActivePublicationChannelsUseCase(this.getPublicationChannelService());
  }

  getUpdatePublicationChannelUseCase(): UpdatePublicationChannelUseCase {
    return new UpdatePublicationChannelUseCase(this.getPublicationChannelService());
  }

  getDeletePublicationChannelUseCase(): DeletePublicationChannelUseCase {
    return new DeletePublicationChannelUseCase(this.getPublicationChannelService());
  }

  getCreateManualPostUseCase(): CreateManualPostUseCase {
    return new CreateManualPostUseCase(this.getPostService());
  }

  // CRUD категорий теперь вызывается напрямую через CategoryService из контроллера

  getUniquizePostUseCase(): UniquizePostUseCase {
    return new UniquizePostUseCase(this.getPostService());
  }
} 