// src/commands/gemini.ts
import { Context } from 'grammy';
// import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { ChatMessage, Command } from '../constants/common';
import { catchReplyError } from '../utils/catchError';
import { ChatHistory } from '../models/chatHistory';
import fs from 'fs';
import {
    GoogleGenAI,
} from "@google/genai";
import saveChatHistory from '../utils/useSaveHistory';

dotenv.config();

// Initialize the Google Generative AI client
const modelName = 'gemini-2.5-flash-preview-04-17';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function fileToGenerativePart(filePath: string, mimeType: string) {
    const fileData = await fs.promises.readFile(filePath);
    return {
        inlineData: {
            data: fileData.toString('base64'),
            mimeType
        },
    };
}

function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, (char) => '\\' + char);
}

function formatMarkdownWithCode(text: string): string {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    let result = '';
    let lastIndex = 0;

    // Iterate over all code blocks
    for (const match of text.matchAll(codeBlockRegex)) {
        const [fullMatch, codeContent] = match;
        const index = match.index ?? 0;

        // Escape and append text before the code block
        const beforeCode = text.slice(lastIndex, index);
        result += escapeMarkdown(beforeCode);

        // Append the raw (already in triple-backtick format) code block
        result += `\n\`\`\`\n${escapeMarkdown(codeContent)}\n\`\`\``;

        lastIndex = index + fullMatch.length;
    }

    // Escape and append remaining text after last code block
    result += escapeMarkdown(text.slice(lastIndex));

    return result;
}

async function handleGeminiCommand(ctx: Context) {
    // Get the text that follows the /gemini command
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    if (!userId) return;
    try {
        // Show typing indicator
        if (!ctx.chatId) return;
        let prompt = '';
        if (ctx.message?.text) {
            prompt = ctx.message.text.replace(/^\/chat\s+/i, '').trim();
        }
        if (!prompt) {
            return ctx.reply('Please provide a prompt after the /chat command. Example: /chat Tell me a joke about programming');
        }
        await saveChatHistory(userId, {
            role: 'user',
            content: prompt,
            timestamp: new Date(),
            hasImage: false
        }, username, ctx.chatId);
        await ctx.api.sendChatAction(ctx.chatId, "typing");

        // Generate content using Gemini API
        let history = [];
        const listChat = await ChatHistory.find({ chatId: ctx.chatId });
        for (const chat of listChat) {
            history.push({
                role: chat.role,
                parts: [{ 'text': chat.content }],
            });
        }
        let result: any;
        const chat = ai.chats.create({ model: modelName, history });
        result = await chat.sendMessage({ message: prompt });
        if (!result) return ctx.reply('Sorry, something went wrong.');
        const text = result.text;

        await saveChatHistory(1, {
            role: 'model',
            content: text,
            timestamp: new Date(),
            hasImage: false
        }, username, ctx.chatId);

        const formatText = formatMarkdownWithCode(text);
        // Send the response back to the user
        await ctx.reply(formatText, { parse_mode: "MarkdownV2" });
    } catch (error) {
        await catchReplyError(error, ctx, 'chat');
    }
}

export const chatCommand: Command = {
    name: 'chat',
    description: 'Chat with bot (Gemini) - send text or images',
    execute: async (ctx) => {
        await handleGeminiCommand(ctx);
    },
};