'use server';

import { db } from '@/lib/db';
import {
    collection,
    getDocs,
    query,
    orderBy,
    Timestamp,
    doc,
    getDoc,
    writeBatch,
    where,
    limit,
    increment,
    updateDoc,
} from 'firebase/firestore';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { Customer, DeliveryAddress } from '@/types/customer';
import { sendVendorNotification } from './sendVendorNotification';
import { sendCustomerNotification } from './sendCustomerNotification';

// Base type for orders returned to the client.
export interface Order {
    id: string;
    products: Product[]; // Now supports multiple products
    storeMeta: StoreMeta;
    orderDate: string; // ISO string
    orderStatus: 'processing' | 'partially-ready' | 'ready' | 'shipped';
    orderNotes?: string;
    // Payment-related fields (currently for restaurant orders only, expandable to other store types)
    paymentEvidenceUrl?: string; // Cloudinary URL of payment proof - latest upload only
    paymentStatus?: 'pending' | 'submitted'; // pending: no evidence yet, submitted: customer uploaded evidence
    paymentEvidenceUploadedAt?: string; // ISO string - for TTL cleanup tracking (30 days)
    paymentEvidenceFileName?: string; // Original filename for reference
    deliveryMethod?: 'home' | 'pickup';
}

// Type for the detailed order object returned to the ADMIN client.
export interface StoreOrder extends Order {
    customerInfo: {
        id: string;
        name: string;
        phoneNumber: string;
        deliveryAddress: DeliveryAddress;
    }
    referralApplied?: boolean;
}

// Interface for individual products within an order in Firestore.
type OrderProduct = Product & {
    status: 'processing' | 'ready' | 'shipped';
};

// Interface for the complete order data as stored in Firestore.
interface FirestoreOrderData {
    products: OrderProduct[];
    storeMeta: StoreMeta;
    orderDate: Timestamp;
    customerId: string;
    orderStatus: 'processing' | 'partially-ready' | 'ready' | 'shipped';
    deliveryMethod: 'home' | 'pickup';
    customerInfo: {
        id: string;
        name: string;
        phoneNumber: string;
        deliveryAddress: DeliveryAddress;
    };
    referralApplied?: boolean;
    orderNotes?: string;
    // Payment-related fields (restaurant orders, expandable to other types)
    paymentEvidenceUrl?: string;
    paymentStatus?: 'pending' | 'submitted';
    paymentEvidenceUploadedAt?: Timestamp;
    paymentEvidenceFileName?: string;
    ttl?: number; // Unix timestamp in seconds - Firestore TTL for auto-cleanup after 30 days
}

/**
 * Adds a new order to Firestore, creating it in both the customer's and store's collections atomically.
 */
