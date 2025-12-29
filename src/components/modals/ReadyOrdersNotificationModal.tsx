'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, MapPin, Package } from 'lucide-react';
import Image from 'next/image';
import { useOrderReadyNotification } from '@/context/OrderReadyNotificationContext';
import { formatPrice } from '@/utils/price';
import { Order } from '@/hooks/useOrders';

export const ReadyOrdersNotificationModal: React.FC = () => {
  const { unacknowledgedOrders, isLoading, acknowledgeAllOrders, closeModal, isModalOpen } = useOrderReadyNotification();
  const [isAcknowledging, setIsAcknowledging] = React.useState(false);

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      await acknowledgeAllOrders(unacknowledgedOrders.map(o => o.orderId));
    } catch (error) {
      console.error('Error acknowledging orders:', error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isLoading || !isModalOpen || unacknowledgedOrders.length === 0) {
    return null;
  }

  const orderCount = unacknowledgedOrders.length;
  const totalItems = unacknowledgedOrders.reduce((sum, order) => {
    return sum + (order.products?.reduce((itemSum, p: any) => itemSum + (p.quantity || 1), 0) || 0);
  }, 0);

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => {
            // Prevent closing by backdrop click
            e.preventDefault();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Green Theme */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-white flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  🎉 Order Ready!
                </h2>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 font-semibold text-lg">
                  {orderCount} {orderCount === 1 ? 'Order' : 'Orders'}
                </div>
              </div>
              <p className="text-green-50 text-sm mt-2">
                {totalItems} item{totalItems !== 1 ? 's' : ''} ready for you
              </p>
            </div>

            {/* Scrollable Orders List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {unacknowledgedOrders.map((order, idx) => (
                <motion.div
                  key={order.orderId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border-2 border-green-200 dark:border-green-900/30 rounded-2xl bg-green-50/50 dark:bg-green-900/10 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-green-200 dark:border-green-900/30">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Order</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        #{order.orderId?.slice(-6) || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatPrice(
                          (order.products || []).reduce((sum, p: any) => sum + (p.price * (p.quantity || 1)), 0)
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {(order.products || []).map((product: any, pidx) => (
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
                      {order.deliveryMethod === 'pickup' ? (
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
                      {order.orderDate
                        ? (() => {
                            const date = order.orderDate instanceof Object && 'toDate' in order.orderDate 
                              ? (order.orderDate as any).toDate() 
                              : new Date(order.orderDate as any);
                            return date.toLocaleDateString();
                          })()
                        : 'Date N/A'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer - Sticky Action */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex-shrink-0">
              <button
                onClick={handleAcknowledge}
                disabled={isAcknowledging}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isAcknowledging ? (
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
};
