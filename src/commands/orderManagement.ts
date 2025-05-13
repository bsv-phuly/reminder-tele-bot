import { chatCommand } from './chat';
import { OrderRepository, ChatRepository } from './../database/repository';
import { Composer } from 'grammy';
import { BotContext, adminRequiredMiddleware, isUserAdmin } from '../bot/middleware';
import { OrderProcessor } from '../services/orderProcessor';
import { catchReplyError } from '../utils/catchError';

export const commandHandlers = new Composer<BotContext>();

// Help command
commandHandlers.command('help', async (ctx) => {
    let helpMessage = `
📝 *Order Tracking Bot Help* 📝

To record an order, simply send a message in this format:
\`Product Name - amount in k\`

For example:
\`Coffee - 52k\`
\`Laptop repair - 500k\`

*Available Commands:*
/help - Show this help message
/start - Get welcome message
`;

    if (await isUserAdmin(ctx)) {
        helpMessage += `
*Admin Commands:*
/summary - Get today's order summary
/settime HH:MM - Set daily summary time
/amiadmin - Check if you're an admin
`;

        // Additional group commands
        if (ctx.chat && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup')) {
            helpMessage += `
*Group Admin Commands:*
/enablesummary - Enable daily summaries in this group
/disablesummary - Disable daily summaries in this group
`;
        }
    }

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// Start command
commandHandlers.command('start', async (ctx) => {
    await ctx.reply(`
Welcome to the Order Tracking Bot! 🎉

This bot helps you track orders and calculate daily totals.

To record an order, simply send a message in this format:
\`Product Name - amount in k\`

For example:
\`Coffee - 52k\` (This will be recorded as 52,000)

Type /help for more information.
`, { parse_mode: 'Markdown' });
});

// Am I admin command
commandHandlers.command('amiadmin', async (ctx) => {
    const admin = await isUserAdmin(ctx);
    ctx.session.isAdmin = admin;

    if (admin) {
        await ctx.reply("Yes, you are an admin.");
    } else {
        await ctx.reply("No, you are not an admin.");
    }
});

// Summary command (admin only)
commandHandlers.command('summary', adminRequiredMiddleware, async (ctx) => {
    try {
        const chatId = ctx.chatId;
        const orderRepo = new OrderRepository();
        const orderProcessor = new OrderProcessor(orderRepo);
        const dailyTotals = await orderProcessor.calculateDailyTotals();
        const message = await orderProcessor.formatDailyTotalMessage(dailyTotals, chatId);

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error generating summary:', error);
        await ctx.reply("❌ Error generating summary. Please try again later.");
    }
});

// Enable/disable summary command (admin only)
commandHandlers.command(['enablesummary', 'disablesummary'], adminRequiredMiddleware, async (ctx) => {
    if (!ctx.chat || (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup')) {
        await ctx.reply("This command only works in group chats.");
        return;
    }
    const enable = ctx.message?.text.startsWith('/enable');
    const chatRepo = new ChatRepository();
    await chatRepo.updateSummarySetting(ctx.chat.id, enable ?? false);
    if (enable) {
        await ctx.reply("✅ Daily summaries are now enabled in this group.");
    } else {
        await ctx.reply("❌ Daily summaries are now disabled in this group.");
    }
});

// commandHandlers.command('checkTimeStatus', async (ctx) => {
//     const chatId = ctx.chatId;
//     try {
//         const chatRepo = new ChatRepository();
//         const setup = await chatRepo.findByChatId(chatId);
//         if (!setup?.cronExpression) return ctx.reply('Time remind notfound please /settime to set a new timer remind');
//         const status = `Your reminder currently ${setup?.cronExpression ? 'actived' : 'deactived'}`
//         await ctx.reply(status);
//     } catch (error) {
//         await catchReplyError(error, ctx, 'checkTimeStatus');
//     }
// });

commandHandlers.command([chatCommand.name], (ctx) => chatCommand.execute(ctx));