export const addOrderToFirestore = async (
    customerId: string,
    products: Product[],
    storeMeta: StoreMeta,
    customer: Customer,
    referralCode: string | null,
    bonusApplied: boolean = false,
    deliveryMethod: 'home' | 'pickup' = 'home',
    orderNotes?: string,
    paymentEvidenceUrl?: string,
    paymentEvidenceFileName?: string
): Promise<Order> => {
    try {
        const storeId = storeMeta.id;
        if (!storeId) throw new Error("Store ID is missing.");

        // Check if store is open (for restaurants)
        if (storeMeta.storeType === 'restaurant' && storeMeta.isOpen === false) {
            throw new Error("This store is currently closed.");
        }

        const customerRef = doc(db, 'customers', customerId);
        const customerSnap = await getDoc(customerRef);
        if (!customerSnap.exists()) throw new Error("Customer not found.");
        const customerData = customerSnap.data() as Customer;

        const orderDate = Timestamp.now();
        const newOrderId = doc(collection(db, 'dummy')).id;
        const batch = writeBatch(db);
        let referralWasApplied = false;

        if (referralCode) {
            const firstEligibleProduct = products.find(p => p.commission && p.commission > 0);
            if (firstEligibleProduct) {
                const referrersQuery = query(collection(db, 'customers'), where("referralCode", "==", referralCode), limit(1));
                const referrerSnap = await getDocs(referrersQuery);

                if (!referrerSnap.empty) {
                    const referrerDoc = referrerSnap.docs[0];
                    const referrerId = referrerDoc.id;
                    const customerOrdersQuery = query(collection(db, 'customers', customerId, 'orders'), limit(1));
                    const customerOrdersSnap = await getDocs(customerOrdersQuery);

                    if (referrerId !== customerId && customerOrdersSnap.empty) {
                        referralWasApplied = true;
                        const commissionValue = (firstEligibleProduct.price * firstEligibleProduct.commission!) / 100;
                        const referrerRef = doc(db, 'customers', referrerId);
                        batch.update(referrerRef, {
                            [`referralDataByStore.${storeId}.commissionEarned`]: increment(commissionValue),
                            [`referralDataByStore.${storeId}.referralCount`]: increment(1)
                        });
                        const newReferralHistoryRef = doc(db, 'customers', referrerId, 'referrals', newOrderId);
                        batch.set(newReferralHistoryRef, {
                            refereeId: customerId,
                            refereeName: customer.name,
                            productName: firstEligibleProduct.name,
                            commissionEarned: commissionValue,
                            orderDate: orderDate,
                            storeId: storeId,
                        });
                    }
                }
            }
        }

        if (bonusApplied) {
            batch.update(customerRef, { totalReferralCommission: 0 });
        }

        const productsWithStatus: OrderProduct[] = products.map(p => ({ ...p, status: 'processing' }));

        const orderPayload: FirestoreOrderData = {
            products: productsWithStatus,
            storeMeta,
            orderDate,
            customerId,
            orderStatus: 'processing',
            deliveryMethod,
            customerInfo: {
                id: customerId,
                name: customerData.name,
                phoneNumber: customerData.phoneNumber,
                deliveryAddress: customerData.deliveryAddress,
            },
            ...(referralWasApplied && { referralApplied: true }),
            ...(orderNotes && { orderNotes }),
            // Payment fields (for restaurant orders with payment evidence)
            ...(paymentEvidenceUrl && {
                paymentEvidenceUrl,
                paymentStatus: 'submitted' as const,
                paymentEvidenceUploadedAt: orderDate,
                paymentEvidenceFileName,
                ttl: Math.floor(orderDate.toMillis() / 1000) + 2592000, // 30 days in seconds
            }),
            ...(!paymentEvidenceUrl && storeMeta.storeType === 'restaurant' && {
                paymentStatus: 'pending' as const,
            }),
        };

        const customerOrderRef = doc(db, 'customers', customerId, 'orders', newOrderId);
        batch.set(customerOrderRef, orderPayload);

        const storeOrderRef = doc(db, 'stores', storeId, 'orders', newOrderId);
        batch.set(storeOrderRef, orderPayload);

        const totalCommissionFromSale = products.reduce((acc, p) => acc + (p.commission ? (p.price * p.commission) / 100 : 0), 0);
        const storeRef = doc(db, 'stores', storeId);
        batch.update(storeRef, {
            totalOrders: increment(1),
            totalCommissionEarned: increment(totalCommissionFromSale)
        });

        await batch.commit();

        // Send push notification to vendor (fail-safe: errors won't break order placement)
        sendVendorNotification(storeId, newOrderId, customerData.name).catch(err =>
            console.error('Failed to send vendor notification:', err)
        );

        return {
            id: newOrderId,
            products,
            storeMeta,
            orderDate: orderDate.toDate().toISOString(),
            orderStatus: 'processing',
            ...(paymentEvidenceUrl && {
                paymentEvidenceUrl,
                paymentStatus: 'submitted' as const,
                paymentEvidenceUploadedAt: orderDate.toDate().toISOString(),
                paymentEvidenceFileName,
            }),
            ...(!paymentEvidenceUrl && storeMeta.storeType === 'restaurant' && {
                paymentStatus: 'pending' as const,
            }),
        };

    } catch (error) {
        console.error("FATAL: Error adding order to Firestore:", JSON.stringify(error, null, 2));
        throw new Error("Failed to place order.");
    }
};

/**
 * Fetches a single order by ID from both store and customer collections.
 */
export const getOrderById = async (storeId: string, orderId: string): Promise<StoreOrder | null> => {
    try {
        const orderRef = doc(db, 'stores', storeId, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            return transformOrderData(orderSnap);
        }
        return null;
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        throw new Error("Failed to fetch order.");
    }
};

