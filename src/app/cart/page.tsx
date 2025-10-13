'use client';

import dynamic from 'next/dynamic';
import { useCart } from '../../lib/cartContext';
import { ShoppingCart } from 'lucide-react';
import { getStoreMeta } from '../../lib/db';
import { useState, useEffect } from 'react';
import { StoreMeta } from '../../types/store';
import { Product } from '../../types/product';
import Navbar from '../../components/layout/navbar';
import { useCustomer } from '@/context/CustomerContext';
import { useOrders } from '@/hooks/useOrders';
import CustomerLookupModal from '@/components/customer/CustomerLookupModal';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/price';

const CartItem = dynamic(
  () => import('../../components/cart/CartItem'),
  { 
    loading: () => <div className="animate-pulse h-24 bg-gray-200 rounded-lg"></div>,
    ssr: false 
  }
);

interface GroupedCart {
  [storeId: string]: Product[];
}

export default function CartPage() {
  const { state, dispatch } = useCart();
  const [storeMetas, setStoreMetas] = useState<{[storeId: string]: StoreMeta}>({});
  const [groupedCart, setGroupedCart] = useState<GroupedCart>({});
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const { customer } = useCustomer();
  const { addOrder } = useOrders(customer?.id || null);

  useEffect(() => {
    const newGroupedCart: GroupedCart = state.items.reduce((acc, item) => {
      const storeId = item.storeId || 'unknown';
      if (!acc[storeId]) {
        acc[storeId] = [];
      }
      acc[storeId].push(item);
      return acc;
    }, {} as GroupedCart);
    setGroupedCart(newGroupedCart);

    async function fetchMetas() {
      const storeIds = Object.keys(newGroupedCart);
      const metas: {[storeId: string]: StoreMeta} = {};
      for (const id of storeIds) {
        if (id !== 'unknown') {
            const meta = await getStoreMeta(id);
            if (meta) {
                metas[id] = meta as StoreMeta;
            }
        }
      }
      setStoreMetas(metas);
    }

    if (Object.keys(newGroupedCart).length > 0) {
        fetchMetas();
    }
  }, [state.items]);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };
  
  const handleCheckout = async (storeId: string, items: Product[]) => {
    if (!customer) {
      setIsLoginModalOpen(true);
      return;
    }

    const storeMeta = storeMetas[storeId];
    if (!storeMeta || !storeMeta.whatsapp) {
      toast.error('Store information or WhatsApp number is missing.');
      return;
    }
    
    const referrerId = localStorage.getItem('referrerId');
    const storeMetaWithId = { ...storeMeta, id: storeId };

    const orderPromises = items.map(item => 
      addOrder(item, storeMetaWithId, item.quantity, customer, referrerId)
    );

    try {
      await toast.promise(
        Promise.all(orderPromises),
        {
          loading: 'Placing your order...',
          success: 'Order placed! Redirecting to WhatsApp...',
          error: 'There was an error placing your order.'
        }
      );
      
      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const itemsMessage = items.map(item => {
        const productUrl = `${window.location.origin}/store/${storeId}/${item.id}`;
        return (
          `*${item.name}* (x${item.quantity})\n` +
          `• Price: ${formatPrice(item.price * item.quantity)}\n` +
          `• Product Link: ${productUrl}`
        )
      }).join('\n\n');

      const message =
          `🛍️ *New Order Request*\n\n` +
          `Hello! I would like to order the following items:\n\n` +
          `${itemsMessage}\n\n` +
          `*Subtotal: ${formatPrice(totalAmount)}*\n\n` +
          `Thank you! 🙏`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${storeMeta.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      // Remove only ordered items from cart
      items.forEach(item => {
          dispatch({ type: 'REMOVE_ITEM', payload: item.id });
      });

    } catch (error) {
        console.error("Failed to place one or more orders:", error);
    }
  };

  if (state.items.length === 0) {
    return (
        <>
            <Navbar storeName="Cart" />
            <div className="min-h-[calc(100vh-var(--navbar-height))] pt-[calc(var(--navbar-height))] flex flex-col items-center justify-center px-4">
                <h2 className="text-xl sm:text-2xl font-bold card-text-gradient">Your list is empty</h2>
                <p className="mt-2 text-sm sm:text-base text-text-secondary">
                  Start shopping by adding items to your list.
                </p>
            </div>
        </>
    );
  }

  return (
    <>
        <Navbar storeName="Cart" />
        <CustomerLookupModal 
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
            toast.success("You're logged in! You can now place your order.");
          }}
        />
        <div className="min-h-screen mx-auto max-w-2xl px-3 sm:px-4 pb-8 pt-[calc(var(--navbar-height)+1.5rem)] sm:pt-[calc(var(--navbar-height)+2rem)]">
          {Object.entries(groupedCart).map(([storeId, items]) => {
            const storeMeta = storeMetas[storeId];
            const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

            return (
              <div key={storeId} className="mb-8 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 bg-white dark:bg-gray-800/20 shadow-sm">
                <h2 className="text-lg font-bold card-text-gradient mb-4">{storeMeta?.name || 'Unknown Store'}</h2>
                <div className="space-y-4">
                  {items.map(item => (
                    <CartItem 
                      key={item.id} 
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
                <div className="mt-6 border-t border-[var(--border-color)] pt-6">
                  <div className="flex justify-between text-base font-medium card-text-gradient">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <button
                    onClick={() => handleCheckout(storeId, items)}
                    disabled={!storeMeta}
                    className="mt-6 group relative w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[var(--button-success)] text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:bg-[var(--button-success-hover)] transform-gpu active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="relative tracking-[-0.01em]">Order from {storeMeta?.name || '...'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
    </>
  );
}
