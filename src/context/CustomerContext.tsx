
"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Customer } from "@/types/customer";
import CustomerLookupModal from "@/components/customer/CustomerLookupModal";

interface CustomerContextType {
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
  promptLogin: (onSuccess?: (customerId: string) => void) => void;
  clearCustomer: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined
);

interface CustomerProviderProps {
  children: ReactNode;
}

export const CustomerProvider = ({ children }: CustomerProviderProps) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const onSuccessCallbackRef = useRef<((customerId: string) => void) | null>(null);

  const fetchCustomerData = useCallback(async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const customerDocRef = doc(db, "customers", customerId);
      const customerDoc = await getDoc(customerDocRef);
      if (customerDoc.exists()) {
        setCustomer({ id: customerDoc.id, ...customerDoc.data() } as Customer);
      } else {
        throw new Error("Customer session is invalid. Please log in again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      localStorage.removeItem("customerId"); // Clear bad session
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedCustomerId = localStorage.getItem("customerId");
    if (storedCustomerId) {
      fetchCustomerData(storedCustomerId);
    } else {
      setIsLoading(false);
    }
  }, [fetchCustomerData]);

  const promptLogin = useCallback((onSuccess?: (customerId: string) => void) => {
    if (onSuccess) {
      onSuccessCallbackRef.current = onSuccess;
    }
    setIsModalOpen(true);
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    onSuccessCallbackRef.current = null; // Clear callback on close
  };

  const handleModalSuccess = (customerId: string) => {
    localStorage.setItem("customerId", customerId);
    fetchCustomerData(customerId); 

    if (onSuccessCallbackRef.current) {
      onSuccessCallbackRef.current(customerId);
    }

    handleModalClose();
  };

  const clearCustomer = () => {
    setCustomer(null);
    localStorage.removeItem("customerId");
  };

  return (
    <CustomerContext.Provider
      value={{ customer, isLoading, error, promptLogin, clearCustomer }}
    >
      {children}
      <CustomerLookupModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
};
