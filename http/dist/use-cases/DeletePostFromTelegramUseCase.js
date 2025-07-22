"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletePostFromTelegramUseCase = void 0;
const NotFoundError_1 = require("../exceptions/NotFoundError");
class DeletePostFromTelegramUseCase {
    constructor(postService, telegramPublishService) {
        this.postService = postService;
        this.telegramPublishService = telegramPublishService;
    }
    async execute(postId) {
        try {
            // Получаем пост
            const post = await this.postService.getPost(postId);
            if (!post.is_published) {
                return { success: false, message: 'Пост не был опубликован в Telegram' };
            }
            if (!post.telegram_message_id) {
                return { success: false, message: 'ID сообщения Telegram не найден' };
            }
            if (!post.published_channel_id) {
                return { success: false, message: 'ID канала публикации не найден' };
            }
            // Удаляем сообщение из Telegram
            const deleteResult = await this.telegramPublishService.deletePost(post.telegram_message_id, post.published_channel_id);
            if (!deleteResult.success) {
                return deleteResult;
            }
            // Обновляем статус поста в базе данных
            await this.postService.unmarkAsPublished(postId);
            return {
                success: true,
                message: 'Пост успешно удален из Telegram'
            };
        }
        catch (error) {
            console.error('Ошибка при удалении поста из Telegram:', error);
            if (error instanceof NotFoundError_1.NotFoundError) {
                return { success: false, message: 'Пост не найден' };
            }
            return {
                success: false,
                message: 'Внутренняя ошибка сервера при удалении поста'
            };
        }
    }
}
exports.DeletePostFromTelegramUseCase = DeletePostFromTelegramUseCase;
