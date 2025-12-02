import { Timestamp } from 'firebase/firestore';
import { Product } from './product';

export type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'whatsapp' | 'linkedin';

export interface ProductShareEvent {
    timestamp: Timestamp;
    platform: SocialPlatform;
}

export interface ProductMetrics {
    productId: string;
    storeId: string;

    // Share tracking
    lastSharedAt: Timestamp | null;
    totalShares: number;
    sharesByPlatform: Record<SocialPlatform, number>;

    // Share history (limited to last 20 for performance)
    shareHistory: ProductShareEvent[];

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface ProductWithMetrics {
    product: Product;
    metrics?: ProductMetrics;
}
