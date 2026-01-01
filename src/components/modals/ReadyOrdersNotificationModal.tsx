'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, MapPin, Package } from 'lucide-react';
import Image from 'next/image';
import { useOrderReadyNotification } from '@/context/OrderReadyNotificationContext';
import { formatPrice } from '@/utils/price';
import { Order } from '@/hooks/useOrders';

export const ReadyOrdersNotificationModal: React.FC = () => {
  const { unacknowledgedOrders, isLoading, acknowledgeAllOrders, acknowledgeOrder, closeModal, isModalOpen } = useOrderReadyNotification();
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const currentOrder = unacknowledgedOrders[0];
  const orderCount = unacknowledgedOrders.length;

  const currentOrderItems = currentOrder
    ? (currentOrder.products || []).reduce((sum: number, p: any) => sum + (p.quantity || 1), 0)
    : 0;

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleAcknowledge = async () => {
    if (!currentOrder) return;
    setIsAcknowledging(true);
    setIsAnimating(true);

    try {
      // play microanimation while acknowledging
      const ackPromise = acknowledgeOrder(currentOrder.orderId).catch(err => { throw err; });
      await Promise.all([ackPromise, sleep(450)]);
    } catch (error) {
      console.error('Error acknowledging order:', error);
    } finally {
      setIsAnimating(false);
      setIsAcknowledging(false);
    }
  };

  // Focus trap & history handling
  useEffect(() => {
    if (!isModalOpen) return;

    // push history state so back button closes modal first
    try {
      window.history.pushState({ readyOrdersModal: true }, '');
    } catch (e) { }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close visually; orders remain unacknowledged
        closeModal();
      }
      if (e.key === 'Tab' && modalRef.current) {
        // simple focus trap
        const focusable = modalRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);

    const onPop = (e: PopStateEvent) => {
      // when user presses back, close the modal
      closeModal();
    };
    window.addEventListener('popstate', onPop);

    // initial focus
    setTimeout(() => {
      const btn = modalRef.current?.querySelector('button');
      (btn as HTMLElement | undefined)?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPop);
      try {
        // if the history state we pushed is still current, go back to remove it
        if (window.history.state && (window.history.state as any).readyOrdersModal) {
          window.history.back();
        }
      } catch (e) { }
    };
  }, [isModalOpen, closeModal]);

  // footer measurement and padding for scroll area
  useEffect(() => {
    const adjust = () => {
      if (!scrollRef.current || !footerRef.current) return;
      const footerH = footerRef.current.offsetHeight || 0;
      const safeInset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0', 10) || 0;
      scrollRef.current.style.paddingBottom = `${footerH + safeInset + 16}px`;
    };
    adjust();
    window.addEventListener('resize', adjust);
    return () => window.removeEventListener('resize', adjust);
  }, []);

  // Don't render until ready
  if (isLoading || !isModalOpen || !currentOrder) {
    return null;
  }

  const totalItems = unacknowledgedOrders.reduce((sum, order) => {
    return sum + (order.products?.reduce((itemSum, p: any) => itemSum + (p.quantity || 1), 0) || 0);
  }, 0);


  const portalContent = (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={(e) => { e.preventDefault(); }}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              maxHeight: 'calc(var(--dvh, 1vh) * 100 - var(--header-height, 64px))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Green Theme */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-4 sm:py-8 text-white flex-shrink-0 ready-orders-modal__header"
              style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))', maxHeight: 'calc(var(--dvh, 1vh) * 50)' }}>
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="ready-modal-title text-2xl sm:text-3xl font-bold flex items-center gap-3 break-words">
                    🎉 Order Ready! <span className="text-sm sm:text-base font-medium opacity-90">({1} of {orderCount})</span>
                  </h2>
                </div>
                <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 font-semibold text-sm sm:text-lg">
                  {orderCount} {orderCount === 1 ? 'Order' : 'Orders'}
                </div>
              </div>
              <p className="text-green-50 text-sm mt-2">
                {currentOrderItems} item{currentOrderItems !== 1 ? 's' : ''} ready for you
              </p>
            </div>

            {/* Scrollable Current Order */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <motion.div
                key={currentOrder.orderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-green-200 dark:border-green-900/30 rounded-2xl bg-green-50/50 dark:bg-green-900/10 p-4 hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-green-200 dark:border-green-900/30">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Order</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      #{currentOrder.orderId?.slice(-6) || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(
                        (currentOrder.products || []).reduce((sum, p: any) => sum + (p.price * (p.quantity || 1)), 0)
                      )}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {(currentOrder.products || []).map((product: any, pidx) => (
                    <div key={pidx} className="flex items-start gap-3">
                      {product.images?.[0] && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product.quantity || 1} × {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Info */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    {currentOrder.deliveryMethod === 'pickup' ? (
                      <>
                        <Package className="w-4 h-4 text-green-600" />
                        <span>Ready for Pickup</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span>For Delivery</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {currentOrder.orderDate
                      ? (() => {
                        const date = currentOrder.orderDate instanceof Object && 'toDate' in currentOrder.orderDate
                          ? (currentOrder.orderDate as any).toDate()
                          : new Date(currentOrder.orderDate as any);
                        return date.toLocaleDateString();
                      })()
                      : 'Date N/A'}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Footer - Sticky Action */}
            <div ref={footerRef} className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 py-4 flex-shrink-0" style={{ position: 'sticky', bottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <button
                onClick={handleAcknowledge}
                disabled={isAcknowledging || isAnimating}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isAnimating ? (
                  <>
                    <div className="rounded-full h-5 w-5 bg-white/20 flex items-center justify-center animate-pulse">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span>Acknowledged</span>
                  </>
                ) : isAcknowledging ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Acknowledging...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Got It!</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                You can view order details anytime in your orders
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(portalContent, document.body);
};
