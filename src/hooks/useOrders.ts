'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { addOrderToFirestore, fetchStoreOrders } from '@/app/actions/orderActions';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { CartItem } from '@/lib/cartContext';
import { Order } from '@/app/actions/orderActions';

export { type Order } from '@/app/actions/orderActions';

export const useOrders = (customerId: string | null, storeId: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!storeId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      if (customerId) {
        // Fetch from Firestore for logged-in users
        const allStoreOrders = await fetchStoreOrders(storeId);
        const customerOrders = allStoreOrders.filter(o => o.customerInfo.id === customerId);
        setOrders(customerOrders);
      } else {
        // Fetch from Firestore for guest email in localStorage
        const guestEmail = localStorage.getItem('guest_email');
        const allStoreOrders = await fetchStoreOrders(storeId);
        
        let guestOrdersFromFirestore: Order[] = [];
        if (guestEmail) {
          const guestId = `guest-${guestEmail.replace(/[^a-zA-Z0-9]/g, '')}`;
          guestOrdersFromFirestore = allStoreOrders.filter(o => o.customerInfo.id === guestId || o.customerInfo.id === `guest-${guestEmail}`);
        }

        // Also check legacy localStorage orders
        const savedOrders = localStorage.getItem(`orders_${storeId}`);
        const legacyOrders = savedOrders ? JSON.parse(savedOrders) : [];
        
        // Merge and deduplicate
        const merged = [...guestOrdersFromFirestore, ...legacyOrders].reduce((acc: Order[], curr: Order) => {
          if (!acc.some(o => o.id === curr.id)) acc.push(curr);
          return acc;
        }, []);

        setOrders(merged);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, storeId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (products: (Product | CartItem)[], storeMeta: StoreMeta, customerInfo: Customer, referralCode: string | null, bonusApplied: boolean = false, deliveryMethod: 'home' | 'pickup' = 'home', orderNotes?: string, paymentEvidenceUrl?: string, paymentEvidenceFileName?: string) => {
    try {
      const productsToSend = products.map(p => ({ ...p, storeId: storeMeta.id })) as Product[];

      let newOrder: Order;

      if (customerId && customerInfo.id) {
        // Standard Firestore order for logged-in users
        newOrder = await addOrderToFirestore(customerId, productsToSend, storeMeta, customerInfo, referralCode, bonusApplied, deliveryMethod, orderNotes, paymentEvidenceUrl, paymentEvidenceFileName);
      } else {
        // Simple mock order for anonymous users (saved to localStorage)
        newOrder = {
          id: `guest_${Date.now()}`,
          products: productsToSend,
          storeMeta,
          orderDate: new Date().toISOString(),
          orderStatus: 'processing',
          deliveryMethod,
          orderNotes,
          paymentStatus: 'pending',
          customerInfo: {
            ...customerInfo,
            id: 'guest'
          }
        } as any;

        const guestOrders = JSON.parse(localStorage.getItem(`orders_${storeId}`) || '[]');
        localStorage.setItem(`orders_${storeId}`, JSON.stringify([newOrder, ...guestOrders]));
      }

      setOrders(prevOrders => [newOrder, ...prevOrders]);
      return newOrder;
    } catch (error) {
      console.error("Error in addOrder:", error);
      throw new Error("Failed to place order.");
    }
  };

  return { orders, isLoading, addOrder, refetchOrders: fetchOrders };
};
