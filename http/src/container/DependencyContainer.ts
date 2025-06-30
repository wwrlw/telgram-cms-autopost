import { FastifyMongoObject } from '@fastify/mongodb';
import { PostRepository } from '../repositories/PostRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ChannelRepository } from '../repositories/ChannelRepository';
import { PublicationChannelRepository } from '../repositories/PublicationChannelRepository';
import { PostService } from '../services/PostService';
import { UserService } from '../services/UserService';
import { ChannelService } from '../services/ChannelService';
import { PublicationChannelService } from '../services/PublicationChannelService';
import { AuthService } from '../services/AuthService';
import { GetPostUseCase } from '../use-cases/GetPostUseCase';
import { GetPostsUseCase } from '../use-cases/GetPostsUseCase';
import { GetPostsWithQueryUseCase } from '../use-cases/GetPostsWithQueryUseCase';
import { DeletePostUseCase } from '../use-cases/DeletePostUseCase';
import { CreateUserUseCase } from '../use-cases/CreateUserUseCase';
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { CreateChannelUseCase } from '../use-cases/CreateChannelUseCase';
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

  getAuthService(): AuthService {
    const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';
    return new AuthService(jwtSecret);
  }

  getPostService(): PostService {
    return new PostService(this.getPostRepository());
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

  getGetPostUseCase(): GetPostUseCase {
    return new GetPostUseCase(this.getPostService());
  }

  getGetPostsUseCase(): GetPostsUseCase {
    return new GetPostsUseCase(this.getPostService());
  }

  getGetPostsWithQueryUseCase(): GetPostsWithQueryUseCase {
    return new GetPostsWithQueryUseCase(this.getPostService());
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
} 