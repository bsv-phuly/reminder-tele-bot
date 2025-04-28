export function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

export function parseTimeToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
}

export function formatTimeLine(time: string) {
    const reminderDate = parseTimeToDate(time);
    return formatTime(reminderDate);
}