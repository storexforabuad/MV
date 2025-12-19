'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, MapPin, Phone, CheckCircle, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { StoreOrder, updateOrderStatus } from '@/app/actions/orderActions';
import { formatPrice } from '@/utils/price';
import { useState, useTransition, useEffect } from 'react';
import { toast } from 'react-hot-toast';
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
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : product.image;

  return (
    <div className="flex items-start gap-4 py-3">
      <div className="flex-shrink-0">
        <div className="aspect-square w-16 h-16 relative rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700">
          {imageUrl && (
            <Image src={imageUrl} alt={product.name} layout="fill" objectFit="cover" />
          )}
        </div>
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {product.selectedSize && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              Size: {product.selectedSize}
            </span>
          )}
          {product.selectedSpiciness && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800">
              {product.selectedSpiciness === 'mild' && '😌 Mild'}
              {product.selectedSpiciness === 'medium' && '🌶️ Medium'}
              {product.selectedSpiciness === 'hot' && '🔥 Hot'}
              {product.selectedSpiciness === 'extra-hot' && '🤯 Extra Hot'}
            </span>
          )}
          {product.temperature && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              {product.temperature === 'hot' && '☕ Hot'}
              {product.temperature === 'cold' && '❄️ Cold'}
              {product.temperature === 'room-temp' && '🌡️ Room'}
            </span>
          )}
        </div>
        {product.specialInstructions && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
            <span className="font-semibold">Note:</span> {product.specialInstructions}
          </div>
        )}
        <p className="text-sm text-orange-500 dark:text-orange-400 mt-1">{formatPrice(product.price)}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Qty: {product.quantity || 1}</p>
      </div>
    </div>
  );
};

const CustomerOrdersCard = ({ order, onMarkReady, isHighlighted }: { order: StoreOrder, onMarkReady: (order: StoreOrder) => void, isHighlighted?: boolean }) => {
  const { customerInfo, products } = order;

  return (
    <motion.div
      id={`order-${order.id}`}
      className={`bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md ${isHighlighted
        ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
        : 'border-slate-100 dark:border-slate-700/50'
        }`}
      animate={isHighlighted ? {
        scale: [1, 1.02, 1],
      } : {}}
      transition={{ duration: 0.5, repeat: 3 }}
    >
      {customerInfo && (
        <div className="p-5 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{customerInfo.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customer</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${customerInfo.phoneNumber}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">
                <Phone className="w-5 h-5" />
              </a>
              <a href={`https://wa.me/${customerInfo.phoneNumber.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="space-y-3 pl-1">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{customerInfo.phoneNumber}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{customerInfo.deliveryAddress.street}, {customerInfo.deliveryAddress.state}</span>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-700/50 px-5 py-2">
        {products.map((product: any, index: number) => (
          <OrderProductRow key={product.id || index} product={product} />
        ))}
      </div>

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