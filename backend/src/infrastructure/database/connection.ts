import { MongoClient, Db } from 'mongodb'
import config from '~/infrastructure/config/constants'

class DbConnection {
  private client: MongoClient
  private db: Db

  constructor() {
    const uri = config.mongo.uri
    const dbName = config.mongo.database

    this.client = new MongoClient(uri)

    this.client.connect()
      .then(() => {
        this.db = this.client.db(dbName)
        console.log('✅ Connected to MongoDB')
        console.log('База данных:', dbName)
      })
      .catch((err) => {
        console.error('❌ Ошибка подключения к MongoDB:', err)
      })
  }

  getDB(): Db {
    if (!this.db) {
      throw new Error('MongoDB ещё не подключена')
    }
    return this.db
  }

  async close(): Promise<void> {
    await this.client.close()
    console.log('🛑 Соединение с MongoDB закрыто')
  }
}

export default DbConnection
