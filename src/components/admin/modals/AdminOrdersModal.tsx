'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, MapPin, CheckCircle, Phone, MessageCircle, User, Package } from 'lucide-react';
import { StoreOrder, updateOrderStatus } from '@/app/actions/orderActions';
import { formatPrice } from '@/utils/price';
import { Naira } from '@/components/common/Naira';
import toast from 'react-hot-toast';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import PaymentEvidenceViewer from './PaymentEvidenceViewer';
import { MarkOrderReadyModal } from './MarkOrderReadyModal';

interface AdminOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: StoreOrder[];
  onOrderUpdated: () => void;
  storeId: string;
  highlightOrderId?: string | null;
}

const OrderProductRow = ({ product }: { product: any }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Package className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {product.quantity}</p>
        </div>
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white">
        <Naira />{product.price.toLocaleString()}
      </p>
    </div>
  );
};

const CustomerOrdersCard = ({ order, onMarkReady, isHighlighted }: { order: StoreOrder, onMarkReady: (order: StoreOrder) => void, isHighlighted?: boolean }) => {
  const { customerInfo, products } = order;
  const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(customerInfo.phoneNumber)}`;

  return (
    <motion.div
      id={`order-${order.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-900 rounded-2xl border ${isHighlighted ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-200 dark:border-slate-800'} overflow-hidden shadow-sm`}
    >
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{customerInfo.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Order #{order.id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${customerInfo.phoneNumber}`}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {customerInfo.deliveryAddress.street}, {customerInfo.deliveryAddress.state}
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/50 px-5 py-2">
        {products.map((product: any, index: number) => (
          <OrderProductRow key={product.id || index} product={product} />
        ))}
      </div>

      {order.paymentEvidenceUrl && (
        <PaymentEvidenceViewer
          paymentEvidenceUrl={order.paymentEvidenceUrl}
          paymentEvidenceFileName={order.paymentEvidenceFileName}
          paymentEvidenceUploadedAt={order.paymentEvidenceUploadedAt}
          paymentStatus={order.paymentStatus}
        />
      )}

      <button
        onClick={() => onMarkReady(order)}
        disabled={order.orderStatus === 'ready'}
        className={`w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white transition-colors rounded-b-2xl rounded-t-none mt-2 ${order.orderStatus === 'ready'
          ? 'bg-slate-400 cursor-not-allowed'
          : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
          }`}
      >
        <CheckCircle className="w-5 h-5" />
        <span>{order.orderStatus === 'ready' ? 'Shipped' : 'Mark as Ready'}</span>
      </button>
    </motion.div>
  );
};

const groupOrdersByDay = (orders: StoreOrder[]) => {
  const groups: { [day: string]: StoreOrder[] } = {};
  orders.forEach(order => {
    const orderDate = new Date(order.orderDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let dayKey: string;
    if (orderDate.toDateString() === today.toDateString()) dayKey = 'Today';
    else if (orderDate.toDateString() === yesterday.toDateString()) dayKey = 'Yesterday';
    else dayKey = orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(order);
  });
  return groups;
};

export const AdminOrdersModal = ({ isOpen, onClose, orders, onOrderUpdated, storeId, highlightOrderId }: AdminOrdersModalProps) => {
  const [isPending, startTransition] = useTransition();
  const [selectedOrderForReadiness, setSelectedOrderForReadiness] = useState<StoreOrder | null>(null);

  const groupedOrders = groupOrdersByDay(orders);
  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  // Auto-scroll to highlighted order
  useEffect(() => {
    if (highlightOrderId && isOpen) {
      setTimeout(() => {
        const element = document.getElementById(`order-${highlightOrderId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // Delay for modal animation
    }
  }, [highlightOrderId, isOpen]);

  const handleMarkReady = (order: StoreOrder) => {
    setSelectedOrderForReadiness(order);
  }

  const handleConfirmMarkReady = (order: StoreOrder, productIds: string[]) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(storeId, order.id, productIds);
        toast.success('Order status updated!');
        onOrderUpdated();
        setSelectedOrderForReadiness(null);
      } catch (error) {
        toast.error('Failed to update order status.');
        console.error(error);
      }
    });
  };

  const handleCloseMarkReadyModal = () => {
    setSelectedOrderForReadiness(null);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          initial="hidden" animate="visible" exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* --- Header --- */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                All Store Orders ({orders.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your orders</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {orders.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedOrders).map(([day, dayOrders]) => (
                  <div key={day}>
                    <h3 className="font-bold text-lg text-slate-600 dark:text-slate-300 mb-3">{day}</h3>
                    <div className="space-y-4">
                      {dayOrders.map((order) => (
                        <CustomerOrdersCard
                          key={order.id}
                          order={order}
                          onMarkReady={handleMarkReady}
                          isHighlighted={highlightOrderId === order.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                <ShoppingCart className="w-16 h-16 mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold">No Orders Yet</h3>
                <p className="max-w-xs mt-2">As soon as customers place orders, they will appear here.</p>
              </div>
            )}
          </main>

          {/* --- Footer --- */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </footer>
        </motion.div>
      )}
      {selectedOrderForReadiness && (
        <MarkOrderReadyModal isOpen={!!selectedOrderForReadiness} onClose={handleCloseMarkReadyModal} order={selectedOrderForReadiness} onConfirm={handleConfirmMarkReady} isUpdating={isPending} />
      )}
    </AnimatePresence>
  );
};