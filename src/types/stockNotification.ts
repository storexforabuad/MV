import { Timestamp } from 'firebase/firestore';

export interface StockNotification {
  id?: string;
  productId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  notificationStatus: 'pending' | 'sent';
  pushSubscription?: PushSubscriptionJSON | null;
  createdAt: Timestamp;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}
