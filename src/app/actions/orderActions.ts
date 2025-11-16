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

// This is the base type for orders returned to the client.
// It now supports multiple products per order.
export interface Order {
    id: string;
    products: Product[]; // Changed from single product
    storeMeta: StoreMeta;
    orderDate: string; // ISO string
    orderStatus: 'processing' | 'partially-ready' | 'ready' | 'shipped';
}

// Type for the detailed order object returned to the ADMIN client
export interface StoreOrder extends Order {
    customerInfo: {
        id: string;
        name: string;
        phoneNumber: string;
        deliveryAddress: DeliveryAddress;
    }
    referralApplied?: boolean;
}

// Interface for the data as it is stored in Firestore.
// Products in this interface will have a status.
interface OrderProduct extends Product {
    status: 'processing' | 'ready' | 'shipped';
}

interface FirestoreOrderData {
  products: OrderProduct[];
  storeMeta: StoreMeta;
  orderDate: Timestamp;
  customerId: string;
  orderStatus: 'processing' | 'partially-ready' | 'ready' | 'shipped';
  customerInfo: {
    id: string;
    name: string;
    phoneNumber: string;
    deliveryAddress: DeliveryAddress;
  };
  referralApplied?: boolean;
}


/**
 * Adds a new order with multiple products to both the customer's subcollection and the store's central order collection.
 * This uses a batch write to ensure the operation is atomic.
 */
export const addOrderToFirestore = async (
  customerId: string,
  products: Product[], // Changed from a single product
  storeMeta: StoreMeta,
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
    let referralWasApplied = false;

    // Commission and referral logic needs to be re-evaluated for multi-product orders.
    // For now, let's assume referral applies to the first eligible product.
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
      customerInfo: {
        id: customerId,
        name: customerData.name,
        phoneNumber: customerData.phoneNumber,
        deliveryAddress: customerData.deliveryAddress,
      },
      ...(referralWasApplied && { referralApplied: true }),
    };

    // Customer order is a simplified version for now
    const customerOrderRef = doc(db, 'customers', customerId, 'orders', newOrderId);
    batch.set(customerOrderRef, orderPayload);

    const storeOrderRef = doc(db, 'stores', storeId, 'orders', newOrderId);
    batch.set(storeOrderRef, orderPayload);

    // Update store analytics
    const totalCommissionFromSale = products.reduce((acc, p) => {
        return acc + (p.commission ? (p.price * p.commission) / 100 : 0);
    }, 0);
    const storeRef = doc(db, 'stores', storeId);
    batch.update(storeRef, {
        totalOrders: increment(1), // Still incrementing by 1 per transaction
        totalCommissionEarned: increment(totalCommissionFromSale)
    });

    await batch.commit();

    return {
      id: newOrderId,
      products,
      storeMeta,
      orderDate: orderDate.toDate().toISOString(),
      orderStatus: 'processing',
    };

  } catch (error) {
    console.error("FATAL: Error adding order to Firestore:", JSON.stringify(error, null, 2));
    throw new Error("Failed to place order.");
  }
};

/**
 * Updates the status of products within an order and the overall order status.
 */
export const updateOrderStatus = async (storeId: string, orderId: string, productIds: string[]): Promise<void> => {
    try {
        const orderRef = doc(db, 'stores', storeId, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            throw new Error("Order not found.");
        }

        const orderData = orderSnap.data() as FirestoreOrderData;
        
        const updatedProducts = orderData.products.map(product => {
            if (productIds.includes(product.id)) {
                return { ...product, status: 'ready' as const };
            }
            return product;
        });

        const allReady = updatedProducts.every(p => p.status === 'ready');
        const someReady = updatedProducts.some(p => p.status === 'ready');

        let newOrderStatus: FirestoreOrderData['orderStatus'] = 'processing';
        if (allReady) {
            newOrderStatus = 'ready';
        } else if (someReady) {
            newOrderStatus = 'partially-ready';
        }
        
        await updateDoc(orderRef, {
            products: updatedProducts,
            orderStatus: newOrderStatus
        });

        // Also update the customer's order document
        const customerOrderRef = doc(db, 'customers', orderData.customerId, 'orders', orderId);
        const customerOrderSnap = await getDoc(customerOrderRef);
        if(customerOrderSnap.exists()){
            await updateDoc(customerOrderRef, {
                products: updatedProducts,
                orderStatus: newOrderStatus
            });
        }

    } catch (error) {
        console.error("Error updating order status:", error);
        throw new Error("Failed to update order status.");
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
      const data = doc.data() as FirestoreOrderData;
      return {
        id: doc.id,
        products: data.products,
        storeMeta: data.storeMeta,
        orderDate: data.orderDate.toDate().toISOString(),
        orderStatus: data.orderStatus,
        customerInfo: data.customerInfo,
        referralApplied: data.referralApplied,
      };
    });

    return orders;
  } catch (error) {
    console.error("Error fetching store orders from Firestore:", error);
    throw new Error("Failed to fetch store orders.");
  }
};

/**
 * Fetches orders that are ready for delivery for a specific store.
 */
export const getReadyForDeliveryOrders = async (storeId: string): Promise<StoreOrder[]> => {
    try {
        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const q = query(ordersRef, where('orderStatus', 'in', ['ready', 'partially-ready']), orderBy('orderDate', 'desc'));
        const querySnapshot = await getDocs(q);

        const orders: StoreOrder[] = querySnapshot.docs.map(doc => {
            const data = doc.data() as FirestoreOrderData;
            return {
                id: doc.id,
                products: data.products,
                storeMeta: data.storeMeta,
                orderDate: data.orderDate.toDate().toISOString(),
                orderStatus: data.orderStatus,
                customerInfo: data.customerInfo,
                referralApplied: data.referralApplied,
            };
        });

        return orders;
    } catch (error) {
        console.error("Error fetching ready for delivery orders:", error);
        throw new Error("Failed to fetch ready orders.");
    }
}

// NOTE: fetchOrdersFromFirestore and incrementOrderCount would also need refactoring
// but are not immediately required for the admin feature. I will leave them for now
// to focus on the primary goal.
