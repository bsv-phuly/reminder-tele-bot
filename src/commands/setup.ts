import { CronJob } from 'cron';
import { Context } from 'grammy';
import { Command } from '../constants/common';
import { Reminder } from '../models/reminder';
import { catchReplyError } from '../utils/catchError';

async function handleSetupCommand(ctx: Context) {
    const chatId = ctx.chatId;
    const text = ctx.message?.text
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    const userCronJobs = new Map<string, CronJob>();
    const defaultCronDays = "1,2,3,4,5";

    if (!chatId) {
        return ctx.reply('Sorry, something went wrong.');
    }

    if (!text) return ctx.reply("❌ No text found.");
    const args = text.split(" ").slice(1);
    if (args.length !== 2) {
        return ctx.reply("❌ Please use the format: /setup <link> <HH:MM>\nExample: /setup https://google.com 07:00");
    }
    const [link, time] = args;

    if (!timeRegex.test(time)) {
        return ctx.reply("❌ Invalid time format. Please use HH:MM (24h format).\nExample: 07:00 or 18:30");
    }

    if (!link.startsWith("http://") && !link.startsWith("https://")) {
        return ctx.reply("❌ Link must start with http:// or https://");
    }

    try {
        const reminderInfo = await Reminder.findOne({ chatId });

        const params = {
            linkRemind: link,
            remindTime: time
        }
        if (!reminderInfo) {
            await Reminder.insertOne({
                chatId: chatId,
                linkRemind: params?.linkRemind,
                remindTime: params?.remindTime,
                createdAt: new Date(),
                status: true
            });
        } else {
            await Reminder.updateOne(
                { chatId },
                {
                    $set: { updateAt: new Date(), status: true, linkRemind: params?.linkRemind, remindTime: params?.remindTime },
                },
                { upsert: false }
            );
        }
        // Parse time into cron format
        const [hour, minute] = time.split(":").map(Number);

        // Unique key per user setup
        const jobKey = `${chatId}_${link}_${time}`;

        // If already has a job with same key, stop it first
        const existingJob = userCronJobs.get(jobKey);
        if (existingJob) {
            existingJob.stop();
            userCronJobs.delete(jobKey);
        }

        // Create new CronJob
        const job = new CronJob(
            `${minute} ${hour} * * ${defaultCronDays}`,
            async () => {
                await ctx.api.sendMessage(chatId, `⏰ Reminder for you! 🔗 ${link}`);
            },
            null,
            true, // start immediately
            "Asia/Bangkok" // timezone
        );

        // Store in memory
        userCronJobs.set(jobKey, job);
        await ctx.reply(`✅ Setup save!\n🔗 Link: ${link}\n⏰ Time: ${time}`);
        // await reminderInfo.save();
    } catch (error) {
        await catchReplyError(error, ctx, 'setup');
    }
}

export const setUpCommand: Command = {
    name: 'setup',
    description: 'Setup link reminder time (format HH:MM)',
    execute: async (ctx) => {
        await handleSetupCommand(ctx);
    },
};