import { ObjectId } from "mongodb";
import { FastifyMongoObject } from "@fastify/mongodb";
import { IPostRepository } from "../interfaces/repositories/IPostRepository";
import { Post, CreatePostDto } from "../models/Post";
import { PostQuery, PaginatedResponse, PostFilters } from "../types/PostQuery";

export class PostRepository implements IPostRepository {
  constructor(private mongo: FastifyMongoObject) {}

  async findById(id: string): Promise<Post | null> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid post ID");
    }

    const post = await this.mongo.db.collection("posts").findOne({
      _id: new ObjectId(id),
    });

    return post as Post | null;
  }

  async findAll(): Promise<Post[]> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    const posts = await this.mongo.db
      .collection("posts")
      .find()
      .sort({ created_at: -1 })
      .toArray();

    return posts as Post[];
  }

  async findAllWithCategories(): Promise<Post[]> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    const posts = await this.mongo.db
      .collection("posts")
      .aggregate([
        {
          $sort: { created_at: -1 }
        },
        {
          // Присоединяем канал по channel_id
          $lookup: {
            from: 'channels',
            localField: 'channel_id',
            foreignField: 'channel_id',
            as: 'channel'
          }
        },
        {
          // Разворачиваем массив channel (должен быть один элемент)
          $unwind: {
            path: '$channel',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          // Присоединяем категорию по category_id из канала
          $lookup: {
            from: 'categories',
            localField: 'channel.category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          // Разворачиваем массив category (должен быть один элемент)
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          // Добавляем удобные поля
          $addFields: {
            category_id: '$category._id',
            category_name: '$category.name',
            category_color: '$category.color',
            channel_username: '$channel.username'
          }
        }
      ])
      .toArray();

    return posts as Post[];
  }

  async findWithQuery(query: PostQuery): Promise<PaginatedResponse<Post>> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

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
      data: posts as Post[],
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

  async findWithQueryAndCategories(query: PostQuery): Promise<PaginatedResponse<Post>> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    const { pagination, filters, sort } = query;
    const mongoSort = this.buildMongoSort(sort);
    const skip = (pagination.page - 1) * pagination.limit;

    // Строим базовый пайплайн агрегации
    const pipeline: any[] = [
      {
        // Присоединяем канал по channel_id
        $lookup: {
          from: 'channels',
          localField: 'channel_id',
          foreignField: 'channel_id',
          as: 'channel'
        }
      },
      {
        // Разворачиваем массив channel (должен быть один элемент)
        $unwind: {
          path: '$channel',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        // Присоединяем категорию по category_id из канала
        $lookup: {
          from: 'categories',
          localField: 'channel.category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        // Разворачиваем массив category (должен быть один элемент)
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Добавляем фильтры
    const matchStage = this.buildAggregationFilters(filters);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Добавляем удобные поля
    pipeline.push({
      $addFields: {
        category_id: '$category._id',
        category_name: '$category.name',
        category_color: '$category.color',
        channel_username: '$channel.username'
      }
    });

    // Подсчитываем общее количество
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await this.mongo.db.collection("posts").aggregate(countPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Добавляем сортировку, пропуск и лимит
    pipeline.push(
      { $sort: mongoSort },
      { $skip: skip },
      { $limit: pagination.limit }
    );

    const posts = await this.mongo.db.collection("posts").aggregate(pipeline).toArray();
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: posts as Post[],
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

  private buildAggregationFilters(filters?: PostFilters): any {
    if (!filters) return {};

    const mongoFilters: any = {};

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
      if (ObjectId.isValid(filters.category_id)) {
        // Фильтруем по category_id из связанной категории
        mongoFilters['category._id'] = new ObjectId(filters.category_id);
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

  async count(filters: any = {}): Promise<number> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    return await this.mongo.db.collection("posts").countDocuments(filters);
  }

  private buildMongoFilters(filters?: PostFilters): any {
    if (!filters) return {};

    const mongoFilters: any = {};

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
      if (ObjectId.isValid(filters.category_id)) {
        mongoFilters.category_id = new ObjectId(filters.category_id);
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

  private buildMongoSort(sort?: any): any {
    if (!sort) {
      return { created_at: -1 };
    }

    const sortOrder = sort.order === "asc" ? 1 : -1;
    return { [sort.field]: sortOrder };
  }

  async create(post: CreatePostDto): Promise<Post> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    const newPost: Post = {
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

  async findByChannel(channel: string): Promise<Post[]> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    const posts = await this.mongo.db
      .collection("posts")
      .find({ source_channel: channel })
      .sort({ created_at: -1 })
      .toArray();

    return posts as Post[];
  }

  async deleteById(id: string): Promise<boolean> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid post ID");
    }

    const result = await this.mongo.db.collection("posts").deleteOne({
      _id: new ObjectId(id),
    });

    return result.deletedCount > 0;
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid post ID");
    }

    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    const updateResult = await this.mongo.db
      .collection("posts")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updatedPost = await this.mongo.db.collection("posts").findOne({
      _id: new ObjectId(id),
    });

    return updatedPost as Post | null;
  }

  async findScheduled(): Promise<Post[]> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    const posts = await this.mongo.db
      .collection("posts")
      .find({
        scheduled_at: { $exists: true, $ne: null },
        is_published: { $ne: true },
      })
      .sort({ scheduled_at: 1 })
      .toArray();

    return posts as Post[];
  }

  async findPublished(): Promise<Post[]> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    const posts = await this.mongo.db
      .collection("posts")
      .find({
        is_published: true,
        published_at: { $exists: true, $ne: null },
      })
      .sort({ published_at: -1 })
      .limit(50) // Ограничиваем последними 50 опубликованными постами
      .toArray();

    return posts as Post[];
  }

  async findByCategory(categoryId: string): Promise<Post[]> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    if (!ObjectId.isValid(categoryId)) {
      throw new Error("Invalid category ID");
    }

    const posts = await this.mongo.db
      .collection("posts")
      .aggregate([
        {
          // Присоединяем канал по channel_id
          $lookup: {
            from: 'channels',
            localField: 'channel_id',
            foreignField: 'channel_id',
            as: 'channel'
          }
        },
        {
          $unwind: {
            path: '$channel',
            preserveNullAndEmptyArrays: false // Исключаем посты без каналов
          }
        },
        {
          // Фильтруем по категории
          $match: {
            'channel.category_id': new ObjectId(categoryId)
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          // Присоединяем категорию для получения названия
          $lookup: {
            from: 'categories',
            localField: 'channel.category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            category_id: '$category._id',
            category_name: '$category.name',
            category_color: '$category.color',
            channel_username: '$channel.username'
          }
        }
      ])
      .toArray();

    return posts as Post[];
  }

  async findByCategoryAndChannel(categoryId: string, channel: string): Promise<Post[]> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    if (!ObjectId.isValid(categoryId)) {
      throw new Error("Invalid category ID");
    }

    const posts = await this.mongo.db
      .collection("posts")
      .aggregate([
        {
          // Сначала фильтруем по каналу
          $match: {
            source_channel: channel
          }
        },
        {
          // Присоединяем канал по channel_id
          $lookup: {
            from: 'channels',
            localField: 'channel_id',
            foreignField: 'channel_id',
            as: 'channel'
          }
        },
        {
          $unwind: {
            path: '$channel',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          // Фильтруем по категории
          $match: {
            'channel.category_id': new ObjectId(categoryId)
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          // Присоединяем категорию для получения названия
          $lookup: {
            from: 'categories',
            localField: 'channel.category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            category_id: '$category._id',
            category_name: '$category.name',
            category_color: '$category.color',
            channel_username: '$channel.username'
          }
        }
      ])
      .toArray();

    return posts as Post[];
  }
}
