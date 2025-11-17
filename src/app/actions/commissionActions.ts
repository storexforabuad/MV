'use server';

import { db } from '@/lib/db';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// --- SELF-CONTAINED TYPE DEFINITIONS ---
// This removes the need to import from other action files, making this module more robust.

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    quantity: number;
    commission?: number; // Commission is optional
    status: string;
}

interface CustomerInfo {
    name: string;
}

interface SimpleStoreOrder {
    id: string;
    orderDate: string;
    products: Product[];
    customerInfo: CustomerInfo;
}

interface CommissionEvent {
    orderId: string;
    customerName: string;
    commissionAmount: number;
    date: string;
}

export interface CommissionAnalyticsData {
    totalCommission: number;
    commissionHistory: CommissionEvent[];
}

// --- ROBUST DATA TRANSFORMATION ---

const transformSafeOrderData = (doc: any): SimpleStoreOrder | null => {
    try {
        const data = doc.data();
        if (!data) return null;

        const products = Array.isArray(data.products) ? data.products : [];
        
        let orderDate = new Date(); // Default to now
        if (data.orderDate && data.orderDate instanceof Timestamp) {
            orderDate = data.orderDate.toDate();
        }

        return {
            id: doc.id,
            products: products,
            orderDate: orderDate.toISOString(),
            customerInfo: data.customerInfo && typeof data.customerInfo.name === 'string' 
                ? { name: data.customerInfo.name } 
                : { name: 'Unknown Customer' },
        };
    } catch (error) {
        console.error(`Failed to transform order doc ${doc.id}:`, error);
        return null; // Return null if a single document fails to transform
    }
};

// --- SERVER ACTION ---

export const getCommissionAnalytics = async (storeId: string): Promise<CommissionAnalyticsData> => {
    if (!storeId) {
        console.error("getCommissionAnalytics called without a storeId.");
        return { totalCommission: 0, commissionHistory: [] };
    }

    try {
        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const q = query(ordersRef, where('orderStatus', '==', 'ready'), orderBy('orderDate', 'desc'));
        const querySnapshot = await getDocs(q);

        let totalCommission = 0;
        const commissionHistory: CommissionEvent[] = [];

        querySnapshot.docs.forEach(doc => {
            const order = transformSafeOrderData(doc);
            if (!order) return; // Skip malformed orders

            let commissionForThisOrder = 0;
            order.products.forEach(product => {
                const price = product.price ?? 0;
                const commissionRate = product.commission ?? 0;
                if (price > 0 && commissionRate > 0) {
                    commissionForThisOrder += (price * commissionRate) / 100;
                }
            });

            if (commissionForThisOrder > 0) {
                totalCommission += commissionForThisOrder;
                if (commissionHistory.length < 10) {
                    commissionHistory.push({
                        orderId: order.id,
                        customerName: order.customerInfo.name,
                        commissionAmount: commissionForThisOrder,
                        date: order.orderDate,
                    });
                }
            }
        });

        return {
            totalCommission,
            commissionHistory,
        };

    } catch (error) {
        console.error("Error fetching commission analytics:", error);
        // This will be caught by Next.js and shown to the user. 
        // The root cause is likely a missing Firestore index.
        throw new Error("Failed to fetch commission analytics. A database index might be required.");
    }
};