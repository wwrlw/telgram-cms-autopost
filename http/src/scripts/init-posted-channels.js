// const { MongoClient } = require('mongodb');

// const channels = [
//   {
//     name: "Тиски 18+",
//     channel_id: "-1002367458469",
//     channel_type: "private",
//     is_active: true
//   },
//   {
//     name: "Тиски.Tech",
//     channel_id: "-1002845084722",
//     channel_type: "public",
//     is_active: true
//   },
//   {
//     name: "Тиски.Play",
//     channel_id: "-1002734651611",
//     channel_type: "public",
//     is_active: true
//   },
//   {
//     name: "Тиски.Memes",
//     channel_id: "-1002797173239",
//     channel_type: "public",
//     is_active: true
//   },
//   {
//     name: "Тиски.Sport",
//     channel_id: "-1002745264870",
//     channel_type: "public",
//     is_active: true
//   },
//   {
//     name: "Тиски",
//     channel_id: "-1002862672736",
//     channel_type: "public",
//     is_active: true
//   }
// ];

// async function initPostedChannels() {
//   const mongoUrl = 'mongodb://admin:Xdas33JJdasnnjdA22KKsaaA@mongo:27017/?authSource=admin';
//   const client = new MongoClient(mongoUrl);
  
//   try {
//     await client.connect();
//     console.log('Connected to MongoDB');
    
//     const db = client.db('parse-news');
//     const collection = db.collection('posted_channels');
    
//     // Проверяем, есть ли уже каналы
//     const existingChannels = await collection.find({}).toArray();
//     console.log(`Found ${existingChannels.length} existing channels`);
    
//     if (existingChannels.length === 0) {
//       // Добавляем новые каналы только если их нет
//       const result = await collection.insertMany(channels);
//       console.log(`Inserted ${result.insertedCount} channels`);
//     } else {
//       console.log('Channels already exist, skipping insertion');
//     }
    
//     // Проверяем результат
//     const allChannels = await collection.find({}).toArray();
//     console.log('All posted channels:', allChannels);
    
//   } catch (error) {
//     console.error('Error initializing posted channels:', error);
//   } finally {
//     await client.close();
//   }
// }

// initPostedChannels(); 