import { Product } from '@/types/product';
import { ProductScore } from '@/types/socialPost';
import { ProductMetrics } from '@/types/productMetrics';
import { detectPriceDrop } from './priceUtils';
export type { ProductScore };

// Configurable weights for ranking algorithm
const WEIGHTS = {
    views: 0.40,           // Popularity (40%)
    recency: 0.25,         // How new the product is (25%)
    stockUrgency: 0.15,    // Low stock urgency (15%)
    shareFreshness: 0.15,  // Avoid recently shared products (15%)
    priceDrop: 0.05,       // Price drop boost (5%)
    // Note: Revenue removed since orders aren't directly linked to products yet
};

/**
 * Normalizes a value to 0-100 scale
 */
function normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
}

/**
 * Calculates recency score based on product creation date
 * Newer products get higher scores
 */
function calculateRecencyScore(product: Product): number {
    const now = Date.now();
    let createdAtMs: number;

    // Handle different types of date values
    const createdAt = product.createdAt;

    if (createdAt === null || createdAt === undefined) {
        return 0; // No date, no score
    }

    // Check if it's an object with toMillis method (Firestore Timestamp)
    if (typeof createdAt === 'object' && createdAt !== null && 'toMillis' in createdAt && typeof createdAt.toMillis === 'function') {
        createdAtMs = createdAt.toMillis();
    }
    // Check if it's a Date object
    else if (createdAt instanceof Date) {
        createdAtMs = createdAt.getTime();
    }
    // Check if it's a string (ISO date string)
    else if (typeof createdAt === 'string') {
        createdAtMs = new Date(createdAt).getTime();
    }
    // Check if it's already a number (milliseconds)
    else if (typeof createdAt === 'number') {
        createdAtMs = createdAt;
    }
    // Fallback
    else {
        console.warn('Unknown createdAt format:', createdAt);
        return 0;
    }

    // Validate the timestamp
    if (isNaN(createdAtMs) || createdAtMs <= 0) {
        return 0;
    }

    const ageInDays = (now - createdAtMs) / (1000 * 60 * 60 * 24);

    // Products less than 7 days old get max score
    if (ageInDays < 7) return 100;
    // Linear decay over 30 days
    if (ageInDays < 30) return 100 - ((ageInDays - 7) / 23) * 100;
    return 0;
}

/**
 * Calculates share freshness penalty
 * Returns 0-100 where:
 * - 100 = Never shared or shared long ago (good for suggestions)
 * - 0 = Shared very recently (bad for suggestions)
 */
function calculateShareFreshnessScore(metrics?: ProductMetrics): number {
    if (!metrics || !metrics.lastSharedAt) {
        return 100; // Never shared = perfect for sharing
    }

    const now = Date.now();
    const lastSharedMs = metrics.lastSharedAt.toMillis();
    const daysSinceShared = (now - lastSharedMs) / (1000 * 60 * 60 * 24);

    // Handle future timestamps (clock skew)
    if (daysSinceShared < 0) {
        console.warn('Future timestamp detected:', metrics.lastSharedAt);
        return 100;
    }

    // Aggressive penalty for recently shared products
    if (daysSinceShared < 1) return 0;   // Shared today = skip
    if (daysSinceShared < 3) return 20;  // Shared 1-3 days ago = low priority
    if (daysSinceShared < 7) return 60;  // Shared 3-7 days ago = medium priority
    if (daysSinceShared < 14) return 90; // Shared 1-2 weeks ago = high priority

    return 100; // Shared > 2 weeks ago = perfect
}

/**
 * Calculates price drop boost score
 * Products with bigger discounts get higher scores
 * Returns 0-100 where higher = better deal
 */
function calculatePriceDropScore(product: Product): number {
    const dropInfo = detectPriceDrop(product);

    if (!dropInfo) return 0; // No discount

    // Score based on discount size
    if (dropInfo.dropPercent >= 50) return 100; // Huge drop (50%+)
    if (dropInfo.dropPercent >= 40) return 90;  // Large drop (40-49%)
    if (dropInfo.dropPercent >= 30) return 70;  // Good drop (30-39%)
    if (dropInfo.dropPercent >= 20) return 50;  // Medium drop (20-29%)
    if (dropInfo.dropPercent >= 15) return 30;  // Small drop (15-19%)

    return 0; // Less than 15% = no boost
}

