'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { addOrderToFirestore, fetchOrdersFromFirestore } from '@/app/actions/orderActions';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { CartItem } from '@/lib/cartContext';

export interface Order {
  id: string;
  product: Product;
  storeMeta: StoreMeta;
  orderDate: string; // ISO string format
  quantity: number;
}

export const useOrders = (customerId: string | null, storeId?: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!customerId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const fetchedOrders = await fetchOrdersFromFirestore(customerId, storeId);
      setOrders(fetchedOrders);
    } catch (error) {
      toast.error('Failed to fetch orders.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, storeId]);

  useEffect(() => {
    fetchOrders();
  }, [customerId, fetchOrders]);

  const addOrder = async (product: Product | CartItem, storeMeta: StoreMeta, quantity: number, customerInfo: Customer, referralCode: string | null, bonusApplied: boolean = false) => {
    if (!customerId || !customerInfo) {
      throw new Error("User is not logged in.");
    }

    try {
      const newOrder = await addOrderToFirestore(customerId, product, storeMeta, quantity, customerInfo, referralCode, bonusApplied);
      setOrders(prevOrders => [newOrder, ...prevOrders]);
    } catch (error) {
      console.error("Error in addOrder:", error);
      throw new Error("Failed to place order.");
    }
  };

  return { orders, isLoading, addOrder, refetchOrders: fetchOrders };
};
