"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const mongodb_1 = require("mongodb");
class PostRepository {
    constructor(mongo) {
        this.mongo = mongo;
    }
    async findById(id) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error("Invalid post ID");
        }
        const post = await this.mongo.db.collection("posts").findOne({
            _id: new mongodb_1.ObjectId(id),
        });
        return post;
    }
    async findAll() {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        const posts = await this.mongo.db
            .collection("posts")
            .find()
            .sort({ created_at: -1 })
            .toArray();
        return posts;
    }
    async findWithQuery(query) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        const { pagination, filters, sort } = query;
        const mongoFilters = this.buildMongoFilters(filters);
        const mongoSort = this.buildMongoSort(sort);
        const skip = (pagination.page - 1) * pagination.limit;
        const [posts, total] = await Promise.all([
            this.mongo.db
                .collection("posts")
                .find(mongoFilters)
                .sort(mongoSort)
                .skip(skip)
                .limit(pagination.limit)
                .toArray(),
            this.count(mongoFilters),
        ]);
        const totalPages = Math.ceil(total / pagination.limit);
        return {
            data: posts,
            params: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages,
                hasNext: pagination.page < totalPages,
                hasPrev: pagination.page > 1,
            },
        };
    }
    async count(filters = {}) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        return await this.mongo.db.collection("posts").countDocuments(filters);
    }
    buildMongoFilters(filters) {
        if (!filters)
            return {};
        const mongoFilters = {};
        if (filters.source_channel) {
            mongoFilters.source_channel = {
                $regex: filters.source_channel,
                $options: "i",
            };
        }
        if (filters.text) {
            mongoFilters.text = {
                $regex: filters.text,
                $options: "i",
            };
        }
        if (filters.is_unique !== undefined) {
            mongoFilters.is_unique = filters.is_unique;
        }
        if (filters.category_id) {
            if (mongodb_1.ObjectId.isValid(filters.category_id)) {
                mongoFilters.category_id = new mongodb_1.ObjectId(filters.category_id);
            }
        }
        if (filters.date_from || filters.date_to) {
            mongoFilters.created_at = {};
            if (filters.date_from) {
                mongoFilters.created_at.$gte = filters.date_from;
            }
            if (filters.date_to) {
                mongoFilters.created_at.$lte = filters.date_to;
            }
        }
        return mongoFilters;
    }
    buildMongoSort(sort) {
        if (!sort) {
            return { created_at: -1 };
        }
        const sortOrder = sort.order === "asc" ? 1 : -1;
        return { [sort.field]: sortOrder };
    }
    async create(post) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        const newPost = {
            ...post,
            timestamp: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
            is_unique: post.is_unique ?? false,
            media: post.media ?? [],
            ...(post.unique_text && { unique_text: post.unique_text }),
        };
        const result = await this.mongo.db.collection("posts").insertOne(newPost);
        return { ...newPost, _id: result.insertedId };
    }
    async findByChannel(channel) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        const posts = await this.mongo.db
            .collection("posts")
            .find({ source_channel: channel })
            .sort({ created_at: -1 })
            .toArray();
        return posts;
    }
    async deleteById(id) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error("Invalid post ID");
        }
        const result = await this.mongo.db.collection("posts").deleteOne({
            _id: new mongodb_1.ObjectId(id),
        });
        return result.deletedCount > 0;
    }
    async update(id, data) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error("Invalid post ID");
        }
        const updateData = {
            ...data,
            updated_at: new Date(),
        };
        const updateResult = await this.mongo.db
            .collection("posts")
            .updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: updateData });
        const updatedPost = await this.mongo.db.collection("posts").findOne({
            _id: new mongodb_1.ObjectId(id),
        });
        return updatedPost;
    }
    async findScheduled() {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        const posts = await this.mongo.db
            .collection("posts")
            .find({
            scheduled_at: { $exists: true, $ne: null },
            is_published: { $ne: true },
        })
            .sort({ scheduled_at: 1 })
            .toArray();
        return posts;
    }
    async findPublished() {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        const posts = await this.mongo.db
            .collection("posts")
            .find({
            is_published: true,
            published_at: { $exists: true, $ne: null },
        })
            .sort({ published_at: -1 })
            .limit(50) // Ограничиваем последними 50 опубликованными постами
            .toArray();
        return posts;
    }
    async findByCategory(categoryId) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        if (!mongodb_1.ObjectId.isValid(categoryId)) {
            throw new Error("Invalid category ID");
        }
        const posts = await this.mongo.db
            .collection("posts")
            .find({ category_id: new mongodb_1.ObjectId(categoryId) })
            .sort({ created_at: -1 })
            .toArray();
        return posts;
    }
    async findByCategoryAndChannel(categoryId, channel) {
        if (!this.mongo.db)
            throw new Error("MongoDB is not connected");
        if (!mongodb_1.ObjectId.isValid(categoryId)) {
            throw new Error("Invalid category ID");
        }
        const posts = await this.mongo.db
            .collection("posts")
            .find({
            category_id: new mongodb_1.ObjectId(categoryId),
            source_channel: channel
        })
            .sort({ created_at: -1 })
            .toArray();
        return posts;
    }
}
exports.PostRepository = PostRepository;
