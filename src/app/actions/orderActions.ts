'use server';

import { db } from '@/lib/db';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  writeBatch,
  where,
  limit,
  increment
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
}

// Type for the detailed order object returned to the ADMIN client
export interface StoreOrder extends Order {
    customerInfo: {
        id: string;
        name: string;
        phoneNumber: string;
        deliveryAddress: DeliveryAddress;
    }
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
): Promise<Order> => {
  try {
    const storeId = storeMeta.id;
    if (!storeId) {
      throw new Error("Store ID is missing from store metadata.");
    }

    // 1. Fetch the full customer object to get their details.
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
      throw new Error("Customer not found.");
    }
    const customerData = customerSnap.data() as Customer;

    // 2. Prepare the data for the atomic batch write.
    const orderDate = Timestamp.now();
    const newOrderId = doc(collection(db, 'dummy')).id; // Generate a unique ID for the order

    const batch = writeBatch(db);

    // Referral Logic
    if (referralCode) {
      const referrersQuery = query(collection(db, 'customers'), where("referralCode", "==", referralCode), limit(1));
      const referrerSnap = await getDocs(referrersQuery);
      
      if (!referrerSnap.empty) {
        const referrerDoc = referrerSnap.docs[0];
        const referrerId = referrerDoc.id;

        const customerOrdersQuery = query(collection(db, 'customers', customerId, 'orders'), limit(1));
        const customerOrdersSnap = await getDocs(customerOrdersQuery);

        if (referrerId !== customerId && customerOrdersSnap.empty && product.commission && product.commission > 0) {
          const commissionEarned = product.commission * 0.5;
          const referrerRef = doc(db, 'customers', referrerId);
          const newReferralRef = doc(collection(db, 'customers', referrerId, 'referrals'));

          batch.update(referrerRef, {
            totalReferralCommission: increment(commissionEarned),
            successfulReferralCount: increment(1)
          });

          batch.set(newReferralRef, {
            refereeId: customerId,
            refereeName: customer.name,
            orderId: newOrderId,
            productId: product.id,
            productName: product.name,
            commissionEarned: commissionEarned,
            orderDate: orderDate,
            storeId: storeId
          });
        }
      }
    }

    // a. Data for the customer's personal order history
    const customerOrderPayload: CustomerOrderData = {
      product,
      storeMeta,
      orderDate,
      customerId,
      quantity,
    };

    // b. Enriched data for the store's central order collection
    const storeOrderPayload: StoreOrderData = {
      ...customerOrderPayload,
      customerInfo: {
        id: customerId,
        name: customerData.name,
        phoneNumber: customerData.phoneNumber,
        deliveryAddress: customerData.deliveryAddress,
      },
    };

    // 3. Execute the atomic batch write.
    const customerOrderRef = doc(db, 'customers', customerId, 'orders', newOrderId);
    batch.set(customerOrderRef, customerOrderPayload);

    const storeOrderRef = doc(db, 'stores', storeId, 'orders', newOrderId);
    batch.set(storeOrderRef, storeOrderPayload);

    await batch.commit();

    // 4. Return the same basic Order object to the client to avoid breaking existing functionality.
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
 * Fetches all orders for a specific customer from Firestore.
 * (This function remains unchanged and continues to power the customer dashboard.)
 */
export const fetchOrdersFromFirestore = async (customerId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'customers', customerId, 'orders');
    const q = query(ordersRef, orderBy('orderDate', 'desc'));
    const querySnapshot = await getDocs(q);

    const orders: Order[] = querySnapshot.docs.map(doc => {
      const data = doc.data() as CustomerOrderData;
      return {
        id: doc.id,
        product: data.product,
        storeMeta: data.storeMeta,
        orderDate: data.orderDate.toDate().toISOString(),
        quantity: data.quantity || 1,
      };
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders from Firestore:", error);
    throw new Error("Failed to fetch orders.");
  }
};


/**
 * Fetches all orders for a specific store from the central collection in Firestore.
 * (This is the new function to power the admin dashboard.)
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
      };
    });

    return orders;
  } catch (error) {
    console.error("Error fetching store orders from Firestore:", error);
    throw new Error("Failed to fetch store orders.");
  }
};
