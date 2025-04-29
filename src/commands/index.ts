import { Bot } from 'grammy';
import { startCommand } from './start';
import { profileCommand } from './profile';
import { chatCommand } from './chat';
import { listCommand } from './list';
import { setUpCommand } from './setup';
import { activeCommand } from './active';
import { deactiveCommand } from './deactive';
import { statusCommand } from './status';
import { Command, CommandProps } from '../constants/common';
import { MyContext } from '../constants/common';
import { clearHistoryCommand } from './clearhistory';

const commands: Command[] = [
    startCommand,
    profileCommand,
    chatCommand,
    listCommand,
    setUpCommand,
    activeCommand,
    deactiveCommand,
    statusCommand,
    clearHistoryCommand,
];

export function registerCommands(bot: Bot<MyContext>) {
    for (const command of commands) {
        bot.command([command.name], (ctx) => command.execute(ctx));
    }
}

export function getAllCommands(): CommandProps[] {
    let list = [];
    for (const command of commands) {
        list.push({ command: command.name, description: command.description });
    }
    return list;
}