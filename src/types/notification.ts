export type NotificationType = 'success' | 'activity' | 'action' | 'critical';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: number;
    actionLabel?: string;
    actionUrl?: string; // or a handler ID
    isRead: boolean;
}
