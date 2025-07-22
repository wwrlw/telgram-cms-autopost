"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishPostToChannelUseCase = void 0;
class PublishPostToChannelUseCase {
    constructor(postService, postedChannelService, telegramPublishService) {
        this.postService = postService;
        this.postedChannelService = postedChannelService;
        this.telegramPublishService = telegramPublishService;
    }
    async execute(postId, channelId) {
        try {
            // Получаем пост
            const post = await this.postService.getPost(postId);
            if (!post) {
                return { success: false, message: 'Пост не найден' };
            }
            const channel = await this.postedChannelService.getPostedChannelByChannelId(channelId);
            if (!channel) {
                return { success: false, message: 'Канал не найден' };
            }
            const publishResult = await this.telegramPublishService.publishPost(post, channel);
            if (publishResult.success) {
                // Отмечаем пост как опубликованный с сохранением telegram_message_id
                if (publishResult.messageId) {
                    await this.postService.markAsPublishedWithTelegramId(postId, channelId, publishResult.messageId);
                }
                else {
                    await this.postService.markAsPublished(postId, channel.name);
                }
                return {
                    success: true,
                    message: `Пост успешно опубликован в канал "${channel.name}"`
                };
            }
            else {
                return {
                    success: false,
                    message: `Ошибка публикации: ${publishResult.message}`
                };
            }
        }
        catch (error) {
            console.error('Ошибка при публикации поста:', error);
            return {
                success: false,
                message: 'Внутренняя ошибка сервера'
            };
        }
    }
}
exports.PublishPostToChannelUseCase = PublishPostToChannelUseCase;
