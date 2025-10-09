'use server';

import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/db";
import { Customer, DeliveryAddress } from "@/types/customer";
import { nanoid } from 'nanoid';

// Helper to serialize Firestore Timestamps
const serializeTimestamp = (timestamp: any): string => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    } 
    // If it's already a Date object for some reason
    if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    // Fallback for unexpected formats, though this should be avoided
    return new Date().toISOString(); 
};

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
      } as Customer;
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
        customer: existingCustomer, // Already serialized by findCustomerByPhone
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
        createdAt: new Date().toISOString(), // Immediate, serialized timestamp
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
