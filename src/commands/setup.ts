import { CronJob } from 'cron';
import { Context } from 'grammy';
import { Command, defaultCronDays, userCronJobs } from '../constants/common';
import { Reminder } from '../models/reminder';
import { catchReplyError } from '../utils/catchError';
import { getJobKey, stopExistingJob } from '../utils/commonFunction';
import { Chat } from '../models/chats';
import { DailySummaryCronJob } from '../bot';

function startCronJob(chatId: number, link: string, time: string, api: Context['api']) {
    const [hour, minute] = time.split(":").map(Number);
    const timezone = "Asia/Bangkok";
    const cronExpression = `${minute} ${hour} * * ${defaultCronDays}`;
    const jobKey = getJobKey(chatId, link, time);

    // Stop existing job if it exists
    stopExistingJob(userCronJobs, jobKey);

    // Create new CronJob
    const job = new CronJob(
        cronExpression,
        async () => {
            try {
                await api.sendMessage(chatId, `⏰ Reminder for you! 🔗 ${link}`);

                // Update last run time in database
                await Reminder.updateOne(
                    { chatId, linkRemind: link, remindTime: time },
                    { $set: { updateAt: new Date() } }
                );
            } catch (error) {
                console.error(`Error sending reminder to ${chatId}:`, error);
            }
        },
        null,
        true, // start immediately
        timezone
    );

    // Store in memory
    userCronJobs.set(jobKey, job);

    // Return job info for reference
    return {
        cronExpression,
        hour,
        minute,
        days: defaultCronDays,
        timezone,
        jobKey
    };
}

export async function initializeAllReminders(api: Context['api']) {
    const activeReminders = await Reminder.find({ status: true });

    for (const reminder of activeReminders) {
        if (reminder.chatId && reminder.linkRemind && reminder.remindTime) {
            startCronJob(reminder.chatId, reminder.linkRemind, reminder.remindTime, api);
        }
    }
}

async function handleSetupCommand(ctx: Context) {
    const chatId = ctx.chatId;
    const text = ctx.message?.text
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

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
        const [hour, minute] = time.split(":").map(Number);
        const cronExpression = `${minute} ${hour} * * ${defaultCronDays}`;
         // Start the cron job and get the job info
        startCronJob(chatId, link, time, ctx.api);
        const reminderInfo = await Reminder.findOne({ chatId });

        const params = {
            linkRemind: link,
            remindTime: time,
            cronExpression: cronExpression,
        }
        if (!reminderInfo) {
            await Reminder.insertOne({
                chatId: chatId,
                createdAt: new Date(),
                status: true,
                ...params
            });
        } else {
            await Reminder.updateOne(
                { chatId },
                {
                    $set: { updateAt: new Date(), status: true, ...params },
                },
                { upsert: false }
            );
            await reminderInfo.save();
        }
        await ctx.reply(`✅ Setup save!\n🔗 Link: ${link}\n⏰ Time: ${time}`);
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