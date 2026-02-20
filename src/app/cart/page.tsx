'use client';

import dynamic from 'next/dynamic';
import { useCart, CartItem as CartItemType } from '../../lib/cartContext';
import { ShoppingCart } from 'lucide-react';
import { getStoreMeta } from '../../lib/db';
import { useState, useEffect } from 'react';
import { StoreMeta } from '../../types/store';
import Navbar from '../../components/layout/navbar';
import { useCustomer } from '@/context/CustomerContext';
import CustomerLookupModal from '@/components/customer/CustomerLookupModal';
import CartOrderSummaryModal from '@/components/modals/CartOrderSummaryModal';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/price';

const CartItemComponent = dynamic(
  () => import('../../components/cart/CartItem'),
  {
    loading: () => <div className="animate-pulse h-24 bg-gray-200 rounded-lg"></div>,
    ssr: false
  }
);

interface GroupedCart {
  [storeId: string]: CartItemType[];
}

const MARKETPLACE_KEY = 'Marketplace';

export default function CartPage() {
  const { state, dispatch } = useCart();
  const [storeMetas, setStoreMetas] = useState<{ [storeId: string]: StoreMeta }>({});
  const [groupedCart, setGroupedCart] = useState<GroupedCart>({});
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);

  const { customer } = useCustomer();

  useEffect(() => {
    const newGroupedCart: GroupedCart = state.items.reduce((acc, item) => {
      const storeId = item.storeId || MARKETPLACE_KEY;
      if (!acc[storeId]) {
        acc[storeId] = [];
      }
      acc[storeId].push(item);
      return acc;
    }, {} as GroupedCart);
    setGroupedCart(newGroupedCart);

    async function fetchMetas() {
      const storeIds = Object.keys(newGroupedCart);
      const metas: { [storeId: string]: StoreMeta } = {};
      for (const id of storeIds) {
        if (id !== MARKETPLACE_KEY) {
          try {
            const meta = await getStoreMeta(id);
            if (meta) {
              metas[id] = meta as StoreMeta;
            }
          } catch (error) {
            console.error(`Failed to fetch store meta for ID: ${id}`, error)
          }
        }
      }
      setStoreMetas(metas);
    }

    if (Object.keys(newGroupedCart).length > 0) {
      fetchMetas();
    }
  }, [state.items]);

  const handleUpdateQuantity = (item: CartItemType, quantity: number) => {
    if (quantity > 0) {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id: item.id, selectedSize: item.selectedSize, selectedColor: item.selectedColor, quantity }
      });
    } else {
      dispatch({
        type: 'REMOVE_ITEM',
        payload: { id: item.id, selectedSize: item.selectedSize, selectedColor: item.selectedColor }
      });
    }
  };

  const handleRemoveItem = (item: CartItemType) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { id: item.id, selectedSize: item.selectedSize, selectedColor: item.selectedColor }
    });
  };

  const handleCheckout = (storeId: string) => {
    setCurrentStoreId(storeId);
    setIsOrderModalOpen(true);
  };

  const handleOrderSuccess = (storeId: string) => {
    if (storeId) {
      groupedCart[storeId].forEach(item => {
        dispatch({
          type: 'REMOVE_ITEM',
          payload: { id: item.id, selectedSize: item.selectedSize, selectedColor: item.selectedColor }
        });
      });
    }
    setIsOrderModalOpen(false);
    setCurrentStoreId(null);
    toast.success('Order placed successfully!');
  };

  const handleModalClose = () => {
    setIsOrderModalOpen(false);
    setCurrentStoreId(null);
  };

  if (state.items.length === 0) {
    return (
      <>
        <Navbar storeName="Wishlist" />
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
      <Navbar storeName="Wishlist" />
      <CustomerLookupModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          toast.success("You're logged in! You can now place your order.");
        }}
      />
      <CartOrderSummaryModal
        isOpen={isOrderModalOpen}
        onClose={handleModalClose}
        onOrderSuccess={() => currentStoreId && handleOrderSuccess(currentStoreId)}
        cartItems={currentStoreId ? (groupedCart[currentStoreId] || []) : []}
        storeMeta={currentStoreId ? (storeMetas[currentStoreId] || null) : null}
        customer={customer}
        storeId={currentStoreId || undefined}
      />
      <div className="min-h-screen mx-auto max-w-2xl px-3 sm:px-4 pb-8 pt-[calc(var(--navbar-height)+1.5rem)] sm:pt-[calc(var(--navbar-height)+2rem)]">
        {Object.entries(groupedCart).map(([storeId, items]) => {
          const storeMeta = storeMetas[storeId];
          const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
          const isMarketplace = storeId === MARKETPLACE_KEY;

          return (
            <div key={storeId} className="mb-8 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 bg-white dark:bg-gray-800/20 shadow-sm">
              <h2 className="text-lg font-bold card-text-gradient mb-4">{isMarketplace ? 'Marketplace' : storeMeta?.name || 'Unknown Store'}</h2>
              <div className="space-y-4">
                {items.map(item => (
                  <CartItemComponent
                    key={`${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`}
                    item={item}
                    onUpdateQuantity={(quantity) => handleUpdateQuantity(item, Number(quantity))}
                    onRemove={() => handleRemoveItem(item)}
                  />
                ))}
              </div>
              <div className="mt-6 border-t border-[var(--border-color)] pt-6">
                <div className="flex justify-between text-base font-medium card-text-gradient">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <button
                  onClick={() => handleCheckout(storeId)}
                  disabled={isMarketplace || !storeMeta}
                  className="mt-6 group relative w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[var(--button-success)] text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:bg-[var(--button-success-hover)] transform-gpu active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="relative tracking-[-0.01em]">Order from {isMarketplace ? 'Marketplace' : storeMeta?.name || 'Store'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