/**
 * Updates the status of products within an order and the overall order status.
 * This function now also records revenue when an order becomes 'ready'.
 */
export const updateOrderStatus = async (storeId: string, orderId: string, productIds: string[]): Promise<void> => {
    const orderRef = doc(db, 'stores', storeId, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) throw new Error("Order not found.");

    const orderData = orderSnap.data() as any;
    const previousStatus = orderData.orderStatus || 'processing';

    const currentProducts = orderData.products || (orderData.product ? [{ ...orderData.product, quantity: orderData.quantity || 1 }] : []);

    const updatedProducts = currentProducts.map((product: any) => {
        if (productIds.includes(product.id)) {
            return { ...product, status: 'ready' as const };
        }
        return product;
    });

    const allReady = updatedProducts.every((p: any) => p.status === 'ready');
    const someReady = updatedProducts.some((p: any) => p.status === 'ready');

    let newOrderStatus: Order['orderStatus'] = 'processing';
    if (allReady) newOrderStatus = 'ready';
    else if (someReady) newOrderStatus = 'partially-ready';

    // --- Revenue Recognition Logic ---
    if (newOrderStatus === 'ready' && previousStatus !== 'ready') {
        try {
            const batch = writeBatch(db);

            // 1. Calculate total revenue for this order
            const orderTotal = updatedProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

            // 2. Update the main store document
            const storeRef = doc(db, 'stores', storeId);
            batch.update(storeRef, { totalRevenue: increment(orderTotal) });

            // 3. Update the dailyMetrics subcollection
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const metricRef = doc(db, 'stores', storeId, 'dailyMetrics', today);
            batch.set(metricRef, {
                date: today,
                totalRevenue: increment(orderTotal),
                ordersCompleted: increment(1)
            }, { merge: true });

            // 4. Update the order status itself
            batch.update(orderRef, { products: updatedProducts, orderStatus: newOrderStatus });

            // 5. Commit all changes atomically
            await batch.commit();

        } catch (error) {
            console.error("FATAL: Error recording revenue:", error);
            // If revenue recording fails, we still try to update the order status as a fallback.
            await updateDoc(orderRef, { products: updatedProducts, orderStatus: newOrderStatus });
        }
    } else {
        // If not recording revenue, just update the order status.
        await updateDoc(orderRef, { products: updatedProducts, orderStatus: newOrderStatus });
    }

    // Also update the customer's view of the order, if it exists.
    const customerOrderRef = doc(db, 'customers', orderData.customerId, 'orders', orderId);
    if ((await getDoc(customerOrderRef)).exists()) {
        await updateDoc(customerOrderRef, { products: updatedProducts, orderStatus: newOrderStatus });
    }

    // Send notification to customer (fail-safe)
    if (newOrderStatus === 'ready' || newOrderStatus === 'partially-ready') {
        const customerId = orderData.customerId;
        const storeName = orderData.storeMeta?.name || 'Store';
        sendCustomerNotification(customerId, orderId, storeName, newOrderStatus).catch(err =>
            console.error('Failed to send customer notification:', err)
        );
    }
};


