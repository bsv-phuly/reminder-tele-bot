import { Api, Context } from 'grammy';
import { BotToken, Command } from '../constants/common';
import { catchReplyError } from '../utils/catchError';

export async function handleListCommand(ctx: Context) {
    const api = new Api(BotToken)
    const commands = await api.getMyCommands()

    if (!commands) {
        return ctx.reply('Sorry, something went wrong.');
    }

    try {
        let textReply = ''
        for (const command of commands) {
            textReply += `
${command?.command} - ${command.description}
            `
        }
        await ctx.reply('Here is your list:' + textReply);
    } catch (error) {
        await catchReplyError(error, ctx, 'list');
    }
}

export const listCommand: Command = {
    name: 'list',
    description: 'Check list commands',
    execute: async (ctx) => {
        await handleListCommand(ctx);
    },
};