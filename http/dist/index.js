"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongo_1 = __importDefault(require("./db/mongo"));
const auth_1 = __importDefault(require("./plugins/auth"));
const auth_2 = __importDefault(require("./routes/auth"));
const posts_1 = require("./routes/posts");
const channels_1 = require("./routes/channels");
const posted_channels_1 = require("./routes/posted-channels");
const categories_1 = require("./routes/categories");
const analytics_1 = require("./routes/analytics");
const publish_1 = __importDefault(require("./routes/publish"));
const logs_1 = __importDefault(require("./routes/logs"));
const cors_1 = __importDefault(require("@fastify/cors"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const DependencyContainer_1 = require("./container/DependencyContainer");
const ErrorHandler_1 = require("./middleware/ErrorHandler");
// @ts-ignore – нет типов для fastify v4
const multipart_1 = __importDefault(require("@fastify/multipart"));
dotenv_1.default.config();
const fastify = (0, fastify_1.default)({ logger: true });
async function start() {
    try {
        await fastify.register(cors_1.default, {
            origin: true,
            credentials: true,
        });
        await fastify.register(mongo_1.default);
        const container = DependencyContainer_1.DependencyContainer.getInstance();
        container.setMongo(fastify.mongo);
        await fastify.register(multipart_1.default, { limits: { files: 10 } });
        // Настройка раздачи статических файлов для медиа
        await fastify.register(static_1.default, {
            root: path_1.default.join(process.cwd(), 'media'),
            prefix: '/media/',
            decorateReply: false
        });
        await fastify.register(auth_1.default);
        await fastify.register(auth_2.default, { prefix: '/auth' });
        await fastify.register(posts_1.postsRoutes);
        await fastify.register(channels_1.channelsRoutes);
        await fastify.register(posted_channels_1.postedChannelsRoutes);
        await fastify.register(categories_1.categoriesRoutes);
        await fastify.register(analytics_1.analyticsRoutes);
        await fastify.register(publish_1.default);
        await fastify.register(logs_1.default, { prefix: '/logs' });
        fastify.setErrorHandler(ErrorHandler_1.errorHandler);
        await fastify.ready();
        await fastify.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
;
start();
