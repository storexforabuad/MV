
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer } from '@/types/customer';
import CustomerLookupModal from '@/components/customer/CustomerLookupModal';

export interface LoginContext {
  storeType?: string;
  itemType?: 'product' | 'service';
}

interface CustomerContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  loading: boolean;
  promptLogin: (ctx?: LoginContext) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginContext, setLoginContext] = useState<LoginContext | undefined>(undefined);

  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem('customer');
      if (savedCustomer) {
        setCustomerState(JSON.parse(savedCustomer));
      }
    } catch (error) {
      console.error("Failed to parse customer from localStorage", error);
      // If parsing fails, it's best to clear the corrupted data
      localStorage.removeItem('customer');
    }
    setLoading(false);
  }, []);

  const setCustomer = (customer: Customer | null) => {
    setCustomerState(customer);
    if (customer) {
      localStorage.setItem('customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('customer');
    }
  };

  const promptLogin = (ctx?: LoginContext) => {
    if (ctx) setLoginContext(ctx);
    else setLoginContext(undefined);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (loggedInCustomer: Customer) => {
    setCustomer(loggedInCustomer);
    setIsLoginModalOpen(false);
  };

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, loading, promptLogin }}>
      {children}
      <CustomerLookupModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        loginContext={loginContext}
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
