import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { ProductMetrics, SocialPlatform, ProductShareEvent } from '@/types/productMetrics';

/**
 * Records a product share event
 * Creates document if it doesn't exist, updates if it does
 */
export async function trackProductShare(
    storeId: string,
    productId: string,
    platform: SocialPlatform
): Promise<void> {
    const metricsRef = doc(db, 'productMetrics', `${storeId}_${productId}`);

    try {
        const metricsSnap = await getDoc(metricsRef);

        const shareEvent: ProductShareEvent = {
            timestamp: Timestamp.now(),
            platform: platform.toLowerCase() as SocialPlatform,
        };

        if (!metricsSnap.exists()) {
            // Create new metrics document
            const newMetrics: ProductMetrics = {
                productId,
                storeId,
                lastSharedAt: Timestamp.now(),
                totalShares: 1,
                sharesByPlatform: {
                    instagram: platform === 'instagram' ? 1 : 0,
                    facebook: platform === 'facebook' ? 1 : 0,
                    twitter: platform === 'twitter' ? 1 : 0,
                    whatsapp: platform === 'whatsapp' ? 1 : 0,
                    linkedin: platform === 'linkedin' ? 1 : 0,
                },
                shareHistory: [shareEvent],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            await setDoc(metricsRef, newMetrics);
        } else {
            // Update existing metrics
            const currentMetrics = metricsSnap.data() as ProductMetrics;
            const currentHistory = currentMetrics.shareHistory || [];

            // Keep only last 20 shares to avoid document bloat
            const updatedHistory = [shareEvent, ...currentHistory].slice(0, 20);

            await updateDoc(metricsRef, {
                lastSharedAt: Timestamp.now(),
                totalShares: (currentMetrics.totalShares || 0) + 1,
                [`sharesByPlatform.${platform.toLowerCase()}`]:
                    ((currentMetrics.sharesByPlatform?.[platform.toLowerCase() as SocialPlatform] || 0) + 1),
                shareHistory: updatedHistory,
                updatedAt: Timestamp.now(),
            });
        }
    } catch (error) {
        console.error('Error tracking product share:', error);
        // Don't throw - tracking shouldn't break the user flow
    }
}

/**
 * Fetches metrics for a single product
 */
export async function getProductMetrics(
    storeId: string,
    productId: string
): Promise<ProductMetrics | null> {
    try {
        const metricsRef = doc(db, 'productMetrics', `${storeId}_${productId}`);
        const metricsSnap = await getDoc(metricsRef);

        if (!metricsSnap.exists()) {
            return null;
        }

        return metricsSnap.data() as ProductMetrics;
    } catch (error) {
        console.error('Error fetching product metrics:', error);
        return null;
    }
}

/**
 * Fetches metrics for all products in a store (batch)
 * Returns a Map for O(1) lookup
 */
export async function getBatchProductMetrics(
    storeId: string,
    productIds: string[]
): Promise<Map<string, ProductMetrics>> {
    const metricsMap = new Map<string, ProductMetrics>();

    if (productIds.length === 0) return metricsMap;

    try {
        // Firestore 'in' queries support max 10 items, so we need to batch
        const BATCH_SIZE = 10;
        const batches: string[][] = [];

        for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
            batches.push(productIds.slice(i, i + BATCH_SIZE));
        }

        const allPromises = batches.map(async (batch) => {
            const ids = batch.map(id => `${storeId}_${id}`);
            const q = query(
                collection(db, 'productMetrics'),
                where('__name__', 'in', ids)
            );
            const querySnap = await getDocs(q);
            querySnap.forEach(doc => {
                const metrics = doc.data() as ProductMetrics;
                metricsMap.set(metrics.productId, metrics);
            });
        });

        await Promise.all(allPromises);

        return metricsMap;
    } catch (error) {
        console.error('Error fetching batch product metrics:', error);
        return metricsMap;
    }
}
