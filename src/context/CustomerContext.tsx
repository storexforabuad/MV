'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer } from '@/types/customer';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CustomerContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  loading: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const customerDoc = await getDoc(doc(db, 'customers', user.uid));
          if (customerDoc.exists()) {
            const customerData = customerDoc.data();

            // Correctly serialize the createdAt timestamp
            let serializableData: Customer = {
              id: customerDoc.id,
              ...customerData,
              createdAt: '', // Initialize as an empty string
            } as Customer;

            if (customerData.createdAt instanceof Timestamp) {
                serializableData.createdAt = customerData.createdAt.toDate().toISOString();
            } else if (customerData.createdAt) {
                // Fallback for other timestamp formats if necessary
                serializableData.createdAt = new Date(customerData.createdAt).toISOString();
            }
            
            setCustomer(serializableData);
          }
        } catch (error) {
            console.error("Failed to fetch customer data:", error);
        }
      } else {
        setCustomer(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, loading }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
