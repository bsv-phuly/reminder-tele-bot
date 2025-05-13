import mongoose from 'mongoose';
import { Chat, IChat } from '../models/chats';
import { IUser, User } from '../models/user';
import { IOrder, Order } from '../models/orders';
import { config } from '../config';

export class Database {
    constructor(private uri: string = config.mongodb.uri, private dbName: string = config.mongodb.dbName) {
        mongoose.set('strictQuery', false);
    }

    async connect(): Promise<void> {
        try {
            await mongoose.connect(this.uri, { dbName: this.dbName});
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    async close(): Promise<void> {
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
}