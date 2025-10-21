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
} from 'firebase/firestore';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { Customer, DeliveryAddress } from '@/types/customer';
import { Order } from '@/hooks/useOrders';

// Interface for the data stored in the CUSTOMER's order subcollection
interface CustomerOrderData {
  product: Product;
  storeMeta: StoreMeta;
  orderDate: Timestamp;
  customerId: string;
  quantity: number;
}

// Interface for the detailed data stored in the STORE's order subcollection
interface StoreOrderData extends CustomerOrderData {
  customerInfo: {
    id: string;
    name: string;
    phoneNumber: string;
    deliveryAddress: DeliveryAddress;
  };
  referralApplied?: boolean; // <-- ADD THIS
}

// Type for the detailed order object returned to the ADMIN client
export interface StoreOrder extends Order {
    customerInfo: {
        id: string;
        name: string;
        phoneNumber: string;
        deliveryAddress: DeliveryAddress;
    }
    referralApplied?: boolean; // <-- AND ADD THIS
}

/**
 * Adds a new order to both the customer's subcollection and the store's central order collection.
 * This uses a batch write to ensure the operation is atomic.
 */
export const addOrderToFirestore = async (
  customerId: string,
  product: Product,
  storeMeta: StoreMeta,
  quantity: number,
  customer: Customer,
  referralCode: string | null,
  bonusApplied: boolean = false,
): Promise<Order> => {
  try {
    const storeId = storeMeta.id;
    if (!storeId) {
      throw new Error("Store ID is missing from store metadata.");
    }

    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
      throw new Error("Customer not found.");
    }
    const customerData = customerSnap.data() as Customer;

    const orderDate = Timestamp.now();
    const newOrderId = doc(collection(db, 'dummy')).id;

    const batch = writeBatch(db);
    let referralWasApplied = false; // <-- Track if referral was applied

    // --- New Referral Logic ---
    if (referralCode) {
      const referrersQuery = query(collection(db, 'customers'), where("referralCode", "==", referralCode), limit(1));
      const referrerSnap = await getDocs(referrersQuery);
      
      if (!referrerSnap.empty) {
        const referrerDoc = referrerSnap.docs[0];
        const referrerId = referrerDoc.id;

        const customerOrdersQuery = query(collection(db, 'customers', customerId, 'orders'), limit(1));
        const customerOrdersSnap = await getDocs(customerOrdersQuery);

        if (referrerId !== customerId && customerOrdersSnap.empty && product.commission && product.commission > 0) {
          referralWasApplied = true; // <-- Mark referral as applied
          const commissionValue = (product.price * product.commission) / 100;
          const commissionEarned = commissionValue * 0.5;
          const referrerRef = doc(db, 'customers', referrerId);

          // 1. Update the summary map on the customer document
          batch.update(referrerRef, {
            [`referralDataByStore.${storeId}.commissionEarned`]: increment(commissionEarned),
            [`referralDataByStore.${storeId}.referralCount`]: increment(1)
          });

          // 2. Create a detailed record in the general referrals subcollection for the list view
          const newReferralHistoryRef = doc(db, 'customers', referrerId, 'referrals', newOrderId);
          batch.set(newReferralHistoryRef, {
            refereeId: customerId,
            refereeName: customer.name,
            productName: product.name,
            commissionEarned: commissionEarned,
            orderDate: orderDate,
            storeId: storeId, // Include the storeId for filtering on the frontend
          });
        }
      }
    }

    if (bonusApplied) {
        batch.update(customerRef, { totalReferralCommission: 0 });
    }

    const customerOrderPayload: CustomerOrderData = {
      product,
      storeMeta,
      orderDate,
      customerId,
      quantity,
    };

    const storeOrderPayload: StoreOrderData = {
      ...customerOrderPayload,
      customerInfo: {
        id: customerId,
        name: customerData.name,
        phoneNumber: customerData.phoneNumber,
        deliveryAddress: customerData.deliveryAddress,
      },
      ...(referralWasApplied && { referralApplied: true }), // <-- Conditionally add the flag
    };

    const customerOrderRef = doc(db, 'customers', customerId, 'orders', newOrderId);
    batch.set(customerOrderRef, customerOrderPayload);

    const storeOrderRef = doc(db, 'stores', storeId, 'orders', newOrderId);
    batch.set(storeOrderRef, storeOrderPayload);

    await batch.commit();

    return {
      id: newOrderId,
      product,
      storeMeta,
      orderDate: orderDate.toDate().toISOString(),
      quantity,
    };

  } catch (error) {
    console.error("FATAL: Error adding order to Firestore:", JSON.stringify(error, null, 2));
    throw new Error("Failed to place order.");
  }
};