// Helper to transform a Firestore document into a resilient, backward-compatible StoreOrder object.
const transformOrderData = (doc: any): StoreOrder => {
    const data = doc.data() as any;

    // --- Defensive Data Transformation --- 

    // 1. Products: Default to an empty array if missing or corrupt.
    // 1. Products: Default to an empty array if missing or corrupt.
    let rawProducts = data.products || (data.product ? [{ ...data.product, quantity: data.quantity || 1 }] : []);
    if (!Array.isArray(rawProducts)) {
        console.warn(`Corrupt 'products' field for order ${doc.id}. Falling back to empty array.`);
        rawProducts = [];
    }

    // Sanitize products to ensure no Timestamps remain
    const products = rawProducts.map((p: any) => {
        const sanitized = { ...p };
        // Convert known Timestamp fields
        if (sanitized.createdAt && typeof sanitized.createdAt.toDate === 'function') {
            sanitized.createdAt = sanitized.createdAt.toDate().toISOString();
        }
        // Defensive: Convert any other Timestamp values found at the top level of the product
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] && typeof sanitized[key] === 'object' && typeof sanitized[key].toDate === 'function') {
                sanitized[key] = sanitized[key].toDate().toISOString();
            }
        });
        return sanitized;
    });

    // 2. Order Date: Default to now, with robust parsing for multiple formats.
    let orderDateStr = new Date().toISOString();
    if (data.orderDate) {
        if (typeof data.orderDate.toDate === 'function') {
            orderDateStr = data.orderDate.toDate().toISOString();
        } else if (typeof data.orderDate === 'string') {
            let date = new Date(data.orderDate);
            if (isNaN(date.getTime())) {
                const cleanedDateStr = data.orderDate.replace(' at ', ' ');
                date = new Date(cleanedDateStr);
            }
            if (!isNaN(date.getTime())) {
                orderDateStr = date.toISOString();
            } else {
                console.warn(`Could not parse date for order ${doc.id}:`, data.orderDate);
            }
        }
    } else {
        console.warn(`Missing 'orderDate' for order ${doc.id}. Falling back to current time.`);
    }

    // 3. Customer Info: Default to a safe "Unknown" object if missing or corrupt.
    let customerInfo = data.customerInfo;
    if (typeof customerInfo !== 'object' || customerInfo === null) {
        console.warn(`Corrupt or missing 'customerInfo' for order ${doc.id}. Falling back to default.`);
        customerInfo = {
            id: 'unknown',
            name: 'Unknown Customer',
            phoneNumber: 'N/A',
            deliveryAddress: { street: 'N/A', state: 'N/A' },
        };
    }

    // 4. Store Meta: Default to a safe "Unknown" object if missing or corrupt.
    let storeMeta = data.storeMeta;
    if (typeof storeMeta !== 'object' || storeMeta === null) {
        console.warn(`Corrupt or missing 'storeMeta' for order ${doc.id}. Falling back to default.`);
        storeMeta = {
            id: 'unknown',
            name: 'Unknown Store',
            image: '',
            slug: ''
        };
    }

    return {
        id: doc.id,
        products: products,
        storeMeta: storeMeta,
        orderDate: orderDateStr,
        orderStatus: data.orderStatus || 'processing',
        customerInfo: customerInfo,
        referralApplied: data.referralApplied || false,
        orderNotes: data.orderNotes,
        // Payment fields - convert Timestamp if present
        paymentEvidenceUrl: data.paymentEvidenceUrl,
        paymentStatus: data.paymentStatus,
        paymentEvidenceFileName: data.paymentEvidenceFileName,
        paymentEvidenceUploadedAt: data.paymentEvidenceUploadedAt
            ? typeof data.paymentEvidenceUploadedAt.toDate === 'function'
                ? data.paymentEvidenceUploadedAt.toDate().toISOString()
                : data.paymentEvidenceUploadedAt
            : undefined,
        deliveryMethod: data.deliveryMethod || 'home',
    };
};

/**
 * Fetches all orders for a specific store, with manual sorting to prevent index errors.
 */
export const fetchStoreOrders = async (storeId: string): Promise<StoreOrder[]> => {
    try {
        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const q = query(ordersRef, orderBy('orderDate', 'desc'));
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(transformOrderData);
        orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        return orders;
    } catch (error) {
        console.error("Error fetching store orders from Firestore:", error);
        throw new Error("Failed to fetch store orders.");
    }
};

/**
 * Fetches ready/partially-ready orders, with manual sorting to prevent index errors.
 */
export const getReadyForDeliveryOrders = async (storeId: string): Promise<StoreOrder[]> => {
    try {
        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const q = query(ordersRef, where('orderStatus', 'in', ['ready', 'partially-ready']));
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(transformOrderData);
        orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        return orders;
    } catch (error) {
        console.error("Error fetching ready for delivery orders:", error);
        throw new Error("Failed to fetch ready orders.");
    }
}

/**
 * Fetches revenue analytics for the store, including lifetime revenue, 7-day history,
 * and top-earning products.
 */
