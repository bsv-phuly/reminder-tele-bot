import { Context } from "grammy";

export const catchReplyError = async (error: any, ctx: Context, commandName: string) => {
    await ctx.reply(`Error in setup ${commandName}` + error);
}