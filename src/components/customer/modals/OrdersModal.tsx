'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '../../../hooks/useOrders';
import { OrderDetailCard } from '../cards/OrderDetailCard';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  storeId: string; // Keep for future context-aware actions if needed
}

const OrdersModal: React.FC<OrdersModalProps> = ({ isOpen, onClose, orders }) => {

  const handleClose = () => {
    // Allow for exit animation before truly closing
    onClose();
  }

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
                <div className="relative flex w-full flex-col overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-2xl h-screen md:h-[90vh] md:rounded-2xl">

                  {/* Header */}
                  <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                    <Dialog.Title as="h3" className="text-xl font-bold text-slate-800 dark:text-slate-100">My Orders</Dialog.Title>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <XMarkIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>

                  {/* Order List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <AnimatePresence>
                      {orders && orders.length > 0 ? (
                        <motion.div 
                          className="grid grid-cols-1 gap-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
                        >
                          {orders.map(order => (
                            <motion.div key={order.product.id + order.orderDate} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                              <OrderDetailCard order={order} />
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
                          <ShoppingCartIcon className="w-24 h-24 text-slate-300 dark:text-slate-600 mb-4" />
                          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Orders Yet</h3>
                          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                            When you buy something, your orders will show up here.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 border-t border-slate-200 dark:border-slate-700">
                      <button onClick={handleClose} className="w-full bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 font-semibold py-3 px-4 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors duration-200">
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
