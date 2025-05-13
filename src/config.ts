import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface Config {
    mongodb: {
        uri: string;
        dbName: string;
    };
    telegram: {
        token: string;
        adminIds: number[];
    };
    scheduler: {
        summaryTime: string;
        timezone: string;
    };
    environment: string;
}

function getEnvVariable(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}

function parseAdminIds(adminIdsStr: string): number[] {
    if (!adminIdsStr) return [];
    return adminIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
}

export const config: Config = {
    mongodb: {
        uri: getEnvVariable('MONGODB_URI', 'mongodb://localhost:27017/telegram-bot'),
        dbName: getEnvVariable('DB_NAME', 'telegram-bot'),
    },
    telegram: {
        token: getEnvVariable('BOT_TOKEN'),
        adminIds: parseAdminIds(getEnvVariable('ADMIN_IDS', '')),
    },
    scheduler: {
        summaryTime: getEnvVariable('CRON_TIME', '0 17 * * *'),
        timezone: getEnvVariable('TIMEZONE', 'Asia/Ho_Chi_Minh'),
    },
    environment: getEnvVariable('NODE_ENV', 'development'),
};