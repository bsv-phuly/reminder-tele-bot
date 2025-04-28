import { Bot, Context, SessionFlavor } from "grammy";

// Define session data interface
export interface SessionData {
    lastCommand?: string;
    // Add any other session data fields
}

export type MyContext = Context & SessionFlavor<SessionData>;

export interface Command {
    name: string;
    description: string;
    execute: (ctx: Context) => Promise<void>;
}

export const BotToken = process.env.BOT_TOKEN || '';