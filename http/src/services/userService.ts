import { FastifyMongoObject } from "@fastify/mongodb";
import bcrypt from "bcrypt";

interface User {
    _id?: string;
    username: string;
    password: string;
}

export async function createUser(mongo: FastifyMongoObject, username: string, password: string) {
    if (!mongo.db) throw new Error('MongoDB не подключен');
    const hash = await bcrypt.hash(password, 10);
    const user = { username, password: hash };
    const result = await mongo.db.collection('users').insertOne(user);
    return { ...user, _id: result.insertedId };
}

export async function findUserByUsername(mongo: FastifyMongoObject, username: string) {
    if (!mongo.db) throw new Error('MongoDB не подключен');
    return await mongo.db.collection('users').findOne({ username });
}

export async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}