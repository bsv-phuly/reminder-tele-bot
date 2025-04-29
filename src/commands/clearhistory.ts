import { Context } from "grammy";
import { ChatHistory } from "../models/chatHistory";
import { catchReplyError } from "../utils/catchError";
import { Command } from "../constants/common";

async function handleClearHistoryCommand(ctx: Context) {
    if (!ctx.chatId || !ctx.from?.id) return;

    try {
        const userId = ctx.from.id;

        // Delete all chat history for this user
        const result = await ChatHistory.deleteMany({ userId });

        await ctx.reply(`Your chat history has been cleared. Deleted ${result.deletedCount} messages.`);
    } catch (error) {
        await catchReplyError(error, ctx, 'clearhistory');
    }
}

export const clearHistoryCommand: Command = {
    name: 'clearhistory',
    description: 'Clear your chat history',
    execute: async (ctx) => {
        await handleClearHistoryCommand(ctx);
    },
};