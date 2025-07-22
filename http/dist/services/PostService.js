"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const mongodb_1 = require("mongodb");
const NotFoundError_1 = require("../exceptions/NotFoundError");
class PostService {
    constructor(postRepository, yandexGPTService) {
        this.postRepository = postRepository;
        this.yandexGPTService = yandexGPTService;
    }
    async getPost(id) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        return post;
    }
    async getPosts() {
        return await this.postRepository.findAll();
    }
    async getPostsWithQuery(query) {
        return await this.postRepository.findWithQuery(query);
    }
    async createPost(postData) {
        return await this.postRepository.create(postData);
    }
    async getPostsByChannel(channel) {
        return await this.postRepository.findByChannel(channel);
    }
    async deletePost(id) {
        const deleted = await this.postRepository.deleteById(id);
        if (!deleted) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
    }
    async schedulePost(id, scheduledAt, channelId) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        await this.postRepository.update(id, {
            scheduled_at: scheduledAt,
            scheduled_channel_id: channelId
        });
        return {
            ...post,
            scheduled_at: scheduledAt,
            scheduled_channel_id: channelId,
            updated_at: new Date()
        };
    }
    async getScheduledPosts() {
        return await this.postRepository.findScheduled();
    }
    async cancelScheduledPost(id) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        const updatedPost = await this.postRepository.update(id, {
            scheduled_at: undefined,
            scheduled_channel_id: undefined
        });
        if (!updatedPost) {
            throw new NotFoundError_1.NotFoundError('Failed to cancel scheduled post');
        }
        return updatedPost;
    }
    async markAsPublished(id, channelName) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        const updatedPost = await this.postRepository.update(id, {
            is_published: true,
            published_at: new Date(),
            scheduled_at: undefined,
            scheduled_channel_id: undefined,
            updated_at: new Date()
        });
        if (!updatedPost) {
            throw new NotFoundError_1.NotFoundError('Failed to mark post as published');
        }
        return updatedPost;
    }
    async markAsPublishedWithTelegramId(id, channelId, telegramMessageId) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        const updatedPost = await this.postRepository.update(id, {
            is_published: true,
            published_at: new Date(),
            published_channel_id: channelId,
            telegram_message_id: telegramMessageId,
            scheduled_at: undefined,
            scheduled_channel_id: undefined,
            updated_at: new Date()
        });
        if (!updatedPost) {
            throw new NotFoundError_1.NotFoundError('Failed to mark post as published');
        }
        return updatedPost;
    }
    async unmarkAsPublished(id) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        const updatedPost = await this.postRepository.update(id, {
            is_published: false,
            published_at: undefined,
            published_channel_id: undefined,
            telegram_message_id: undefined,
            updated_at: new Date()
        });
        if (!updatedPost) {
            throw new NotFoundError_1.NotFoundError('Failed to unmark post as published');
        }
        return updatedPost;
    }
    async getPublishedPosts() {
        return await this.postRepository.findPublished();
    }
    async updatePost(id, updateData) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        const allowedFields = ['text', 'url', 'source_channel', 'is_unique'];
        const filteredUpdateData = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredUpdateData[field] = updateData[field];
            }
        }
        const updatedPost = await this.postRepository.update(id, {
            ...filteredUpdateData,
            updated_at: new Date()
        });
        if (!updatedPost) {
            throw new NotFoundError_1.NotFoundError('Failed to update post');
        }
        return updatedPost;
    }
    async getPostsByCategory(categoryId) {
        return await this.postRepository.findByCategory(categoryId);
    }
    async getPostsByCategoryAndChannel(categoryId, channel) {
        return await this.postRepository.findByCategoryAndChannel(categoryId, channel);
    }
    async updatePostCategory(id, categoryId) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        const updatedPost = await this.postRepository.update(id, {
            category_id: new mongodb_1.ObjectId(categoryId),
            updated_at: new Date()
        });
        if (!updatedPost) {
            throw new NotFoundError_1.NotFoundError('Failed to update post category');
        }
        return updatedPost;
    }
    async uniquizePost(id) {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        if (!post.text || post.text.trim() === '') {
            throw new NotFoundError_1.NotFoundError('Post has no text to uniquize');
        }
        const uniquizedText = await this.yandexGPTService.uniquizeText(post.text);
        const updatedPost = await this.postRepository.update(id, {
            unique_text: uniquizedText,
            is_unique: true,
            updated_at: new Date()
        });
        if (!updatedPost) {
            throw new NotFoundError_1.NotFoundError('Failed to update post with uniquized text');
        }
        return updatedPost;
    }
}
exports.PostService = PostService;
