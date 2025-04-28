import { Context } from 'grammy';
import { User } from '../models/user';
import { Command } from '../constants/common';
import { catchReplyError } from '../utils/catchError';

export async function handleProfileCommand(ctx: Context) {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
        return ctx.reply('Sorry, something went wrong.');
    }

    try {
        const user = await User.findOne({ telegramId });

        if (!user) {
            return ctx.reply('You need to start the bot with /start first!');
        }

        const profileText = `
            📊 *Your Profile* 📊
            *Name:* ${user.firstName} ${user.lastName || ""}
            *Username:* ${user.username ? "@" + user.username : "Not set"}
            *Joined:* ${user.joinedDate.toLocaleDateString()}
            *Interactions:* ${user.messageCount}
            *Last seen:* ${user.lastInteraction.toLocaleDateString()}
        `;

        await ctx.reply(profileText, { parse_mode: 'Markdown' });

        // Update last interaction
        user.lastInteraction = new Date();
        user.messageCount += 1;
        await user.save();
    } catch (error) {
        await catchReplyError(error, ctx, 'profile');
    }
}

export const profileCommand: Command = {
    name: 'profile',
    description: 'Check profile user',
    execute: async (ctx) => {
        await handleProfileCommand(ctx);
    },
};