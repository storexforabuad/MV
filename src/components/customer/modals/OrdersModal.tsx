'use client';

import React, { useMemo, useEffect, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ShoppingCart, Package, X } from 'lucide-react';
import { useModalBackNavigation } from '@/hooks/useModalBackNavigation';
import { Order } from '../../../hooks/useOrders';
import { OrderDetailCard } from '../cards/OrderDetailCard';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { CartItem } from '@/lib/cartContext';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  storeId: string;
  addOrder: (products: (Product | CartItem)[], storeMeta: StoreMeta, customerInfo: Customer, referralCode: string | null, bonusApplied?: boolean, deliveryMethod?: "home" | "pickup", orderNotes?: string, paymentEvidenceUrl?: string, paymentEvidenceFileName?: string) => Promise<Order>;
  storeMeta: StoreMeta;
  highlightOrderId?: string | null;
  onNotificationRequest?: () => Promise<{ success: boolean; error?: string }>;
  onReorder?: (order: Order) => void;
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

const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  addOrder,
  storeMeta,
  highlightOrderId,
  onNotificationRequest,
  onReorder
}) => {
  const [hasRequestedNotifications, setHasRequestedNotifications] = React.useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle back button navigation
  useModalBackNavigation(isOpen, onClose, 'orders-modal');

  useEffect(() => {
    if (isOpen && orders.length > 0 && !hasRequestedNotifications && onNotificationRequest) {
      if (Notification.permission === 'default' || Notification.permission === 'granted') {
        onNotificationRequest().then(() => {
          setHasRequestedNotifications(true);
        });
      }
    }
  }, [isOpen, orders.length, hasRequestedNotifications, onNotificationRequest]);

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

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-t-[2rem] bg-white dark:bg-modal-background text-left align-middle shadow-2xl transition-all flex flex-col max-h-[92vh] sm:max-w-2xl sm:rounded-2xl sm:max-h-[85vh]">

                {/* Handle Bar for Mobile */}
                <div className="flex-shrink-0 pt-3 pb-1 flex justify-center sm:hidden">
                  <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-modal-background">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      My Orders
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Track your purchases</p>
                  </div>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors shadow-sm"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Content */}
                <div ref={scrollContainerRef} className="flex-grow overflow-y-auto">
                  <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
                    {orders && orders.length > 0 ? (
                      <div className="space-y-8">
                        {sortedDateKeys.map((dateKey) => (
                          <div key={dateKey}>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 sticky top-0 bg-white/95 dark:bg-modal-background/95 backdrop-blur-md py-3 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-100/50 dark:border-gray-800/50">
                              {formatDateGroup(dateKey)}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                              {groupedOrders[dateKey].map(order => (
                                <div
                                  key={order.id}
                                  id={`customer-order-${order.id}`}
                                >
                                  <OrderDetailCard
                                    order={order}
                                    addOrder={addOrder}
                                    storeMeta={storeMeta}
                                    isHighlighted={highlightOrderId === order.id}
                                    onReorder={onReorder}
                                    storeId={storeMeta?.id}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                          <Package className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Orders Yet</h3>
                        <p className="max-w-xs mt-2 text-gray-500 dark:text-gray-400">When you buy something, your orders will show up here.</p>
                      </div>
                    )}
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
