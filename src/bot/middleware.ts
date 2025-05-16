import { ChatRepository, UserRepository } from './../database/repository';
import { Context, NextFunction, SessionFlavor } from 'grammy';
import { config } from '../config';
import { SessionData } from '../constants/common';
import { logger } from '../utils/logger';

export type BotContext = Context & SessionFlavor<SessionData>;

export async function saveUserAndChatMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
    const userRepo = new UserRepository();
    const chatRepo = new ChatRepository();
    // const colorId = (await ctx.getChat()).accent_color_id;
    try {
        // Save user information if available
        if (ctx.from) {
            await userRepo.saveUser({
                telegramId: ctx.from.id,
                username: ctx.from.username,
                firstName: ctx.from.first_name,
                lastName: ctx.from.last_name,
                joinedDate: new Date(),
                lastInteraction: new Date(),
                messageCount: 1
            });
        }

        const chatExists = await chatRepo.findByChatId(ctx.chat?.id ?? 0);
        // Save chat information if not available
        if (!chatExists && ctx.chat) {
            await chatRepo.saveChat({
                chatId: ctx.chat?.id ?? 0,
                type: ctx.chat.type as 'private' | 'group' | 'supergroup' | 'channel',
                title: ctx.chat.title,
                isActive: true,
                sendSummaries: true,
                createdAt: new Date(),
                cronExpression: ''
            });
        }
    } catch (error) {
        console.error('Error in save user/chat middleware:', error);
        logger.error('Error in save user/chat middleware:', error);
        // Continue execution even if there's an error
    }

    await next();
}

export async function isUserAdmin(ctx: BotContext): Promise<boolean> {
    const userId = ctx.from?.id;
    if (!userId) return false;

    // First check static admin list from environment
    if (config.telegram.adminIds.includes(userId)) {
        return true;
    }

    // Then check if message is from a group
    if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
        try {
            // Check if user is admin or creator in the group
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, userId);
            return ['administrator', 'creator'].includes(chatMember.status);
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    return false;
}

export async function adminRequiredMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
    if (await isUserAdmin(ctx)) {
        await next();
    } else {
        await ctx.reply("⛔ This command is for admins only.");
    }
}