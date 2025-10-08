
"use server";

import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Customer } from "@/types/customer";
import { nanoid } from 'nanoid';

/**
 * Finds a customer by their phone number.
 * @param phoneNumber The customer's phone number.
 * @returns The customer object if found, otherwise null.
 */
export const findCustomerByPhone = async (phoneNumber: string): Promise<Customer | null> => {
  try {
    const customersRef = collection(db, "customers");
    const q = query(customersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Customer;
    }
    return null;
  } catch (error) {
    console.error("Error in findCustomerByPhone:", error);
    throw new Error("Failed to search for customer.");
  }
};

/**
 * Finds an existing customer or creates a new one.
 * This is intended for the final step of signup.
 * @param phoneNumber The customer's phone number.
 * @param details The customer's details (name, address) required for creation.
 * @returns An object containing the customer data and a flag indicating if they were newly created.
 */
export const findOrCreateCustomer = async (
  phoneNumber: string,
  details: { name: string; deliveryAddress: string }
): Promise<{ isNew: boolean; customer: Customer }> => {
  try {
    const existingCustomer = await findCustomerByPhone(phoneNumber);

    if (existingCustomer) {
      return {
        isNew: false,
        customer: existingCustomer,
      };
    }

    // If no customer is found, proceed to create one.
    // The details are now guaranteed to be present.
    const referralCode = nanoid(8);
    const newCustomerData = {
      ...details,
      phoneNumber,
      referralCode,
      createdAt: serverTimestamp(),
    };

    const customersRef = collection(db, "customers");
    const docRef = await addDoc(customersRef, newCustomerData);

    return {
      isNew: true,
      customer: {
        id: docRef.id,
        ...newCustomerData,
        createdAt: new Date() // Approximate timestamp for immediate use
      } as unknown as Customer,
    };
  } catch (error) {
    console.error("Error in findOrCreateCustomer:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to find or create customer: ${error.message}`);
    }
    throw new Error("An unknown error occurred while processing your request.");
  }
};
