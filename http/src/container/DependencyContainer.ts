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
import { CreateChannelUseCase } from '../use-cases/CreateChannelUseCase';
import { UpdateChannelUseCase } from '../use-cases/UpdateChannelUseCase';
import { GetChannelsUseCase } from '../use-cases/GetChannelsUseCase';
import { GetChannelUseCase } from '../use-cases/GetChannelUseCase';
import { DeleteChannelUseCase } from '../use-cases/DeleteChannelUseCase';
import { GetChannelIdsForParserUseCase } from '../use-cases/GetChannelIdsForParserUseCase';
import { CreatePublicationChannelUseCase } from '../use-cases/CreatePublicationChannelUseCase';
import { GetPublicationChannelsUseCase } from '../use-cases/GetPublicationChannelsUseCase';
import { GetActivePublicationChannelsUseCase } from '../use-cases/GetActivePublicationChannelsUseCase';
import { UpdatePublicationChannelUseCase } from '../use-cases/UpdatePublicationChannelUseCase';
import { DeletePublicationChannelUseCase } from '../use-cases/DeletePublicationChannelUseCase';
import { TelegramPublishService } from '../services/TelegramPublishService';
import { PublishPostUseCase } from '../use-cases/PublishPostUseCase';
import { CreateManualPostUseCase } from '../use-cases/CreateManualPostUseCase';
import { CreateCategoryUseCase } from '../use-cases/CreateCategoryUseCase';
import { GetCategoriesUseCase } from '../use-cases/GetCategoriesUseCase';
import { GetCategoryUseCase } from '../use-cases/GetCategoryUseCase';
import { UpdateCategoryUseCase } from '../use-cases/UpdateCategoryUseCase';
import { DeleteCategoryUseCase } from '../use-cases/DeleteCategoryUseCase';


export class DependencyContainer {
  private static instance: DependencyContainer;
  private mongo: FastifyMongoObject | null = null;

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
    return new PostRepository(this.mongo);
  }
  getTelegramPublishService(): TelegramPublishService {
    return new TelegramPublishService();
  }
  
  getPublishPostUseCase(): PublishPostUseCase {
    return new PublishPostUseCase(this.getPostRepository(), this.getTelegramPublishService());
  }

  getUserRepository(): UserRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    return new UserRepository(this.mongo);
  }

  getChannelRepository(): ChannelRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    return new ChannelRepository(this.mongo);
  }

  getPublicationChannelRepository(): PublicationChannelRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    return new PublicationChannelRepository(this.mongo);
  }

  getCategoryRepository(): CategoryRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    return new CategoryRepository(this.mongo);
  }

  getAuthService(): AuthService {
    const jwtSecret = process.env.JWT_SECRET || '';
    return new AuthService(jwtSecret);
  }

  getUserPermissionService(): UserPermissionService {
    return new UserPermissionService(this.getUserRepository());
  }

  getYandexGPTService(): YandexGPTService {
    return new YandexGPTService();
  }

  getPostService(): PostService {
    return new PostService(this.getPostRepository(), this.getYandexGPTService());
  }

  getUserService(): UserService {
    return new UserService(this.getUserRepository(), this.getAuthService());
  }

  getChannelService(): ChannelService {
    return new ChannelService(this.getChannelRepository());
  }

  getPublicationChannelService(): PublicationChannelService {
    return new PublicationChannelService(this.getPublicationChannelRepository());
  }

  getCategoryService(): CategoryService {
    return new CategoryService(this.getCategoryRepository());
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

  getCreateChannelUseCase(): CreateChannelUseCase {
    return new CreateChannelUseCase(this.getChannelService());
  }

  getUpdateChannelUseCase(): UpdateChannelUseCase {
    return new UpdateChannelUseCase(this.getChannelService());
  }

  getGetChannelsUseCase(): GetChannelsUseCase {
    return new GetChannelsUseCase(this.getChannelService());
  }

  getGetChannelUseCase(): GetChannelUseCase {
    return new GetChannelUseCase(this.getChannelService());
  }

  getDeleteChannelUseCase(): DeleteChannelUseCase {
    return new DeleteChannelUseCase(this.getChannelService());
  }

  getGetChannelIdsForParserUseCase(): GetChannelIdsForParserUseCase {
    return new GetChannelIdsForParserUseCase(this.getChannelService());
  }

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

  // Category Use Cases
  getCreateCategoryUseCase(): CreateCategoryUseCase {
    return new CreateCategoryUseCase(this.getCategoryService());
  }

  getGetCategoriesUseCase(): GetCategoriesUseCase {
    return new GetCategoriesUseCase(this.getCategoryService());
  }

  getGetCategoryUseCase(): GetCategoryUseCase {
    return new GetCategoryUseCase(this.getCategoryService());
  }

  getUpdateCategoryUseCase(): UpdateCategoryUseCase {
    return new UpdateCategoryUseCase(this.getCategoryService());
  }

  getDeleteCategoryUseCase(): DeleteCategoryUseCase {
    return new DeleteCategoryUseCase(this.getCategoryService());
  }

  getUniquizePostUseCase(): UniquizePostUseCase {
    return new UniquizePostUseCase(this.getPostService());
  }
} 