/**
 * Fetches orders for a specific customer from Firestore.
 * If a storeId is provided, it filters orders for that specific store.
 * Otherwise, it fetches all orders for the customer.
 */
export const fetchOrdersFromFirestore = async (customerId: string, storeId?: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'customers', customerId, 'orders');
    const q = query(ordersRef, orderBy('orderDate', 'desc'));
    const querySnapshot = await getDocs(q);

    let orders: Order[] = querySnapshot.docs.map(doc => {
      const data = doc.data() as CustomerOrderData;
      return {
        id: doc.id,
        product: data.product,
        storeMeta: data.storeMeta,
        orderDate: data.orderDate.toDate().toISOString(),
        quantity: data.quantity || 1,
      };
    });

    if (storeId) {
      orders = orders.filter(order => order.storeMeta.id === storeId);
    }

    return orders;
  } catch (error) {
    console.error("Error fetching orders from Firestore:", error);
    throw new Error("Failed to fetch orders.");
  }
};


/**
 * Fetches all orders for a specific store from the central collection in Firestore.
 */
export const fetchStoreOrders = async (storeId: string): Promise<StoreOrder[]> => {
  try {
    const ordersRef = collection(db, 'stores', storeId, 'orders');
    const q = query(ordersRef, orderBy('orderDate', 'desc'));
    const querySnapshot = await getDocs(q);

    const orders: StoreOrder[] = querySnapshot.docs.map(doc => {
      const data = doc.data() as StoreOrderData;
      return {
        id: doc.id,
        product: data.product,
        storeMeta: data.storeMeta,
        orderDate: data.orderDate.toDate().toISOString(),
        quantity: data.quantity || 1,
        customerInfo: data.customerInfo,
        referralApplied: data.referralApplied, // <-- Pass the flag
      };
    });

    return orders;
  } catch (error) {
    console.error("Error fetching store orders from Firestore:", error);
    throw new Error("Failed to fetch store orders.");
  }
};

/**
 * Increments the total order count for a given store.
 * This is a simple atomic update.
 */
export const incrementOrderCount = async (storeId: string, incrementValue: number) => {
  if (!storeId || typeof incrementValue !== 'number') {
    console.error('Invalid arguments for incrementOrderCount');
    return;
  }
  try {
    const storeRef = doc(db, 'stores', storeId);
    const batch = writeBatch(db);
    batch.update(storeRef, { totalOrders: increment(incrementValue) });
    await batch.commit();
  } catch (error) {
    console.error('Error incrementing order count:', error);
    // Decide on error handling strategy, e.g., silent fail or re-throw
  }
};

/**
 * Calculates the total commission earned and referral bonuses for a given store.
 */
export const calculateStoreCommissions = async (storeId: string): Promise<{ totalCommissionEarned: number, totalReferralBonus: number }> => {
    try {
        const orders = await fetchStoreOrders(storeId);
        let totalCommissionEarned = 0;
        let totalReferralBonus = 0;

        for (const order of orders) {
            if (order.product && order.product.commission && typeof order.product.price === 'number') {
                const commission = (order.product.price * order.product.commission) / 100;
                totalCommissionEarned += commission;

                // A referral bonus is 50% of the product commission
                if (order.referralApplied) {
                    totalReferralBonus += commission * 0.5;
                }
            }
        }

        return { totalCommissionEarned, totalReferralBonus };

    } catch (error) {
        console.error("Error calculating store commissions:", error);
        // In case of an error, return zero values to prevent the app from crashing.
        return { totalCommissionEarned: 0, totalReferralBonus: 0 };
    }
};
