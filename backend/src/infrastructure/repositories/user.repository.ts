import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { UserInterface } from '~/domain/interface/users.interface';

class UserRepository {
  private collection: Collection<UserInterface>;

  constructor(private db: Db) {
    this.collection = db.collection<UserInterface>('users');
  }

  async save(userData: UserInterface): Promise<UserInterface> {
    const insertData = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(insertData);
    
    return {
      ...userData,
      _id: result.insertedId,
      createdAt: insertData.createdAt,
      updatedAt: insertData.updatedAt
    };
  }

  async findOne(email: string): Promise<UserInterface | null> {
    return this.collection.findOne<UserInterface>({ email });
  }

  async findById(_id: string): Promise<UserInterface | null> {
    try {
      return this.collection.findOne<UserInterface>({ 
        _id: new ObjectId(_id) 
      });
    } catch (err) {
      console.error('Invalid ObjectId format:', err);
      return null;
    }
  }
}

export default UserRepository;