import { Database } from './database/db';
import { TelegramBot } from './bot/TelegramBot';

async function main() {
    try {
        console.log("Service started...");
        // Connect to MongoDB
        const db = new Database();
        await db.connect();
        const teleBot = new TelegramBot();
        // Start the bot
        await teleBot.start();
        process.on('SIGINT', async () => {
            console.log('Shutting down...');
            await db.close();
            await teleBot.stop();
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}
// Execute
main();