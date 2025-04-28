// src/commands/gemini.ts
import { Context } from 'grammy';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Command } from '../constants/common';
import { catchReplyError } from '../utils/catchError';

dotenv.config();

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function handleGeminiCommand(ctx: Context) {
    // Get the text that follows the /gemini command
    const prompt = ctx.message?.text?.replace(/^\/gemini\s+/i, '').trim();
    console.log(prompt, 'prompt')
    if (!prompt) {
        return ctx.reply('Please provide a prompt after the /gemini command. Example: /gemini Tell me a joke about programming');
    }

    try {
        // Show typing indicator
        if (!ctx.chatId) return;
        await ctx.api.sendChatAction(ctx.chatId, "typing");

        // Generate content using Gemini API
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Send the response back to the user
        await ctx.reply(text);
    } catch (error) {
        await catchReplyError(error, ctx, 'chat');
    }
}

export const chatCommand: Command = {
    name: 'chat',
    description: 'Chat with bot (Gemini)',
    execute: async (ctx) => {
        await handleGeminiCommand(ctx);
    },
};