import { ChatRepository } from './../database/repository';
import { IDailyTotal } from './../models/dailyTotal';
import { IOrder } from './../models/orders';
import { OrderRepository } from '../database/repository';
import { Chat } from '../models/chats';
import { DailySummaryCronJob } from '../bot';

export class OrderProcessor {
    constructor(private orderRepository: OrderRepository) { }

    // Parse order message in format: "product name - amount(52k)"
    parseOrderMessage(message: string): { productName: string; amount: number } | null {
        try {
            // Regular expression to match the pattern "product name - amount(52k)"
            const regex = /(.+)\s*-\s*(\d+)k/i;
            const match = message.match(regex);

            if (match) {
                const productName = match[1].trim();
                // Convert "52k" to 52000
                const amount = parseInt(match[2]) * 1000;

                return { productName, amount };
            }

            return null;
        } catch (error) {
            console.error('Error parsing order message:', error);
            return null;
        }
    }

    async saveOrder(userId: number, chatId: number, message: string): Promise<IOrder | null> {
        const parsedOrder = this.parseOrderMessage(message);

        if (!parsedOrder) return null;

        // const checkOrder = await Order.findOne({ userId });
        // if (checkOrder) {

        // }
        const order: any = {
            userId,
            chatId,
            productName: parsedOrder.productName,
            amount: parsedOrder.amount,
            createdAt: new Date()
        };

        await this.orderRepository.createOrUpdate(order);
        return order;
    }

    async calculateDailyTotals(date: Date = new Date()): Promise<IDailyTotal[]> {
        const chatRepo = new ChatRepository();
        const users = await this.orderRepository.getUsersWithOrdersToday();
        const orders = await this.orderRepository.getOrdersForDay(date);

        const userTotals = new Map<number, IDailyTotal>();

        for (const order of orders) {
            const chat = await chatRepo.findByChatId(order.chatId);

            if (order.chatId !== chat?.chatId) {
                continue;
            }
            if (!userTotals.has(order.userId)) {
                const user = users.find(u => u.telegramId === order.userId);

                userTotals.set(order.userId, {
                    userId: order.userId,
                    username: user?.username,
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    totalAmount: 0,
                    orderCount: 0,
                    createdAt: new Date(),
                    orders: []
                });
            }

            const userTotal = userTotals.get(order.userId)!;
            userTotal.totalAmount += order.amount;
            userTotal.orderCount += 1;
            userTotal.orders.push(order);
        }

        return Array.from(userTotals.values())
            .sort((a, b) => b.totalAmount - a.totalAmount);
    }

    async formatDailyTotalMessage(dailyTotals: IDailyTotal[], chatId: number): Promise<string> {
        const now = new Date().toLocaleDateString("vi-VN");
        const order = await this.orderRepository.getOrder(chatId);
        if (dailyTotals.length === 0 && order) {
            return "No orders recorded today.";
        }

        let message = `📊 *Daily Order Summary* 📊\n ${now} \n\n`;
        let grandTotal = 0;

        for (const userTotal of dailyTotals) {
            const userName = userTotal.username ||
                `${userTotal.firstName || ''} ${userTotal.lastName || ''}`.trim() ||
                `User ${userTotal.userId}`;

            message += `👤 *${userName}*\n`;
            message += `💰 Total: ${(userTotal.totalAmount / 1000).toFixed(1)}k (${userTotal.totalAmount.toLocaleString()} VND)\n`;
            message += `🛒 Orders: ${userTotal.orderCount}\n\n`;
            message += `📝 *Order Details (giá chưa giảm)*:\n`;

            const sortedOrders = [...userTotal.orders].sort((a, b) => b.amount - a.amount);
            for (const order of sortedOrders) {
                if (!order?.chatId) continue;
                message += `- ${order.productName}: ${(order.amount / 1000).toFixed(1)}k\n`;
            }

            message += '\n';
            grandTotal += userTotal.totalAmount;
        }

        message += `*GRAND TOTAL: ${(grandTotal / 1000).toFixed(1)}k (${grandTotal.toLocaleString()} VND)*`;

        return message;
    }

    async initializeAllTimer(sendDailyHandler: () => void) {
        const activeReminders = await Chat.find({ sendSummaries: true });
    
        for (const reminder of activeReminders) {
            if (reminder.sendSummaries && reminder.cronExpression) {
                const params = {
                    timeJob: reminder.cronExpression,
                    functionJob: sendDailyHandler,
                }
                const dailyCronJob = new DailySummaryCronJob(params.timeJob, params.functionJob);
                dailyCronJob.updateCronTime(params.timeJob, params.functionJob);
            }
        }
    }
}