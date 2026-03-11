import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

async function seed() {
  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGO_DB_NAME || 'parse-news';

  const client = new MongoClient(uri);
  await client.connect();
  console.log('✅ Connected to MongoDB');

  const db = client.db(dbName);
  const users = db.collection('users');

  const username = process.env.SEED_USERNAME || 'admin';
  const password = process.env.SEED_PASSWORD || 'admin123';

  const existing = await users.findOne({ username });
  if (existing) {
    console.log(`⚠️  User "${username}" already exists, skipping`);
    await client.close();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await users.insertOne({
    username,
    password: hashedPassword,
    role: 'super_admin',
    favorite_posts: [],
    created_at: new Date(),
  });

  console.log(`✅ Created super_admin user: ${username} / ${password}`);
  await client.close();
}

seed().catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); });
