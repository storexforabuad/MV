'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useCustomer } from './CustomerContext';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';

interface FirestoreOrder {
  products: (Product & { status?: string })[];
  storeMeta: StoreMeta;
  orderDate: Timestamp;
  orderStatus: 'processing' | 'partially-ready' | 'ready' | 'shipped';
  deliveryMethod: 'home' | 'pickup';
  customerInfo?: any;
  referralApplied?: boolean;
  orderNotes?: string;
  customerId?: string;
}

interface UnacknowledgedOrder extends FirestoreOrder {
  orderId: string;
}

interface OrderReadyNotificationContextType {
  unacknowledgedOrders: UnacknowledgedOrder[];
  isLoading: boolean;
  acknowledgeAllOrders: (orderIds: string[]) => Promise<void>;
  acknowledgeOrder: (orderId: string) => Promise<void>;
  closeModal: () => void;
  isModalOpen: boolean;
}

const OrderReadyNotificationContext = createContext<OrderReadyNotificationContextType | undefined>(undefined);

export const OrderReadyNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customer } = useCustomer();
  const [unacknowledgedOrders, setUnacknowledgedOrders] = useState<UnacknowledgedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [acknowledgedOrderIds, setAcknowledgedOrderIds] = useState<string[] | null>(null);

  // Load acknowledged order IDs from customer doc
  useEffect(() => {
    if (!customer?.id) {
      setIsLoading(false);
      return;
    }

    const loadAcknowledgedOrders = async () => {
      try {
        const customerDocRef = doc(db, 'customers', customer.id);
        const customerDoc = await getDoc(customerDocRef);
        const acknowledged = customerDoc.data()?.acknowledgedOrderIds || [];
        setAcknowledgedOrderIds(acknowledged);
      } catch (error) {
        console.error('Error loading acknowledged orders:', error);
        setAcknowledgedOrderIds([]); // Fallback to empty array on error to allow flow to continue
      }
    };

    loadAcknowledgedOrders();
  }, [customer?.id]);

  // Set dynamic viewport CSS var (--dvh) and header height for mobile browsers
  useEffect(() => {
    const setViewportVars = () => {
      try {
        document.documentElement.style.setProperty('--dvh', `${window.innerHeight * 0.01}px`);
        // try to find a header element to compute header height
        const header = document.querySelector('header, .site-header, .navbar, .top-bar');
        const headerHeight = header ? `${(header as HTMLElement).offsetHeight}px` : '0px';
        document.documentElement.style.setProperty('--header-height', headerHeight);
      } catch (e) {
        // ignore in SSR or restricted env
      }
    };

    setViewportVars();
    window.addEventListener('resize', setViewportVars);
    window.addEventListener('orientationchange', setViewportVars);
    return () => {
      window.removeEventListener('resize', setViewportVars);
      window.removeEventListener('orientationchange', setViewportVars);
    };
  }, []);

  // Body scroll lock while modal open
  const prevOverflow = useRef<string>('');
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isModalOpen) {
      prevOverflow.current = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prevOverflow.current || '';
    }
    return () => { document.body.style.overflow = prevOverflow.current || ''; };
  }, [isModalOpen]);

  // Set up real-time listener for customer's orders
  useEffect(() => {
    if (!customer?.id) {
      setIsLoading(false);
      return;
    }

    // Wait for acknowledged orders to load
    if (acknowledgedOrderIds === null) {
      return;
    }

    setIsLoading(true);

    const ordersRef = collection(db, 'customers', customer.id, 'orders');
    const q = query(
      ordersRef,
      where('orderStatus', 'in', ['ready', 'partially-ready'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const readyOrders: UnacknowledgedOrder[] = [];

        snapshot.forEach((docSnapshot) => {
          const orderId = docSnapshot.id;
          const orderData = docSnapshot.data() as FirestoreOrder;

          // Only include if not acknowledged
          if (!acknowledgedOrderIds.includes(orderId)) {
            readyOrders.push({
              ...orderData,
              orderId,
            });
          }
        });

        // Sort by orderDate (newest first)
        readyOrders.sort((a, b) => {
          const dateA = a.orderDate instanceof Timestamp ? a.orderDate.toDate() : new Date(a.orderDate || 0);
          const dateB = b.orderDate instanceof Timestamp ? b.orderDate.toDate() : new Date(b.orderDate || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setUnacknowledgedOrders(readyOrders);
        setIsModalOpen(readyOrders.length > 0);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error setting up order listener:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [customer?.id, acknowledgedOrderIds]);

  const acknowledgeAllOrders = async (orderIds: string[]) => {
    if (!customer?.id) return;

    try {
      // Use dynamic import to avoid circular dependencies
      const orderActions = await import('@/app/actions/orderActions');
      if (orderActions.acknowledgeOrders) {
        await orderActions.acknowledgeOrders(customer.id, orderIds);
      }

      // Update local state
      setAcknowledgedOrderIds(prev => [...(prev || []), ...orderIds]);
      setUnacknowledgedOrders([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error acknowledging orders:', error);
    }
  };

  const acknowledgeOrder = async (orderId: string) => {
    if (!customer?.id) return;

    try {
      const orderActions = await import('@/app/actions/orderActions');
      if (orderActions.acknowledgeOrders) {
        await orderActions.acknowledgeOrders(customer.id, [orderId]);
      }

      setAcknowledgedOrderIds(prev => [...(prev || []), orderId]);

      setUnacknowledgedOrders(prev => {
        const remaining = prev.filter(o => o.orderId !== orderId);
        setIsModalOpen(remaining.length > 0);
        return remaining;
      });
    } catch (error) {
      console.error('Error acknowledging order:', error);
      throw error;
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <OrderReadyNotificationContext.Provider
      value={{
        unacknowledgedOrders,
        isLoading,
        acknowledgeAllOrders,
        acknowledgeOrder,
        closeModal,
        isModalOpen,
      }}
    >
      {children}
    </OrderReadyNotificationContext.Provider>
  );
};

export const useOrderReadyNotification = () => {
  const context = useContext(OrderReadyNotificationContext);
  if (!context) {
    throw new Error('useOrderReadyNotification must be used within OrderReadyNotificationProvider');
  }
  return context;
};
