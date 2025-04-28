import { Context } from 'grammy';
import { Command } from '../constants/common';
import { Reminder } from '../models/reminder';
import { catchReplyError } from '../utils/catchError';

const handleStatusReminder = async (ctx: Context) => {
    const chatId = ctx.chatId;

    if (!chatId) {
        return ctx.reply('Sorry, something went wrong.');
    }
    try {
        const setup = await Reminder.findOne({ chatId });
        if (!setup?.remindTime) return ctx.reply('Reminder notfound please /setup to set a new reminder');
        const status = `Your reminder currently ${setup?.status ? 'actived' : 'deactived'}`
        await ctx.reply(status);
    } catch (error) {
        await catchReplyError(error, ctx, 'status');
    }
}

export const statusCommand: Command = {
    name: 'status',
    description: 'Check status link reminder',
    execute: async (ctx) => {
        await handleStatusReminder(ctx);
    },
};