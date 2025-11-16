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
    if (!storeId || !customerId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      // We are now fetching all store orders and filtering by customer on the client
      // This is not ideal for performance, but it aligns with the current refactor.
      // A more performant solution would be to fetch from the customer's subcollection.
      const allStoreOrders = await fetchStoreOrders(storeId);
      const customerOrders = allStoreOrders.filter(o => o.customerInfo.id === customerId);
      setOrders(customerOrders);
    } catch (error) {
      toast.error('Failed to fetch orders.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, storeId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (products: (Product | CartItem)[], storeMeta: StoreMeta, customerInfo: Customer, referralCode: string | null, bonusApplied: boolean = false) => {
    if (!customerId || !customerInfo) {
      throw new Error("User is not logged in.");
    }

    try {
      const productsToSend = products.map(p => ({ ...p, storeId: storeMeta.id })) as Product[];
      const newOrder = await addOrderToFirestore(customerId, productsToSend, storeMeta, customerInfo, referralCode, bonusApplied);
      setOrders(prevOrders => [newOrder, ...prevOrders]);
    } catch (error) {
      console.error("Error in addOrder:", error);
      throw new Error("Failed to place order.");
    }
  };

  return { orders, isLoading, addOrder, refetchOrders: fetchOrders };
};
