'use server';

import { db } from '@/lib/db';
import { collection, getDocs, writeBatch, doc, query, updateDoc } from 'firebase/firestore';

/**
 * Clears all orders for a specific store
 * This will:
 * 1. Delete all orders from the store's orders collection
 * 2. Delete all orders from each customer's orders collection where the order is from this store
 * 3. Reset store's totalOrders and totalRevenue
 */
export async function clearStoreOrders(storeId: string) {
    try {
        console.log(`Starting order deletion for store: ${storeId}`);

        // 1. Get and delete all orders from store's collection
        const storeOrdersRef = collection(db, 'stores', storeId, 'orders');
        const storeOrdersSnapshot = await getDocs(storeOrdersRef);

        console.log(`Found ${storeOrdersSnapshot.size} orders in store collection`);

        // Track customer IDs to clean up their orders too
        const customerOrderIds: { customerId: string, orderId: string }[] = [];

        storeOrdersSnapshot.docs.forEach(orderDoc => {
            const orderData = orderDoc.data();
            if (orderData.customerId) {
                customerOrderIds.push({
                    customerId: orderData.customerId,
                    orderId: orderDoc.id
                });
            }
        });

        // Delete store orders in batches
        const storeBatches = [];
        let storeBatch = writeBatch(db);
        let storeOpCount = 0;

        for (const orderDoc of storeOrdersSnapshot.docs) {
            storeBatch.delete(orderDoc.ref);
            storeOpCount++;

            if (storeOpCount === 500) {
                storeBatches.push(storeBatch);
                storeBatch = writeBatch(db);
                storeOpCount = 0;
            }
        }

        if (storeOpCount > 0) {
            storeBatches.push(storeBatch);
        }

        console.log(`Committing ${storeBatches.length} batch(es) for store orders...`);
        await Promise.all(storeBatches.map(b => b.commit()));
        console.log('✓ All store orders deleted');

        // 2. Delete corresponding customer orders
        const customerBatches = [];
        let customerBatch = writeBatch(db);
        let customerOpCount = 0;

        for (const { customerId, orderId } of customerOrderIds) {
            const customerOrderRef = doc(db, 'customers', customerId, 'orders', orderId);
            customerBatch.delete(customerOrderRef);
            customerOpCount++;

            if (customerOpCount === 500) {
                customerBatches.push(customerBatch);
                customerBatch = writeBatch(db);
                customerOpCount = 0;
            }
        }

        if (customerOpCount > 0) {
            customerBatches.push(customerBatch);
        }

        console.log(`Committing ${customerBatches.length} batch(es) for customer orders...`);
        await Promise.all(customerBatches.map(b => b.commit()));
        console.log('✓ All customer orders deleted');

        // 3. Reset store stats
        const storeRef = doc(db, 'stores', storeId);
        await updateDoc(storeRef, {
            totalOrders: 0,
            totalRevenue: 0
        });
        console.log('✓ Store stats reset');

        console.log(`\n✅ Order deletion complete for store: ${storeId}`);
        console.log(`   - ${storeOrdersSnapshot.size} store orders deleted`);
        console.log(`   - ${customerOrderIds.length} customer orders deleted`);

        return {
            success: true,
            storeOrdersDeleted: storeOrdersSnapshot.size,
            customerOrdersDeleted: customerOrderIds.length
        };

    } catch (error) {
        console.error('Error clearing store orders:', error);
        throw new Error('Failed to clear store orders');
    }
}

/**
 * Clears ALL orders from ALL customers on the platform
 * WARNING: This is a destructive operation!
 */
export async function clearAllCustomerOrders() {
    try {
        console.log('Starting deletion of ALL customer orders...');

        // Get all customers
        const customersRef = collection(db, 'customers');
        const customersSnapshot = await getDocs(customersRef);

        console.log(`Found ${customersSnapshot.size} customers`);

        let totalOrdersDeleted = 0;

        // For each customer, delete all their orders
        for (const customerDoc of customersSnapshot.docs) {
            const customerOrdersRef = collection(db, 'customers', customerDoc.id, 'orders');
            const customerOrdersSnapshot = await getDocs(customerOrdersRef);

            if (customerOrdersSnapshot.size === 0) continue;

            console.log(`Deleting ${customerOrdersSnapshot.size} orders for customer ${customerDoc.id}`);

            // Delete in batches
            const batches = [];
            let batch = writeBatch(db);
            let opCount = 0;

            for (const orderDoc of customerOrdersSnapshot.docs) {
                batch.delete(orderDoc.ref);
                opCount++;
                totalOrdersDeleted++;

                if (opCount === 500) {
                    batches.push(batch);
                    batch = writeBatch(db);
                    opCount = 0;
                }
            }

            if (opCount > 0) {
                batches.push(batch);
            }

            await Promise.all(batches.map(b => b.commit()));
        }

        console.log(`\n✅ All customer orders deleted`);
        console.log(`   - ${totalOrdersDeleted} total orders deleted across ${customersSnapshot.size} customers`);

        return {
            success: true,
            customersProcessed: customersSnapshot.size,
            totalOrdersDeleted
        };

    } catch (error) {
        console.error('Error clearing all customer orders:', error);
        throw new Error('Failed to clear all customer orders');
    }
}
