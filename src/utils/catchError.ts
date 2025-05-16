import { Context } from "grammy";
import { logger } from "./logger";

export const catchReplyError = async (error: any, ctx: Context, commandName: string) => {
    const errorMessage = `Error in setup ${commandName}`;
    logger.error(`Error in setup ${commandName}`, error);
    await ctx.reply(errorMessage + error);
}