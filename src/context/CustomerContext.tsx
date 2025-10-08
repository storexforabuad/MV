'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Customer } from '@/types/customer';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CustomerLookupModal from '@/components/customer/CustomerLookupModal';

interface CustomerContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  loading: boolean;
  promptLogin: (onSuccess: (customer: Customer) => void) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [onLoginSuccess, setOnLoginSuccess] = useState<((customer: Customer) => void) | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const customerDoc = await getDoc(doc(db, 'customers', user.uid));
          if (customerDoc.exists()) {
            const customerData = customerDoc.data();
            let serializableData: Customer = {
              id: customerDoc.id,
              ...customerData,
              createdAt: '',
            } as Customer;

            if (customerData.createdAt instanceof Timestamp) {
                serializableData.createdAt = customerData.createdAt.toDate().toISOString();
            } else if (customerData.createdAt) {
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

  const promptLogin = useCallback((onSuccess: (customer: Customer) => void) => {
      setOnLoginSuccess(() => onSuccess);
      setIsLoginModalOpen(true);
  }, []);

  const handleLoginSuccess = (loggedInCustomer: Customer) => {
    setIsLoginModalOpen(false);
    if (onLoginSuccess) {
        onLoginSuccess(loggedInCustomer);
        setOnLoginSuccess(null);
    }
  };

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, loading, promptLogin }}>
      {children}
      <CustomerLookupModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
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
