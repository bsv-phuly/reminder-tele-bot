import { Context } from 'grammy';
import { Command } from '../constants/common';
import { Reminder } from '../models/reminder';
import { catchReplyError } from '../utils/catchError';

const handleDeactiveReminder = async (ctx: Context) => {
    const chatId = ctx.chatId;

    if (!chatId) {
        return ctx.reply('Sorry, something went wrong.');
    }
    try {
        const setup = await Reminder.findOne({ chatId });
        if (!setup?.remindTime) return ctx.reply('Reminder notfound please /setup to set a new reminder');
        const time = setup?.remindTime;
        const link = setup?.linkRemind;

        await Reminder.updateOne(
            { chatId },
            {
                $set: { updateAt: new Date(), status: false },
            },
            { upsert: false }
        );
        await ctx.reply(`✅ Reminder for ${link} at ${time} is now deactive!`);
    } catch (error) {
        await catchReplyError(error, ctx, 'deactive');
    }
}

export const deactiveCommand: Command = {
    name: 'deactive',
    description: 'Deactive link reminder',
    execute: async (ctx) => {
        await handleDeactiveReminder(ctx);
    },
};