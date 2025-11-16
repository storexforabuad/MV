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

// Base type for orders returned to the client.
export interface Order {
    id: string;
    products: Product[]; // Now supports multiple products
    storeMeta: StoreMeta;
    orderDate: string; // ISO string
    orderStatus: 'processing' | 'partially-ready' | 'ready' | 'shipped';
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
interface OrderProduct extends Product {
    status: 'processing' | 'ready' | 'shipped';
}

// Interface for the complete order data as stored in Firestore.
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
 * Adds a new order to Firestore, creating it in both the customer's and store's collections atomically.
 */
export const addOrderToFirestore = async (
  customerId: string,
  products: Product[], 
  storeMeta: StoreMeta,
  customer: Customer,
  referralCode: string | null,
  bonusApplied: boolean = false,
): Promise<Order> => {
  try {
    const storeId = storeMeta.id;
    if (!storeId) throw new Error("Store ID is missing.");

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
      customerInfo: {
        id: customerId,
        name: customerData.name,
        phoneNumber: customerData.phoneNumber,
        deliveryAddress: customerData.deliveryAddress,
      },
      ...(referralWasApplied && { referralApplied: true }),
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

        if (!orderSnap.exists()) throw new Error("Order not found.");

        const orderData = orderSnap.data() as any; // Allow flexible data handling
        
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
        
        await updateDoc(orderRef, {
            products: updatedProducts,
            orderStatus: newOrderStatus
        });

        const customerOrderRef = doc(db, 'customers', orderData.customerId, 'orders', orderId);
        if((await getDoc(customerOrderRef)).exists()){
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
 * Helper to transform a Firestore document into a resilient, backward-compatible StoreOrder object.
 * This function will not crash, even with corrupted or incomplete data.
 */
const transformOrderData = (doc: any): StoreOrder => {
    const data = doc.data() as any;

    // --- Defensive Data Transformation --- 

    // 1. Products: Default to an empty array if missing or corrupt.
    let products = data.products || (data.product ? [{ ...data.product, quantity: data.quantity || 1 }] : []);
    if (!Array.isArray(products)) {
        console.warn(`Corrupt 'products' field for order ${doc.id}. Falling back to empty array.`);
        products = [];
    }

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
