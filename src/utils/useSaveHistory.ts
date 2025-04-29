import { UUID } from 'bson';
import { ChatMessage } from "../constants/common";
import { ChatHistory } from "../models/chatHistory";

export default async function saveChatHistory(userId: number, message: Omit<ChatMessage, 'userId'>, username?: string, chatId?: number) {
    try {
        await ChatHistory.insertOne({
            id: new UUID().toString(),
            userId,
            username,
            chatId,
            ...message,
        });
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}