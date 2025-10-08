'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Product } from '../types/product';
import { StoreMeta } from '../types/store';
import { fetchOrdersFromFirestore, addOrderToFirestore } from '../app/actions/orderActions';

// The client-side Order type uses a string for the date
export interface Order {
  id: string;
  product: Product;
  storeMeta: StoreMeta;
  orderDate: string;
}

export function useOrders(userId: string | null, storeId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fetchedOrders = await fetchOrdersFromFirestore(userId);
      
      // Filter orders by storeId if a specific store context is provided
      if (storeId && storeId.toLowerCase() !== 'bizcon') { // bizcon is global
        const filteredOrders = fetchedOrders.filter(order => order.storeMeta.id === storeId);
        setOrders(filteredOrders);
      } else {
        setOrders(fetchedOrders);
      }

    } catch (error) {
      console.error("Failed to fetch orders from Firestore", error);
      toast.error("Could not load your orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId, storeId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (product: Product, storeMeta: StoreMeta) => {
    if (!userId) {
        toast.error("You must be logged in to place an order.");
        return;
    }
    try {
      const newOrder = await addOrderToFirestore(userId, product, storeMeta);
      // Optimistically update the UI and then refetch for consistency
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      toast.success("Order placed successfully!");
      fetchOrders(); // Refetch to ensure data is in sync
    } catch (error) {
      console.error("Failed to save order to Firestore", error);
      toast.error("There was a problem placing your order.");
    }
  };

  return { orders, addOrder, fetchOrders, loading, isRefreshing: loading };
}
