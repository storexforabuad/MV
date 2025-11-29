import { Timestamp } from 'firebase/firestore';
import { Product } from './product';

export type SocialPlatform = 'Facebook' | 'Instagram' | 'X' | 'WhatsApp';

export interface SocialPost {
    id: string;
    storeId: string;
    productId: string;
    platforms: SocialPlatform[];
    caption: string;
    imageUrl: string;
    postedAt: Timestamp;
    analytics?: {
        clicks?: number;
        engagement?: number;
    };
}

export interface ProductScore {
    product: Product;
    score: number;
    reason: 'trending' | 'top-earner' | 'new' | 'low-stock' | 'high-views';
    badge: string;
    emoji: string;
}

export interface CaptionTemplate {
    id: string;
    name: string;
    style: 'casual' | 'professional' | 'promotional' | 'storytelling' | 'minimalist';
    generate: (product: Product, storeName: string, storeId: string) => string;
}

export interface PlatformConfig {
    name: SocialPlatform;
    icon: string;
    color: string;
    maxCaptionLength: number;
    maxHashtags: number;
    supportsImages: boolean;
}
