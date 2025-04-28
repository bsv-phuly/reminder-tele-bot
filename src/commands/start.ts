import { Context } from 'grammy';
import { User } from '../models/user';
import { Command } from '../constants/common';
import { catchReplyError } from '../utils/catchError';

async function handleStartCommand(ctx: Context) {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
        return ctx.reply('Sorry, something went wrong.');
    }

    try {
        // Find or create user
        let user = await User.findOne({ telegramId });

        if (!user) {
            user = new User({
                telegramId,
                firstName: ctx.from?.first_name,
                lastName: ctx.from?.last_name,
                username: ctx.from?.username,
                joinedDate: new Date(),
                lastInteraction: new Date(),
                messageCount: 1
            });
            await user.save();
            await ctx.reply(`Welcome, ${ctx.from?.first_name}! This is your first time using our bot.`);
        } else {
            user.lastInteraction = new Date();
            user.messageCount += 1;
            await user.save();
            await ctx.reply(`Welcome back, ${ctx.from?.first_name}! You have used our bot ${user.messageCount} times.`);
        }
    } catch (error) {
        await catchReplyError(error, ctx, 'start');
    }
}

export const startCommand: Command = {
    name: 'start',
    description: 'Check session start comment',
    execute: async (ctx) => {
        await handleStartCommand(ctx);
    },
};