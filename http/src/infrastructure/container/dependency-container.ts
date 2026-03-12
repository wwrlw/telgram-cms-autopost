import dotenv from 'dotenv';
dotenv.config();
import { FastifyMongoObject } from '@fastify/mongodb';
import { PostRepository } from '../../modules/post/repositories/post.repository';
import { UserRepository } from '../../modules/user/repositories/user.repository';
import { ChannelRepository } from '../../modules/channel/repositories/channel.repository';
import { PublicationChannelRepository } from '../../modules/publication-channel/repositories/publication-channel.repository';
import { CategoryRepository } from '../../modules/category/repositories/category.repository';
import { PostService } from '../../modules/post/post.service';
import { UserService } from '../../modules/user/user.service';
import { ChannelService } from '../../modules/channel/channel.service';
import { PublicationChannelService } from '../../modules/publication-channel/publication-channel.service';
import { CategoryService } from '../../modules/category/category.service';
import { AuthService } from '../../modules/auth/auth.service';
import { UserPermissionService } from '../../modules/user/user-permission.service';
import { CreateUserUseCase } from '../../modules/user/use-cases/create-user.use-case';
import { LoginUseCase } from '../../modules/auth/use-cases/login.use-case';
import { BotPublishService } from '../../modules/telegram/bot-publish.service';
import { MTProtoPublishService } from '../../modules/telegram/mtproto-publish.service';
import { ITelegramPublishService } from '../../modules/telegram/telegram-publish.service.interface';
import { PublishPostUseCase } from '../../modules/post/use-cases/publish-post.use-case';
import { PublishPostToChannelUseCase } from '../../modules/post/use-cases/publish-post-to-channel.use-case';
import { PostedChannelRepository } from '../../modules/publication-channel/repositories/posted-channel.repository';
import { PostedChannelService } from '../../modules/publication-channel/posted-channel.service';
import { DeletePostFromTelegramUseCase } from '../../modules/post/use-cases/delete-post-from-telegram.use-case'
import { TelegramConfigRepository } from '../../modules/telegram-config/repositories/telegram-config.repository';
import { TelegramConfigService } from '../../modules/telegram-config/telegram-config.service';
import { EncryptionService } from '../../modules/telegram-config/encryption.service';

export class DependencyContainer {
  private static instance: DependencyContainer;
  private mongo: FastifyMongoObject | null = null;
  // Кэш для синглтонов
  private postRepository?: PostRepository;
  private userRepository?: UserRepository;
  private channelRepository?: ChannelRepository;
  private publicationChannelRepository?: PublicationChannelRepository;
  private categoryRepository?: CategoryRepository;
  private postedChannelRepository?: PostedChannelRepository;

  private authService?: AuthService;
  private userPermissionService?: UserPermissionService;
  private telegramPublishService?: ITelegramPublishService;

  private postService?: PostService;
  private userService?: UserService;
  private channelService?: ChannelService;
  private publicationChannelService?: PublicationChannelService;
  private categoryService?: CategoryService;
  private postedChannelService?: PostedChannelService;
  private telegramConfigRepository?: TelegramConfigRepository;
  private telegramConfigService?: TelegramConfigService;

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

  getDeletePostFromTelegramUseCase(): DeletePostFromTelegramUseCase {
    return new DeletePostFromTelegramUseCase(
      this.getPostService(),
      this.getTelegramPublishService()
    );
  }

  getTelegramPublishService(): ITelegramPublishService {
    if (this.telegramPublishService) {
      return this.telegramPublishService;
    }
    if (process.env.USE_MTPROTO === 'true') {
      console.log('🔌 Инициализируем сервис публикации через MTProto...');
      this.telegramPublishService = new MTProtoPublishService();
    } else {
      console.log('🔌 Инициализируем сервис публикации через Bot API...');
      this.telegramPublishService = new BotPublishService();
    }

    return this.telegramPublishService;
  }
  
  getPublishPostUseCase(): PublishPostUseCase {
    return new PublishPostUseCase(
      this.getPostRepository(),
      this.getTelegramPublishService()
    );
  }

  getPublishPostToChannelUseCase(): PublishPostToChannelUseCase {
    return new PublishPostToChannelUseCase(
      this.getPostService(),
      this.getPostedChannelService(),
      this.getTelegramPublishService(),
      // this.getYandexGPTService()
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

  getPostService(): PostService {
    if (!this.postService) this.postService = new PostService(this.getPostRepository());
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

  getTelegramConfigRepository(): TelegramConfigRepository {
    if (!this.mongo) throw new Error('MongoDB not initialized');
    if (!this.telegramConfigRepository)
      this.telegramConfigRepository = new TelegramConfigRepository(this.mongo);
    return this.telegramConfigRepository;
  }

  getTelegramConfigService(): TelegramConfigService {
    if (!this.telegramConfigService) {
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) throw new Error('ENCRYPTION_KEY is not set in .env');
      const parserUrl = process.env.PARSER_INTERNAL_URL || 'http://parser:3002';
      this.telegramConfigService = new TelegramConfigService(
        this.getTelegramConfigRepository(),
        new EncryptionService(encryptionKey),
        parserUrl,
      );
    }
    return this.telegramConfigService;
  }
} 