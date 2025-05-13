import { CronJob } from "cron";
import { Context, SessionFlavor } from "grammy";
import dotenv from 'dotenv';

dotenv.config();
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-bot';
// Define session data interface
export interface SessionData {
    lastCommand?: string;
    isAdmin?: boolean;
    // Add any other session data fields
}

export type MyContext = Context & SessionFlavor<SessionData>;

export type CommandProps = {
    command: string;
    description: string;
}

export interface Command {
    name: CommandProps['command'];
    description: CommandProps['description'];
    execute: (ctx: Context) => Promise<void>;
}

export const BotToken = process.env.BOT_TOKEN || '';

export const userCronJobs = new Map<string, CronJob>();

export interface ChatMessage {
    userId: number;
    username?: string;
    role: 'user' | 'model';
    content: string;
    timestamp: Date;
    hasImage?: boolean;
}

export const defaultCronDays = "1-5"; // Monday to Friday