import { ObjectId } from "mongodb";
import { FastifyMongoObject } from "@fastify/mongodb";
import { IPostRepository } from "../interfaces/repositories/IPostRepository";
import { Post, CreatePostDto } from "../models/Post";
import { PostQuery, PaginatedResponse, PostFilters, InfiniteScrollQuery, InfiniteScrollResponse } from "../types/PostQuery";

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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            'channel.category_id_obj': {
              $cond: {
                if: { $eq: [{ $type: '$channel.category_id' }, 'string'] },
                then: { $toObjectId: '$channel.category_id' },
                else: '$channel.category_id'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'channel.category_id_obj',
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
    console.log('🔍 findWithQueryAndCategories called with filters:', filters);
    
    const mongoSort = this.buildMongoSort(sort);
    const skip = (pagination.page - 1) * pagination.limit;

    const pipeline: any[] = [
      {
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
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
      }
    ];

    const matchStage = this.buildAggregationFilters(filters);
    
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }


    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await this.mongo.db.collection("posts").aggregate(countPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    if (total === 0 && pagination.page === 1) {
        return {
            data: [],
            params: {
                page: pagination.page,
                limit: pagination.limit,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
        };
    }

    pipeline.push(
      { $sort: mongoSort },
      { $skip: skip },
      { $limit: pagination.limit }
    );

    pipeline.push({
      $addFields: {
        category_id: '$category._id',
        category_name: '$category.name',
        category_color: '$category.color',
        channel_username: '$channel.username'
      }
    });

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
        const objectId = new ObjectId(filters.category_id);
        mongoFilters['category._id'] = objectId;
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
    console.log('PostRepository.deleteById called with ID:', id);
    
    if (!this.mongo.db) {
      console.error('PostRepository.deleteById: MongoDB is not connected');
      throw new Error("MongoDB is not connected");
    }

    if (!ObjectId.isValid(id)) {
      console.error('PostRepository.deleteById: Invalid post ID:', id);
      throw new Error("Invalid post ID");
    }

    console.log('PostRepository.deleteById: Executing deleteOne with ObjectId:', new ObjectId(id));
    const result = await this.mongo.db.collection("posts").deleteOne({
      _id: new ObjectId(id),
    });

    console.log('PostRepository.deleteById: Delete result:', result);
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
      .limit(50)
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
          $match: {
            'channel.category_id': new ObjectId(categoryId)
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $addFields: {
            'channel.category_id_obj': {
              $cond: {
                if: { $eq: [{ $type: '$channel.category_id' }, 'string'] },
                then: { $toObjectId: '$channel.category_id' },
                else: '$channel.category_id'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'channel.category_id_obj',
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
          $match: {
            source_channel: channel
          }
        },
        {
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
          $match: {
            'channel.category_id': new ObjectId(categoryId)
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $addFields: {
            'channel.category_id_obj': {
              $cond: {
                if: { $eq: [{ $type: '$channel.category_id' }, 'string'] },
                then: { $toObjectId: '$channel.category_id' },
                else: '$channel.category_id'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'channel.category_id_obj',
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

  async findWithInfiniteScroll(query: InfiniteScrollQuery): Promise<InfiniteScrollResponse<Post>> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    console.log('findWithInfiniteScroll called with query:', query);

    const { pagination, filters, sort } = query;
    const mongoSort = this.buildMongoSort(sort);
    
    const pipeline: any[] = [
      {
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
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
      }
    ];

    const matchStage = this.buildAggregationFilters(filters);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add cursor-based pagination
    if (pagination.lastId) {
      const lastObjectId = new ObjectId(pagination.lastId);
      console.log('Adding cursor filter with lastId:', pagination.lastId);
      pipeline.push({
        $match: {
          _id: { $lt: lastObjectId }
        }
      });
    }

    // Get total count for the first page
    let total = 0;
    if (pagination.page === 1) {
      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await this.mongo.db.collection("posts").aggregate(countPipeline).toArray();
      total = countResult.length > 0 ? countResult[0].total : 0;
    }

    pipeline.push(
      { $sort: mongoSort },
      { $limit: pagination.limit + 1 } // Fetch one extra to check if there are more
    );

    pipeline.push({
      $addFields: {
        category_id: '$category._id',
        category_name: '$category.name',
        category_color: '$category.color',
        channel_username: '$channel.username'
      }
    });

    const posts = await this.mongo.db.collection("posts").aggregate(pipeline).toArray();
    
    const hasMore = posts.length > pagination.limit;
    const data = hasMore ? posts.slice(0, -1) : posts;
    const lastId = data.length > 0 ? data[data.length - 1]._id.toString() : undefined;

    const result = {
      data: data as Post[],
      params: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.page === 1 ? total : undefined,
        hasMore,
        lastId
      },
    };

    console.log('findWithInfiniteScroll result:', result);
    return result;
  }

  async getPostsStats(): Promise<{ total: number; unique: number; today: number }> {
    if (!this.mongo.db) throw new Error("MongoDB is not connected");

    console.log('getPostsStats called');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('Date range for today:', { today, tomorrow });

    const pipeline = [
      {
        $facet: {
          total: [{ $count: "count" }],
          unique: [
            { $match: { is_unique: true } },
            { $count: "count" }
          ],
          today: [
            { 
              $match: { 
                created_at: { 
                  $gte: today, 
                  $lt: tomorrow 
                } 
              } 
            },
            { $count: "count" }
          ]
        }
      }
    ];

    console.log('MongoDB pipeline:', JSON.stringify(pipeline, null, 2));

    const result = await this.mongo.db.collection("posts").aggregate(pipeline).toArray();
    console.log('MongoDB aggregation result:', result);
    
    const stats = result[0];
    console.log('Extracted stats:', stats);

    const finalStats = {
      total: stats.total[0]?.count || 0,
      unique: stats.unique[0]?.count || 0,
      today: stats.today[0]?.count || 0
    };

    console.log('Final stats:', finalStats);
    return finalStats;
  }
}