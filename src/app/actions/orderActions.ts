'use server';

import { db } from '@/lib/db';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { Order } from '@/hooks/useOrders';

// The Order type for Firestore will use a Timestamp
interface FirestoreOrderData {
  product: Product;
  storeMeta: StoreMeta;
  orderDate: Timestamp;
  customerId: string;
  quantity: number;
}

/**
 * Adds a new order to a customer's subcollection in Firestore.
 */
export const addOrderToFirestore = async (
  customerId: string,
  product: Product,
  storeMeta: StoreMeta,
  quantity: number
): Promise<Order> => {
  try {
    const ordersRef = collection(db, 'customers', customerId, 'orders');
    const newOrderData: Omit<FirestoreOrderData, 'orderDate'> & { orderDate: any } = {
      product,
      storeMeta,
      orderDate: Timestamp.now(), // Use Firestore Timestamp
      customerId: customerId, // For collection group queries
      quantity,
    };

    const docRef = await addDoc(ordersRef, newOrderData);
    
    return {
      ...newOrderData,
      id: docRef.id,
      orderDate: newOrderData.orderDate.toDate().toISOString(), // Convert to ISO string for client
    } as Order;

  } catch (error) {
    console.error("Error adding order to Firestore:", error);
    throw new Error("Failed to place order.");
  }
};

/**
 * Fetches all orders for a specific customer from Firestore.
 */
export const fetchOrdersFromFirestore = async (customerId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'customers', customerId, 'orders');
    const q = query(ordersRef, orderBy('orderDate', 'desc'));
    const querySnapshot = await getDocs(q);

    const orders: Order[] = querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreOrderData;
      return {
        id: doc.id,
        product: data.product,
        storeMeta: data.storeMeta,
        orderDate: data.orderDate.toDate().toISOString(), // Convert Timestamp to ISO string
        quantity: data.quantity || 1, // Default to 1 if quantity is not set
      };
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders from Firestore:", error);
    throw new Error("Failed to fetch orders.");
  }
};
