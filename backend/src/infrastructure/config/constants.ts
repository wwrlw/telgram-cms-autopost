const config = {
    app: { domain: 'localhost', port: 8001, kind: 'developement' },
    jwt: { secret: '1q@w3e4r5t6y', expires: '24h' },
    db_system: {
      host: 'localhost',
      port: 6432,
      user: 'user_system',
      password: '1234',
      database: 'db_system',
    },
    db_tenant: {
      host: 'localhost',
      port: 6432,
      user: 'user_system',
      password: '1234',
      database: 'db_tenant',
    },
    mongo: {
      uri: process.env.MONGODB_URI || 'mongodb://admin:Xdas33JJdasnnjdA22KKsaaA@mongo:27019/?authSource=admin',
      database: process.env.MONGODB_DB || 'parse-news',
    },
    utils: { cloudinary: '' },
  }
  
  export default config