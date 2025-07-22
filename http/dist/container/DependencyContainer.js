"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyContainer = void 0;
const PostRepository_1 = require("../repositories/PostRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const ChannelRepository_1 = require("../repositories/ChannelRepository");
const PublicationChannelRepository_1 = require("../repositories/PublicationChannelRepository");
const CategoryRepository_1 = require("../repositories/CategoryRepository");
const PostService_1 = require("../services/PostService");
const UserService_1 = require("../services/UserService");
const ChannelService_1 = require("../services/ChannelService");
const PublicationChannelService_1 = require("../services/PublicationChannelService");
const CategoryService_1 = require("../services/CategoryService");
const AuthService_1 = require("../services/AuthService");
const YandexGPTService_1 = require("../services/YandexGPTService");
const GetPostUseCase_1 = require("../use-cases/GetPostUseCase");
const GetPostsUseCase_1 = require("../use-cases/GetPostsUseCase");
const GetPostsWithQueryUseCase_1 = require("../use-cases/GetPostsWithQueryUseCase");
const DeletePostUseCase_1 = require("../use-cases/DeletePostUseCase");
const UniquizePostUseCase_1 = require("../use-cases/UniquizePostUseCase");
const CreateUserUseCase_1 = require("../use-cases/CreateUserUseCase");
const LoginUseCase_1 = require("../use-cases/LoginUseCase");
const CreateChannelUseCase_1 = require("../use-cases/CreateChannelUseCase");
const UpdateChannelUseCase_1 = require("../use-cases/UpdateChannelUseCase");
const GetChannelsUseCase_1 = require("../use-cases/GetChannelsUseCase");
const GetChannelUseCase_1 = require("../use-cases/GetChannelUseCase");
const DeleteChannelUseCase_1 = require("../use-cases/DeleteChannelUseCase");
const GetChannelIdsForParserUseCase_1 = require("../use-cases/GetChannelIdsForParserUseCase");
const CreatePublicationChannelUseCase_1 = require("../use-cases/CreatePublicationChannelUseCase");
const GetPublicationChannelsUseCase_1 = require("../use-cases/GetPublicationChannelsUseCase");
const GetActivePublicationChannelsUseCase_1 = require("../use-cases/GetActivePublicationChannelsUseCase");
const UpdatePublicationChannelUseCase_1 = require("../use-cases/UpdatePublicationChannelUseCase");
const DeletePublicationChannelUseCase_1 = require("../use-cases/DeletePublicationChannelUseCase");
const TelegramPublishService_1 = require("../services/TelegramPublishService");
const PublishPostUseCase_1 = require("../use-cases/PublishPostUseCase");
const CreateManualPostUseCase_1 = require("../use-cases/CreateManualPostUseCase");
const CreateCategoryUseCase_1 = require("../use-cases/CreateCategoryUseCase");
const GetCategoriesUseCase_1 = require("../use-cases/GetCategoriesUseCase");
const GetCategoryUseCase_1 = require("../use-cases/GetCategoryUseCase");
const UpdateCategoryUseCase_1 = require("../use-cases/UpdateCategoryUseCase");
const DeleteCategoryUseCase_1 = require("../use-cases/DeleteCategoryUseCase");
class DependencyContainer {
    constructor() {
        this.mongo = null;
    }
    static getInstance() {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer();
        }
        return DependencyContainer.instance;
    }
    setMongo(mongo) {
        this.mongo = mongo;
    }
    getPostRepository() {
        if (!this.mongo)
            throw new Error('MongoDB not initialized');
        return new PostRepository_1.PostRepository(this.mongo);
    }
    getTelegramPublishService() {
        return new TelegramPublishService_1.TelegramPublishService();
    }
    getPublishPostUseCase() {
        return new PublishPostUseCase_1.PublishPostUseCase(this.getPostRepository(), this.getTelegramPublishService());
    }
    getUserRepository() {
        if (!this.mongo)
            throw new Error('MongoDB not initialized');
        return new UserRepository_1.UserRepository(this.mongo);
    }
    getChannelRepository() {
        if (!this.mongo)
            throw new Error('MongoDB not initialized');
        return new ChannelRepository_1.ChannelRepository(this.mongo);
    }
    getPublicationChannelRepository() {
        if (!this.mongo)
            throw new Error('MongoDB not initialized');
        return new PublicationChannelRepository_1.PublicationChannelRepository(this.mongo);
    }
    getCategoryRepository() {
        if (!this.mongo)
            throw new Error('MongoDB not initialized');
        return new CategoryRepository_1.CategoryRepository(this.mongo);
    }
    getAuthService() {
        const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';
        return new AuthService_1.AuthService(jwtSecret);
    }
    getYandexGPTService() {
        return new YandexGPTService_1.YandexGPTService();
    }
    getPostService() {
        return new PostService_1.PostService(this.getPostRepository(), this.getYandexGPTService());
    }
    getUserService() {
        return new UserService_1.UserService(this.getUserRepository(), this.getAuthService());
    }
    getChannelService() {
        return new ChannelService_1.ChannelService(this.getChannelRepository());
    }
    getPublicationChannelService() {
        return new PublicationChannelService_1.PublicationChannelService(this.getPublicationChannelRepository());
    }
    getCategoryService() {
        return new CategoryService_1.CategoryService(this.getCategoryRepository());
    }
    getGetPostUseCase() {
        return new GetPostUseCase_1.GetPostUseCase(this.getPostService());
    }
    getGetPostsUseCase() {
        return new GetPostsUseCase_1.GetPostsUseCase(this.getPostService());
    }
    getGetPostsWithQueryUseCase() {
        return new GetPostsWithQueryUseCase_1.GetPostsWithQueryUseCase(this.getPostService());
    }
    getDeletePostUseCase() {
        return new DeletePostUseCase_1.DeletePostUseCase(this.getPostService());
    }
    getCreateUserUseCase() {
        return new CreateUserUseCase_1.CreateUserUseCase(this.getUserService());
    }
    getLoginUseCase() {
        return new LoginUseCase_1.LoginUseCase(this.getUserService());
    }
    getCreateChannelUseCase() {
        return new CreateChannelUseCase_1.CreateChannelUseCase(this.getChannelService());
    }
    getUpdateChannelUseCase() {
        return new UpdateChannelUseCase_1.UpdateChannelUseCase(this.getChannelService());
    }
    getGetChannelsUseCase() {
        return new GetChannelsUseCase_1.GetChannelsUseCase(this.getChannelService());
    }
    getGetChannelUseCase() {
        return new GetChannelUseCase_1.GetChannelUseCase(this.getChannelService());
    }
    getDeleteChannelUseCase() {
        return new DeleteChannelUseCase_1.DeleteChannelUseCase(this.getChannelService());
    }
    getGetChannelIdsForParserUseCase() {
        return new GetChannelIdsForParserUseCase_1.GetChannelIdsForParserUseCase(this.getChannelService());
    }
    getCreatePublicationChannelUseCase() {
        return new CreatePublicationChannelUseCase_1.CreatePublicationChannelUseCase(this.getPublicationChannelService());
    }
    getGetPublicationChannelsUseCase() {
        return new GetPublicationChannelsUseCase_1.GetPublicationChannelsUseCase(this.getPublicationChannelService());
    }
    getGetActivePublicationChannelsUseCase() {
        return new GetActivePublicationChannelsUseCase_1.GetActivePublicationChannelsUseCase(this.getPublicationChannelService());
    }
    getUpdatePublicationChannelUseCase() {
        return new UpdatePublicationChannelUseCase_1.UpdatePublicationChannelUseCase(this.getPublicationChannelService());
    }
    getDeletePublicationChannelUseCase() {
        return new DeletePublicationChannelUseCase_1.DeletePublicationChannelUseCase(this.getPublicationChannelService());
    }
    getCreateManualPostUseCase() {
        return new CreateManualPostUseCase_1.CreateManualPostUseCase(this.getPostService());
    }
    // Category Use Cases
    getCreateCategoryUseCase() {
        return new CreateCategoryUseCase_1.CreateCategoryUseCase(this.getCategoryService());
    }
    getGetCategoriesUseCase() {
        return new GetCategoriesUseCase_1.GetCategoriesUseCase(this.getCategoryService());
    }
    getGetCategoryUseCase() {
        return new GetCategoryUseCase_1.GetCategoryUseCase(this.getCategoryService());
    }
    getUpdateCategoryUseCase() {
        return new UpdateCategoryUseCase_1.UpdateCategoryUseCase(this.getCategoryService());
    }
    getDeleteCategoryUseCase() {
        return new DeleteCategoryUseCase_1.DeleteCategoryUseCase(this.getCategoryService());
    }
    getUniquizePostUseCase() {
        return new UniquizePostUseCase_1.UniquizePostUseCase(this.getPostService());
    }
}
exports.DependencyContainer = DependencyContainer;
