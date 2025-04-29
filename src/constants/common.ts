import { CronJob } from "cron";
import { Bot, Context, SessionFlavor } from "grammy";

// Define session data interface
export interface SessionData {
    lastCommand?: string;
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