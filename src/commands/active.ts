import { Context } from 'grammy';
import { Command, userCronJobs } from '../constants/common';
import { Reminder } from '../models/reminder';
import { catchReplyError } from '../utils/catchError';
import { getJobKey } from '../utils/commonFunction';
import { CronJob } from 'cron';

const handleActiveReminder = async (ctx: Context) => {
    const chatId = ctx.chatId;

    if (!chatId) {
        return ctx.reply('Sorry, something went wrong.');
    }
    const setup = await Reminder.findOne({ chatId });
    if (!setup?.remindTime) return ctx.reply('Reminder notfound please /setup to set a new reminder');
    const jobKey = getJobKey(chatId, setup.linkRemind || "", setup.remindTime || "");
    const time = setup?.remindTime;
    const link = setup?.linkRemind;
    const job = new CronJob(
        jobKey,
        async () => {
            try {
                await ctx.api.sendMessage(chatId, `⏰ Reminder for you! 🔗 ${link}`);

                // Update last run time in database
                await Reminder.updateOne(
                    { chatId },
                    {
                        $set: { updateAt: new Date(), status: true }
                    },
                    { upsert: false }
                );
                await setup.save();
                await ctx.reply(`✅ Reminder for ${link} at ${time} is now active!`);
            } catch (error) {
                await catchReplyError(error, ctx, 'active');
            }
        },
        null,
        true, // start immediately
        "Asia/Bangkok"
    );

    userCronJobs.set(jobKey, job);
}

export const activeCommand: Command = {
    name: 'active',
    description: 'Active link reminder',
    execute: async (ctx) => {
        await handleActiveReminder(ctx);
    },
};