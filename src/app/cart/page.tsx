'use client';

import dynamic from 'next/dynamic';
import { useCart, CartItem as CartItemType } from '../../lib/cartContext';
import { ShoppingCart, Globe, Sparkles } from 'lucide-react';
import { getStoreMeta } from '../../lib/db';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import NeedAWebsiteModal from '@/components/customer/modals/NeedAWebsiteModal';
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

const WishlistShareButton = dynamic(
  () => import('../../components/cart/WishlistShareButton'),
  { ssr: false }
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
  const [isNeedWebsiteModalOpen, setIsNeedWebsiteModalOpen] = useState(false);
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
        <Navbar storeName="Cart" />
        <div className="min-h-[calc(100vh-var(--navbar-height))] pt-[calc(var(--navbar-height))] flex flex-col items-center justify-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold card-text-gradient">Your cart is empty</h2>
          <p className="mt-2 text-sm sm:text-base text-text-secondary">
            Start shopping by adding items to your cart.
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
      <CartOrderSummaryModal
        isOpen={isOrderModalOpen}
        onClose={handleModalClose}
        onOrderSuccess={() => currentStoreId && handleOrderSuccess(currentStoreId)}
        cartItems={currentStoreId ? (groupedCart[currentStoreId] || []) : []}
        storeMeta={currentStoreId ? (storeMetas[currentStoreId] || null) : null}
        customer={customer}
        storeId={currentStoreId || undefined}
      />
      <NeedAWebsiteModal
        isOpen={isNeedWebsiteModalOpen}
        onClose={() => setIsNeedWebsiteModalOpen(false)}
        storeId={Object.keys(storeMetas)[0] || 'compass'}
        storeName={Object.values(storeMetas)[0]?.name}
      />
      <div className="min-h-screen mx-auto max-w-2xl px-3 sm:px-4 pb-8 pt-[calc(var(--navbar-height)+1.5rem)] sm:pt-[calc(var(--navbar-height)+2rem)] flex flex-col">
        <div className="flex justify-between items-center mb-6 px-1">
          <h1 className="text-2xl font-bold card-text-gradient">Your Cart</h1>
          <WishlistShareButton items={state.items} />
        </div>

        <div className="flex-1">
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
                      onUpdateQuantity={(_id, quantity) => handleUpdateQuantity(item, quantity)}
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

        {/* Optimized Branded Footer */}
        {Object.keys(storeMetas).length > 0 && false && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => setIsNeedWebsiteModalOpen(true)}
            className="mt-12 mb-8 flex justify-center w-full relative group text-left"
          >
            {(() => {
              const firstStoreMeta = Object.values(storeMetas)[0];
              const is420Hub = firstStoreMeta?.id === '420-Hub' || firstStoreMeta?.name === '420-Hub' || firstStoreMeta?.name === '420 Hub';
              const isStunnerStores = firstStoreMeta?.id?.toLowerCase().includes('stunner') || firstStoreMeta?.name?.toLowerCase().includes('stunner');
              return (
                <div className={`w-full relative p-6 sm:p-8 rounded-[2rem] shadow-2xl border ${isStunnerStores ? 'bg-gradient-to-br from-zinc-950/90 via-black to-violet-950/80 border-violet-500/30' : is420Hub ? 'bg-gradient-to-br from-zinc-950/90 via-black to-emerald-950/80 border-emerald-500/30' : 'bg-gradient-to-br from-[#1a1a40] via-[#2d1b4d] to-[#1a1a40] border-amber-500/30'}`}>
                  {/* Promo Badge */}
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-20 uppercase tracking-[0.2em] border ${isStunnerStores ? 'bg-gradient-to-r from-violet-500 to-violet-600 shadow-violet-500/20 border-violet-400/20' : is420Hub ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20 border-emerald-400/20' : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/20 border-amber-400/20'}`}>
                    PROMO
                  </div>

                  {/* Shimmer Layer */}
                  <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent" />
                  </div>

                  {/* Subtle background glows */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full opacity-50 z-0 ${isStunnerStores ? 'bg-violet-500/10' : is420Hub ? 'bg-emerald-400/10' : 'bg-amber-400/10'}`} />
                  <div className={`absolute -bottom-10 -left-10 w-32 h-32 blur-[40px] rounded-full opacity-50 z-0 ${isStunnerStores ? 'bg-cyan-500/10' : is420Hub ? 'bg-emerald-600/10' : 'bg-purple-500/10'}`} />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform ${isStunnerStores ? 'bg-violet-500/10 border-violet-500/20' : is420Hub ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-amber-400/10 border-amber-400/20'}`}>
                        <Globe className={`w-4 h-4 ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`} />
                      </div>
                      <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isStunnerStores ? 'text-violet-400/80' : is420Hub ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>
                        POWERED BY <span className={isStunnerStores ? 'text-violet-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}>Compass 🧭 2026.</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center w-full">
                      <p className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Get your professional Website like
                      </p>
                      <p className="text-base sm:text-xl font-black text-white tracking-tight">
                        {firstStoreMeta?.name || 'this'}
                      </p>
                      <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mt-2 group-hover:gap-3 transition-all ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`}>
                        Tap to start <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.button>
        )}
      </div>
    </>
  );
}
