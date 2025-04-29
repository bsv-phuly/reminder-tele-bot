import { Bot, session } from 'grammy';
import { MongoDBAdapter } from '@grammyjs/storage-mongodb';
import { connectToDatabase } from './database/db';
import { User } from './models/user';
import mongoose, { Collection } from 'mongoose';
import dotenv from 'dotenv';
import { getAllCommands, registerCommands } from './commands';
import { BotToken, MyContext, SessionData } from './constants/common';
import { initializeAllReminders } from './commands/setup';
import { chatCommand } from './commands/chat';
import handleChatImage from './services/useChatImage';

dotenv.config();

async function startBot() {
    console.log("Service started...");
    // Connect to MongoDB
    await connectToDatabase();

    // Initialize your bot with the proper context type
    const bot = new Bot<MyContext>(BotToken);

    // Configure sessions with MongoDB storage
    const collection = mongoose.connection.collection('sessions');
    bot.use(session({
        initial: (): SessionData => ({}),
        storage: new MongoDBAdapter({
            collection: collection as any
        })
    }));
    
    // Register command handlers
    await bot.api.setMyCommands(getAllCommands());
    registerCommands(bot);
    await initializeAllReminders(bot.api);

    // Handle text messages
    bot.on('message', async (ctx) => {
        try {
            const telegramId = ctx.from?.id;
            const text = ctx.message.text ? ctx.message.text : ctx.message.caption;
            const commandInput = text;
            console.log(text, 'texttexttexttexttext')
            
            console.log(ctx, 'ctx')
            if (telegramId) {
                // Update user's last interaction
                await User.updateOne(
                    { telegramId },
                    {
                        $set: { lastInteraction: new Date() },
                        $inc: { messageCount: 1 }
                    },
                    { upsert: false }
                );
                if (commandInput && commandInput.startsWith("/chat")) {
                    await handleChatImage(ctx);
                    return;
                }
                await ctx.reply('I received your message! Try /profile to see your stats.');
            }
            

        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    // Error handling
    bot.catch((err) => {
        console.error('Error in bot:', err);
    });

    // Start the bot
    await bot.start();
    console.log('Bot started successfully!');
}

// Run the bot
startBot().catch(console.error);