/**
 * Calculates stock urgency score for general products
 */
function calculateStockUrgency(product: Product): number {
    // Only applicable to general products
    if (product.productType !== 'general') return 0;

    // Sold out products get 0
    if (product.soldOut) return 0;

    // Limited stock gets boost
    if (product.limitedStock) return 100;

    // Calculate based on quantity
    const quantity = product.quantity || 0;
    if (quantity === 0) return 0;
    if (quantity <= 5) return 80;
    if (quantity <= 10) return 50;
    if (quantity <= 20) return 20;
    return 0;
}

/**
 * Determines the primary reason for suggestion
 */
function getSuggestionReason(
    viewsScore: number,
    recencyScore: number,
    urgencyScore: number
): ProductScore['reason'] {
    // Prioritize by highest individual score
    if (recencyScore >= 90) return 'new';
    if (urgencyScore >= 80) return 'low-stock';
    if (viewsScore >= 70) return 'trending';
    if (viewsScore >= 40) return 'high-views';
    return 'trending'; // default
}

/**
 * Gets badge text and emoji for suggestion reason
 */
function getBadgeDetails(reason: ProductScore['reason']): { badge: string; emoji: string } {
    const badges = {
        'trending': { badge: 'Trending', emoji: '🔥' },
        'top-earner': { badge: 'Top Earner', emoji: '💰' },
        'new': { badge: 'New Arrival', emoji: '⚡' },
        'low-stock': { badge: 'Low Stock', emoji: '⏰' },
        'high-views': { badge: 'Popular', emoji: '👀' },
    };
    return badges[reason];
}

/**
 * Calculates weighted score for a single product
 * Now accepts optional metrics for share freshness scoring
 */
export function calculateProductScore(
    product: Product,
    allProducts: Product[],
    metrics?: ProductMetrics
): ProductScore {
    // Skip unavailable automotive products or sold out general products
    if (product.productType === 'vehicle' && !product.available) {
        return {
            product,
            score: 0,
            reason: 'trending',
            badge: '',
            emoji: '',
        };
    }
    if (product.productType === 'general' && product.soldOut) {
        return {
            product,
            score: 0,
            reason: 'trending',
            badge: '',
            emoji: '',
        };
    }

    // Get min/max views for normalization
    const viewCounts = allProducts.map(p => p.views || 0);
    const minViews = Math.min(...viewCounts);
    const maxViews = Math.max(...viewCounts);

    // Calculate individual scores
    const viewsScore = normalize(product.views || 0, minViews, maxViews);
    const recencyScore = calculateRecencyScore(product);
    const urgencyScore = calculateStockUrgency(product);
    const freshnessScore = calculateShareFreshnessScore(metrics);
    const priceDropScore = calculatePriceDropScore(product);

    // Calculate weighted total score
    const totalScore =
        (viewsScore * WEIGHTS.views) +
        (recencyScore * WEIGHTS.recency) +
        (urgencyScore * WEIGHTS.stockUrgency) +
        (freshnessScore * WEIGHTS.shareFreshness) +
        (priceDropScore * WEIGHTS.priceDrop);

    // Determine reason
    const reason = getSuggestionReason(viewsScore, recencyScore, urgencyScore);
    const { badge, emoji } = getBadgeDetails(reason);

    return {
        product,
        score: totalScore,
        reason,
        badge,
        emoji,
    };
}

/**
 * Gets ranked products sorted by score
 * @param products All products
 * @param metricsMap Optional map of product metrics for share freshness scoring
 * @param limit Maximum number of products to return
 * @returns Sorted array of product scores
 */
export function getRankedProducts(
    products: Product[],
    metricsMap?: Map<string, ProductMetrics>,
    limit: number = 20
): ProductScore[] {
    const scoredProducts = products
        .map(product => {
            const metrics = metricsMap?.get(product.id);
            return calculateProductScore(product, products, metrics);
        })
        .filter(scored => scored.score > 0); // Filter out unavailable/sold out

    // Sort by score descending
    scoredProducts.sort((a, b) => b.score - a.score);

    return scoredProducts.slice(0, limit);
}

/**
 * Estimates revenue for a product (placeholder until order integration)
 * Currently returns 0, will be updated when order data is linked
 */
export function getProductRevenueEstimate(product: Product): number {
    // TODO: Integrate with order data when available
    // For now, use views as a proxy indicator
    return 0;
}
