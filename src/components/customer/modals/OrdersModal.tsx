'use client';

import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ShoppingCart, Package, X } from 'lucide-react';
import { Order } from '../../../hooks/useOrders';
import { OrderDetailCard } from '../cards/OrderDetailCard';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  storeId: string;
  addOrder: (products: Product[], storeMeta: StoreMeta, customerInfo: Customer, referralCode: string | null, bonusApplied: boolean) => Promise<void>;
  storeMeta: StoreMeta;
  highlightOrderId?: string | null;
  onNotificationRequest?: () => Promise<{ success: boolean; error?: string }>;
}

const formatDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  addOrder,
  storeMeta,
  highlightOrderId,
  onNotificationRequest
}) => {
  const [hasRequestedNotifications, setHasRequestedNotifications] = React.useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      if (orders.length > 0 && !hasRequestedNotifications && onNotificationRequest) {
        if (Notification.permission === 'default' || Notification.permission === 'granted') {
          onNotificationRequest().then(() => {
            setHasRequestedNotifications(true);
          });
        }
      }
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, orders.length, hasRequestedNotifications, onNotificationRequest]);

  useEffect(() => {
    if (highlightOrderId && isOpen) {
      setTimeout(() => {
        const element = document.getElementById(`customer-order-${highlightOrderId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [highlightOrderId, isOpen]);

  const groupedOrders = useMemo(() => {
    if (!orders) return {};
    return orders.reduce((acc, order) => {
      const orderDate = new Date(order.orderDate).toDateString();
      if (!acc[orderDate]) acc[orderDate] = [];
      acc[orderDate].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
  }, [orders]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedOrders).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedOrders]);

  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* --- Header --- */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                My Orders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track your purchases</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {orders && orders.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {sortedDateKeys.map((dateKey) => (
                  <div key={dateKey}>
                    <h3 className="font-bold text-lg text-slate-600 dark:text-slate-300 mb-4 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm py-2 z-10">
                      {formatDateGroup(dateKey)}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {groupedOrders[dateKey].map(order => (
                        <motion.div
                          key={order.id}
                          variants={itemVariants}
                          id={`customer-order-${order.id}`}
                        >
                          <OrderDetailCard
                            order={order}
                            addOrder={addOrder}
                            storeMeta={storeMeta}
                            isHighlighted={highlightOrderId === order.id}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  <Package className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Orders Yet</h3>
                <p className="max-w-xs mt-2">When you buy something, your orders will show up here.</p>
              </div>
            )}
          </main>

          {/* --- Footer --- */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-800">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { OrdersModal };
