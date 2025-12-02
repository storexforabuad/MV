import { Product } from '@/types/product';

export interface PriceDropInfo {
    hasDrop: boolean;
    dropAmount: number;
    dropPercent: number;
    badge: string;
    emoji: string;
    urgency: 'high' | 'medium' | 'low';
}

/**
 * Detects if a product has a price drop (via originalPrice)
 * Returns badge information for display
 */
export function detectPriceDrop(product: Product): PriceDropInfo | null {
    // Check if product has originalPrice and it's actually a discount
    if (!product.originalPrice || product.price >= product.originalPrice) {
        return null; // No drop
    }

    const dropAmount = product.originalPrice - product.price;
    const dropPercent = Math.round((dropAmount / product.originalPrice) * 100);

    // Determine urgency based on discount size
    let urgency: 'high' | 'medium' | 'low';
    let emoji: string;
    let badge: string;

    if (dropPercent >= 40) {
        urgency = 'high';
        emoji = '🔥';
        badge = `${dropPercent}% OFF!`;
    } else if (dropPercent >= 20) {
        urgency = 'medium';
        emoji = '💸';
        badge = `${dropPercent}% OFF`;
    } else {
        urgency = 'low';
        emoji = '💰';
        badge = `Save ₦${dropAmount.toLocaleString()}`;
    }

    return {
        hasDrop: true,
        dropAmount,
        dropPercent,
        badge,
        emoji,
        urgency,
    };
}

/**
 * Gets badge text for a price drop
 */
export function getPriceDropBadgeText(product: Product): string | null {
    const dropInfo = detectPriceDrop(product);
    return dropInfo ? `${dropInfo.emoji} ${dropInfo.badge}` : null;
}

/**
 * Determines if price drop is significant enough to boost in rankings
 */
export function hasSignificantPriceDrop(product: Product, minPercent: number = 15): boolean {
    const dropInfo = detectPriceDrop(product);
    return dropInfo ? dropInfo.dropPercent >= minPercent : false;
}
