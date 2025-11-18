import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/db";
import { Customer, DeliveryAddress } from "@/types/customer";
import { nanoid } from 'nanoid';
import { StoreOrder } from "./orderActions";

// Helper to serialize Firestore Timestamps
const serializeTimestamp = (timestamp: unknown): string => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    } 
    if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    return new Date().toISOString(); 
};

export const getCustomerDetails = async (customerId: string): Promise<Customer | null> => {
  try {
    const customerRef = doc(db, "customers", customerId);
    const customerSnap = await getDoc(customerRef);

    if (customerSnap.exists()) {
      const data = customerSnap.data();
      return {
          id: customerSnap.id,
          ...data,
          createdAt: serializeTimestamp(data.createdAt),
      } as unknown as Customer;
    } else {
      console.log("No such customer!");
      return null;
    }
  } catch (error) {
    console.error("Error getting customer details: ", error);
    throw new Error("Failed to get customer details.");
  }
}

export const getReferralBonus = async (customerId: string): Promise<number> => {
  try {
    const customerRef = doc(db, "customers", customerId);
    const customerSnap = await getDoc(customerRef);

    if (customerSnap.exists()) {
      return customerSnap.data().totalReferralCommission || 0;
    } else {
      console.log("No such customer!");
      return 0;
    }
  } catch (error) {
    console.error("Error getting referral bonus: ", error);
    return 0;
  }
}

/**
 * Finds a customer by their phone number and serializes the result.
 * @param phoneNumber The customer's phone number.
 * @returns The customer object if found (with serialized timestamp), otherwise null.
 */
export const findCustomerByPhone = async (phoneNumber: string): Promise<Customer | null> => {
  try {
    const customersRef = collection(db, "customers");
    const q = query(customersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
          id: doc.id,
          ...data,
          createdAt: serializeTimestamp(data.createdAt),
      } as unknown as Customer;
    }
    return null;
  } catch (error) {
    console.error("Error in findCustomerByPhone:", error);
    throw new Error("Failed to search for customer.");
  }
};

/**
 * Finds an existing customer or creates a new one, ensuring the result is serialized.
 * @param phoneNumber The customer's phone number.
 * @param details The customer's details required for creation.
 * @returns An object containing the serialized customer data and a flag indicating if they were newly created.
 */
export const findOrCreateCustomer = async (
  phoneNumber: string,
  details: { name: string; deliveryAddress: DeliveryAddress }
): Promise<{ isNew: boolean; customer: Customer }> => {
  try {
    const existingCustomer = await findCustomerByPhone(phoneNumber);

    if (existingCustomer) {
      return {
        isNew: false,
        customer: existingCustomer,
      };
    }

    const referralCode = nanoid(8);
    const newCustomerData = {
      ...details,
      phoneNumber,
      referralCode,
      createdAt: serverTimestamp(),
      totalReferralCommission: 0,
      successfulReferralCount: 0,
    };

    const customersRef = collection(db, "customers");
    const docRef = await addDoc(customersRef, newCustomerData);

    return {
      isNew: true,
      customer: {
        id: docRef.id,
        ...details,
        phoneNumber,
        referralCode,
        createdAt: Timestamp.now(),
        totalReferralCommission: 0,
        successfulReferralCount: 0,
      },
    };
  } catch (error) {
    console.error("Error in findOrCreateCustomer:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to find or create customer: ${error.message}`);
    }
    throw new Error("An unknown error occurred while processing your request.");
  }
};

export interface StoreCustomer {
  id: string;
  name: string;
  phoneNumber: string;
  deliveryAddress: DeliveryAddress;
  mostRecentOrderDate: string;
  totalOrdersInStore: number;
  totalSpentInStore: number;
  successfulReferralCount: number;
  totalReferralCommission: number;
}

/**
 * Fetches the count of unique customers for a given store.
 * Lightweight action for dashboard cards.
 */
export const getStoreCustomerCount = async (storeId: string): Promise<number> => {
    try {
        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const q = query(ordersRef);
        const querySnapshot = await getDocs(q);

        const customerIds = new Set<string>();
        querySnapshot.forEach(doc => {
            const data = doc.data() as StoreOrder;
            if (data.customerInfo && data.customerInfo.id) {
                customerIds.add(data.customerInfo.id);
            }
        });

        return customerIds.size;
    } catch (error) {
        console.error("Error in getStoreCustomerCount:", error);
        throw new Error("Failed to get customer count.");
    }
};

/**
 * Fetches a detailed list of customers for a specific store, sorted by most recent order.
 * Gathers and aggregates data from store orders and global customer documents.
 */
export const fetchStoreCustomers = async (storeId: string): Promise<StoreCustomer[]> => {
    try {
        const ordersRef = collection(db, 'stores', storeId, 'orders');
        const ordersQuery = query(ordersRef, orderBy('orderDate', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => doc.data() as StoreOrder);

        if (orders.length === 0) {
            return [];
        }

        const customerDataMap = new Map<string, StoreCustomer>();
        const orderedUniqueCustomerIds: string[] = [];

        for (const order of orders) {
            if (!order.customerInfo || !order.customerInfo.id) continue;

            const customerId = order.customerInfo.id;
            
            if (!customerDataMap.has(customerId)) {
                orderedUniqueCustomerIds.push(customerId);
                customerDataMap.set(customerId, {
                    id: customerId,
                    name: order.customerInfo.name,
                    phoneNumber: order.customerInfo.phoneNumber,
                    deliveryAddress: order.customerInfo.deliveryAddress,
                    mostRecentOrderDate: serializeTimestamp(order.orderDate),
                    totalOrdersInStore: 0,
                    totalSpentInStore: 0,
                    successfulReferralCount: 0,
                    totalReferralCommission: 0,
                });
            }

            const customerRecord = customerDataMap.get(customerId)!;
            customerRecord.totalOrdersInStore += 1;
            const orderTotal = order.products.reduce((sum, product) => sum + product.price * product.quantity, 0);
            customerRecord.totalSpentInStore += orderTotal;
        }

        if (orderedUniqueCustomerIds.length > 0) {
            const globalCustomersQuery = query(collection(db, 'customers'), where('__name__', 'in', orderedUniqueCustomerIds));
            const globalCustomersSnapshot = await getDocs(globalCustomersQuery);
            const globalCustomersMap = new Map<string, Customer>();
            globalCustomersSnapshot.forEach(doc => {
                globalCustomersMap.set(doc.id, doc.data() as Customer);
            });

            customerDataMap.forEach((customerRecord, customerId) => {
                const globalData = globalCustomersMap.get(customerId);
                if (globalData) {
                    customerRecord.successfulReferralCount = globalData.successfulReferralCount || 0;
                    customerRecord.totalReferralCommission = globalData.totalReferralCommission || 0;
                }
            });
        }

        return orderedUniqueCustomerIds.map(id => customerDataMap.get(id)!);

    } catch (error) {
        console.error("Error in fetchStoreCustomers:", error);
        throw new Error("Failed to fetch store customers.");
    }
};