export const getRevenueAnalytics = async (storeId: string) => {
    try {
        // --- Base Analytics (Lifetime & Historical) ---
        const storeRef = doc(db, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);
        const lifetimeRevenue = storeSnap.data()?.totalRevenue || 0;

        const metricsRef = collection(db, 'stores', storeId, 'dailyMetrics');
        const metricsQuery = query(metricsRef, orderBy("date", "desc"), limit(7));
        const metricsSnap = await getDocs(metricsQuery);
        const last7DaysOfData = metricsSnap.docs.map(d => d.data());

        const historicalData: { date: string; totalRevenue: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = last7DaysOfData.find(data => data.date === dateStr);
            historicalData.push({
                date: dateStr,
                totalRevenue: dayData?.totalRevenue || 0,
            });
        }

        // --- Top Earning Products & Bonus Analysis ---
        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const ordersQuery = query(ordersRef, where('orderStatus', '==', 'ready'));
        const ordersSnap = await getDocs(ordersQuery);

        const productRevenue: { [key: string]: { name: string; totalRevenue: number } } = {};
        let lifetimeBonus = 0;
        const dailyBonusMap: { [date: string]: number } = {};

        ordersSnap.forEach(orderDoc => {
            const order = orderDoc.data();

            // Calculate Bonus
            let orderBonus = 0;
            if (order.referralApplied && Array.isArray(order.products)) {
                order.products.forEach((product: Product) => {
                    if (product.commission && typeof product.price === 'number') {
                        orderBonus += (product.price * product.commission) / 100;
                    }
                });
            }
            lifetimeBonus += orderBonus;

            // Map Bonus to Date (for last 7 days)
            let orderDateStr = '';
            if (order.orderDate && typeof order.orderDate.toDate === 'function') {
                orderDateStr = order.orderDate.toDate().toISOString().split('T')[0];
            } else if (typeof order.orderDate === 'string') {
                orderDateStr = order.orderDate.split('T')[0];
            }

            if (orderDateStr) {
                if (!dailyBonusMap[orderDateStr]) dailyBonusMap[orderDateStr] = 0;
                dailyBonusMap[orderDateStr] += orderBonus;
            }

            // Product Revenue Logic
            if (Array.isArray(order.products)) {
                order.products.forEach((product: Product) => {
                    if (product.id && product.price) {
                        if (!productRevenue[product.id]) {
                            productRevenue[product.id] = { name: product.name, totalRevenue: 0 };
                        }
                        productRevenue[product.id].totalRevenue += product.price;
                    }
                });
            }
        });

        const topEarningProducts = Object.entries(productRevenue)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        // Merge Bonus into Historical Data
        const enrichedHistoricalData = historicalData.map(day => ({
            ...day,
            totalBonus: dailyBonusMap[day.date] || 0
        }));

        return {
            lifetimeRevenue,
            lifetimeBonus,
            historicalData: enrichedHistoricalData,
            topEarningProducts,
        };

    } catch (error) {
        console.error("Error fetching revenue analytics:", error);
        // Return safe defaults instead of throwing to avoid crashing server actions/pages
        return {
            lifetimeRevenue: 0,
            lifetimeBonus: 0,
            historicalData: [] as { date: string; totalRevenue: number; totalBonus?: number }[],
            topEarningProducts: [] as { id: string; name: string; totalRevenue: number }[],
        };
    }
};

/**
 * Acknowledges ready order notifications by adding them to the customer's acknowledgedOrderIds array.
 * @param customerId - The customer ID
 * @param orderIds - Array of order IDs to acknowledge
 */
export async function acknowledgeOrders(customerId: string, orderIds: string[]): Promise<void> {
    try {
        const customerRef = doc(db, 'customers', customerId);

        // Get current acknowledged orders
        const customerDoc = await getDoc(customerRef);
        const currentAcknowledgedIds = customerDoc.data()?.acknowledgedOrderIds || [];

        // Merge with new ones, avoiding duplicates
        const updatedAcknowledgedIds = Array.from(new Set([...currentAcknowledgedIds, ...orderIds]));

        // Update customer document
        await updateDoc(customerRef, {
            acknowledgedOrderIds: updatedAcknowledgedIds,
        });

        console.log(`✅ Orders acknowledged for customer ${customerId}:`, orderIds);
    } catch (error) {
        console.error('Error acknowledging orders:', error);
        throw error;
    }
}
