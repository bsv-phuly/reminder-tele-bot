import { Context } from 'grammy';
import { Command } from '../constants/common';
import { Reminder } from '../models/reminder';
import { catchReplyError } from '../utils/catchError';

const handleActiveReminder = async (ctx: Context) => {
    const chatId = ctx.chatId;

    if (!chatId) {
        return ctx.reply('Sorry, something went wrong.');
    }
    try {
        const setup = await Reminder.findOne({ chatId });
        if (!setup?.remindTime) return ctx.reply('Reminder notfound please /setup to set a new reminder');
        // Parse time into cron format
        const time = setup?.remindTime;
        const link = setup?.linkRemind;

        await Reminder.updateOne(
            { chatId },
            {
                $set: { updateAt: new Date(), status: true },
            },
            { upsert: false }
        );
        await ctx.reply(`✅ Reminder for ${link} at ${time} is now active!`);
    } catch (error) {
        await catchReplyError(error, ctx, 'active');
    }
}

export const activeCommand: Command = {
    name: 'active',
    description: 'Active link reminder',
    execute: async (ctx) => {
        await handleActiveReminder(ctx);
    },
};