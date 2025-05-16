import { Chat, IChat } from "../models/chats";
import { IOrder, Order } from "../models/orders";
import { IProducts, Products } from "../models/products";
import { IUser, User } from "../models/user";
import { expandAbbreviations, normalizeText } from "../utils/commonFunction";
import { logger } from "../utils/logger";

export class UserRepository {
    async findByTelegramId(telegramId: number): Promise<IUser | null> {
        return User.findOne({ telegramId }).lean();
    }

    async saveUser(user: IUser): Promise<IUser> {
        return User.findOneAndUpdate(
            { telegramId: user.telegramId },
            user,
            { upsert: true, new: true }
        ).lean();
    }

    async getUsersWithOrdersInDateRange(startDate: Date, endDate: Date): Promise<IUser[]> {
        const userIds = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).distinct('userId');

        return User.find({ telegramId: { $in: userIds } }).lean();
    }
}

export class OrderRepository {
    async createOrUpdate(order: IOrder): Promise<IOrder> {
        const newOrder = new Order(order);
        await newOrder.save();
        return newOrder;
    }

    async getOrder(chatId: number): Promise<IOrder | null> {
        return Order.findOne({ chatId }).lean();
    }

    async getOrdersInDateRange(startDate: Date, endDate: Date): Promise<IOrder[]> {
        return Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
    }

    async getOrdersForDay(date: Date = new Date()): Promise<IOrder[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.getOrdersInDateRange(startOfDay, endOfDay);
    }

    async getUsersWithOrdersToday(): Promise<IUser[]> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).distinct('userId');

        return User.find({ telegramId: { $in: orders } }).lean();
    }
}

export class ChatRepository {
    async findByChatId(chatId: number): Promise<IChat | null> {
        return Chat.findOne({ chatId }).lean();
    }

    async saveChat(chat: IChat): Promise<IChat> {
        return Chat.findOneAndUpdate(
            { chatId: chat.chatId },
            chat,
            { upsert: true, new: true }
        ).lean();
    }

    async createChat(chat: IChat): Promise<IChat> {
        const newChat = new Chat(chat);
        await newChat.save();
        return newChat;
    }

    async getActiveGroupChats(sendSummaries: boolean = true): Promise<IChat[]> {
        return Chat.find({
            type: { $in: ['group', 'supergroup'] },
            isActive: true,
            sendSummaries
        }).lean();
    }

    async updateSummarySetting(chatId: number, sendSummaries: boolean): Promise<void> {
        await Chat.findOneAndUpdate(
            { chatId },
            { $set: { sendSummaries } }
        );
    }
}

export class ProductRepository {
    async createProducts(products: IProducts[]): Promise<any> {
        try {
            console.log(products, 'create products');
            Products.insertMany(products);
        } catch (error) {
            logger.error("Failed to create products", error);
        }
    }

    async searchProducts(input: any): Promise<any> {
        const expandedInput = expandAbbreviations(input);
        const searchResults = await Products.collection.find({
            name: { $regex: expandedInput, $options: 'i' }
        }).toArray();
        console.log(searchResults, 'searchResults')

        const normalizedSearch = normalizeText(expandedInput);
        const searchWords = normalizedSearch.split(/\s+/);
        console.log(searchWords, 'searchResults')
        return searchResults.filter(doc => {
            const normalizedName = normalizeText(doc.name);
            console.log('normalizedName from doc', normalizedName);
            return searchWords.every(word => normalizedName.includes(word));
        });
    }
}