'use client';

import React, { Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ShoppingCartIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
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
  addOrder: (product: Product, storeMeta: StoreMeta, quantity: number, customerInfo: Customer, referralCode: string | null, bonusApplied: boolean) => Promise<void>;
  storeMeta: StoreMeta;
}

// Helper function to format the date header
const formatDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const OrdersModal: React.FC<OrdersModalProps> = ({ isOpen, onClose, orders, addOrder, storeMeta }) => {

  const handleClose = () => {
    onClose();
  }

  const groupedOrders = useMemo(() => {
    if (!orders) return {};

    return orders.reduce((acc, order) => {
      const orderDate = new Date(order.orderDate).toDateString();
      if (!acc[orderDate]) {
        acc[orderDate] = [];
      }
      acc[orderDate].push(order);
      return acc;
    }, {} as Record<string, Order[]>);

  }, [orders]);

  const sortedDateKeys = useMemo(() => {
      return Object.keys(groupedOrders).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedOrders]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* --- Overlay --- */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        {/* --- Modal Content --- */}
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95"
              enterTo="opacity-100 translate-y-0 md:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 md:scale-100"
              leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95"
            >
              <Dialog.Panel className="relative flex w-full max-w-2xl transform text-left text-base transition md:my-8">
                <div className="relative flex w-full flex-col overflow-hidden bg-background shadow-2xl h-screen md:h-[90vh] md:rounded-2xl">

                  {/* Header */}
                  <div className="p-4 flex justify-between items-center border-b border-border-color sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                      <Dialog.Title as="h3" className="text-xl font-bold card-text-gradient">My Orders</Dialog.Title>
                    </div>
                    <ShoppingCartIcon className="h-6 w-6 text-text-secondary" />
                  </div>

                  {/* Order List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <AnimatePresence>
                      {orders && orders.length > 0 ? (
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          {sortedDateKeys.map((dateKey, index) => (
                            <motion.div 
                                key={dateKey} 
                                className="mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                            >
                              <h4 className="font-bold text-lg card-text-gradient mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-2">{formatDateGroup(dateKey)}</h4>
                              <div className="grid grid-cols-1 gap-4">
                                {groupedOrders[dateKey].map(order => (
                                  <motion.div 
                                    key={order.product.id + order.orderDate} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                  >
                                    <OrderDetailCard order={order} addOrder={addOrder} storeMeta={storeMeta} />
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="empty-state"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center h-full text-center"
                        >
                          <ShoppingCartIcon className="w-24 h-24 text-zinc-600 mb-4" />
                          <h3 className="text-xl font-semibold text-text-primary">No Orders Yet</h3>
                          <p className="text-text-secondary mt-2 max-w-xs">
                            When you buy something, your orders will show up here.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="bg-background/80 backdrop-blur-sm p-4 border-t border-border-color">
                      <button onClick={handleClose} className="w-full bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 font-semibold py-3 px-4 rounded-full hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors duration-200">
                        Done
                      </button>
                    </div>
                  </div>

                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export { OrdersModal };
