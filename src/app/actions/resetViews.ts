'use server';

import { db } from '@/lib/db';
import { collection, getDocs, updateDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';

/**
 * Resets all view counts for a specific store
 * This will:
 * 1. Set all product views to 0
 * 2. Set store totalViews to 0
 * 3. Delete all dailyMetrics documents
 */
export async function resetStoreViews(storeId: string) {
    try {
        console.log(`Starting view reset for store: ${storeId}`);

        // 1. Reset all product views to 0
        const productsRef = collection(db, 'stores', storeId, 'products');
        const productsSnapshot = await getDocs(productsRef);

        console.log(`Found ${productsSnapshot.size} products to update`);

        // Use batched writes for efficiency (max 500 per batch)
        const batches = [];
        let batch = writeBatch(db);
        let operationCount = 0;

        for (const productDoc of productsSnapshot.docs) {
            batch.update(productDoc.ref, { views: 0 });
            operationCount++;

            // Firestore limit is 500 operations per batch
            if (operationCount === 500) {
                batches.push(batch);
                batch = writeBatch(db);
                operationCount = 0;
            }
        }

        // Add the last batch if it has operations
        if (operationCount > 0) {
            batches.push(batch);
        }

        // Commit all batches
        console.log(`Committing ${batches.length} batch(es) for products...`);
        await Promise.all(batches.map(b => b.commit()));
        console.log('✓ All product views reset to 0');

        // 2. Reset store totalViews
        const storeRef = doc(db, 'stores', storeId);
        await updateDoc(storeRef, { totalViews: 0 });
        console.log('✓ Store totalViews reset to 0');

        // 3. Delete all dailyMetrics documents
        const metricsRef = collection(db, 'stores', storeId, 'dailyMetrics');
        const metricsSnapshot = await getDocs(metricsRef);

        console.log(`Found ${metricsSnapshot.size} dailyMetrics documents to delete`);

        // Batch delete dailyMetrics
        const deleteBatches = [];
        let deleteBatch = writeBatch(db);
        let deleteCount = 0;

        for (const metricDoc of metricsSnapshot.docs) {
            deleteBatch.delete(metricDoc.ref);
            deleteCount++;

            if (deleteCount === 500) {
                deleteBatches.push(deleteBatch);
                deleteBatch = writeBatch(db);
                deleteCount = 0;
            }
        }

        if (deleteCount > 0) {
            deleteBatches.push(deleteBatch);
        }

        console.log(`Committing ${deleteBatches.length} batch(es) for dailyMetrics deletion...`);
        await Promise.all(deleteBatches.map(b => b.commit()));
        console.log('✓ All dailyMetrics deleted');

        console.log(`\n✅ View reset complete for store: ${storeId}`);
        console.log(`   - ${productsSnapshot.size} products updated`);
        console.log(`   - Store totalViews reset`);
        console.log(`   - ${metricsSnapshot.size} dailyMetrics deleted`);

        return {
            success: true,
            productsUpdated: productsSnapshot.size,
            metricsDeleted: metricsSnapshot.size
        };

    } catch (error) {
        console.error('Error resetting store views:', error);
        throw new Error('Failed to reset store views');
    }
}
