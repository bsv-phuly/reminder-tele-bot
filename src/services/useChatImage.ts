import path from "path";
import fs from "fs";
import dotenv from 'dotenv';
import { createPartFromUri, createUserContent, GoogleGenAI } from "@google/genai";
import saveChatHistory from "../utils/useSaveHistory";
import { catchReplyError } from "../utils/catchError";
import { ChatHistory } from "../models/chatHistory";

dotenv.config();
const modelName = 'gemini-2.0-flash';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function deleteFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath, () => { });
        console.log(`Deleted file: ${filePath}`);
    } catch (err: any) {
        if (err.code === "ENOENT") {
            console.warn(`File not found: ${filePath}`);
        } else {
            throw err;
        }
    }
}

export default async function handleChatImage(ctx: any) {
    try {
        let image: any | null = null;
        let prompt = '';
        let imagePath: string | null = null;
        let result: any | null = null;
        const userId = ctx.me?.id;
        const username = ctx.me?.username;
        if (!userId) return;
        if (ctx?.update?.message?.caption) {
            prompt = ctx?.update?.message?.caption.replace(/^\/chat\s+/i, '').trim();
        }
        if (!prompt) {
            return ctx.reply('Please provide a prompt after the /chat command. Example: /chat Tell me a joke about programming');
        }
        if (ctx?.update?.message?.photo) {
            const photos = ctx?.update?.message?.photo;
            const photo = photos[photos.length - 1]; // Get the highest resolution photo

            if (photo && photo.file_id) {
                // Get file information
                const file = await ctx.api.getFile(photo.file_id);

                // Create download directory if it doesn't exist
                const downloadDir = path.join(process.cwd(), 'downloads');
                if (!fs.existsSync(downloadDir)) {
                    fs.mkdirSync(downloadDir, { recursive: true });
                }
                const filename = `${Date.now()}_${photo.file_id.slice(0, 10)}.jpg`;
                imagePath = path.join(downloadDir, filename);
                if (file.file_path) {
                    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
                    const response = await fetch(fileUrl);
                    const buffer = Buffer.from(await response.arrayBuffer());
                    await fs.promises.writeFile(imagePath, buffer);
                    image = await ai.files.upload({
                        file: 'downloads/' + filename,
                    });
                    await deleteFile(imagePath);
                    // If no prompt was provided with the image
                    if (!prompt) {
                        prompt = "Describe this image";
                    }
                }
            }
        }
        await saveChatHistory(userId, {
            role: 'user',
            content: prompt,
            timestamp: new Date(),
            hasImage: true
        }, username, ctx.chatId);
        await ctx.api.sendChatAction(ctx.chatId, "typing");
        if (image) {
            // Generate content using Gemini API
            // let history = [];
            // const listChat = await ChatHistory.find({ chatId: ctx.chatId });
            // const chatContent = createUserContent([
            //     prompt,
            //     createPartFromUri(image.uri, image.mimeType)
            // ])
            // for (const chat of listChat) {
            //     history.push({
            //         role: chat.role,
            //         parts: [{ 'text': chat.content }],
            //     });
            //     if (chatContent) history.push(chatContent)
            // }
            // const chat = ai.chats.create({ model: modelName, history });
            // result = await chat.sendMessage({ message: prompt });
            result = await ai.models.generateContent({
                model: modelName,
                contents: [
                    createUserContent([
                        prompt,
                        createPartFromUri(image.uri, image.mimeType)
                    ]),
                ],
            });
            await ai.files.delete({ name: image.name });
        }
        if (!result) return ctx.reply('Sorry, something went wrong.');
        const text = result.text;

        await saveChatHistory(1, {
            role: 'model',
            content: text,
            timestamp: new Date(),
            hasImage: false
        }, username, ctx.chatId);

        await ctx.reply(text);
    } catch (error) {
        await catchReplyError(error, ctx, 'chat');
    }
}