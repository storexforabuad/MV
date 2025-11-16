'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, ShoppingBag, User, MapPin, Phone, ReceiptIcon, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { StoreOrder, updateOrderStatus } from '@/app/actions/orderActions';
import { formatPrice } from '@/utils/price';
import { useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';
import { ReceiptModal } from '../../modals/ReceiptModal';
import { MarkOrderReadyModal } from './MarkOrderReadyModal';

interface AdminOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: StoreOrder[];
  onOrderUpdated: () => void; // Callback to refetch orders
  storeId: string;
}

const modalVariants: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: '0%', opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 150 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

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
        <p className="text-sm text-indigo-500 dark:text-indigo-400">{formatPrice(product.price)}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Qty: {product.quantity || 1}</p>
      </div>
    </div>
  );
};

const CustomerOrdersCard = ({ order, onViewReceipt, onMarkReady }: { order: StoreOrder, onViewReceipt: (order: StoreOrder) => void, onMarkReady: (order: StoreOrder) => void }) => {
  const { customerInfo, products } = order;

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-[1.02]">
      {customerInfo && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <h4 className="font-semibold text-md text-slate-700 dark:text-slate-200">{customerInfo.name}</h4>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">{customerInfo.phoneNumber}</span>
                </div>
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">{customerInfo.deliveryAddress.street}, {customerInfo.deliveryAddress.state}</span>
                </div>
            </div>
        </div>
      )}

      <div className="divide-y divide-slate-200 dark:divide-slate-700/50 px-4">
        {products.map((product: any, index: number) => (
          <OrderProductRow key={product.id || index} product={product} />
        ))}
      </div>

      <div className="p-2 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
          <button onClick={() => onViewReceipt(order)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
              <ReceiptIcon className="w-4 h-4" />
              <span>View Receipt</span>
          </button>
          <button onClick={() => onMarkReady(order)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
              <CheckCircle className="w-4 h-4" />
              <span>Mark as Ready</span>
          </button>
      </div>
    </div>
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

export const AdminOrdersModal = ({ isOpen, onClose, orders, onOrderUpdated, storeId }: AdminOrdersModalProps) => {
  const [isPending, startTransition] = useTransition();
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<StoreOrder | null>(null);
  const [selectedOrderForReadiness, setSelectedOrderForReadiness] = useState<StoreOrder | null>(null);

  const groupedOrders = groupOrdersByDay(orders);

  const handleMarkReady = (order: StoreOrder) => {
      setSelectedOrderForReadiness(order);
  }

  const handleConfirmMarkReady = (order: StoreOrder, productIds: string[]) => {
    startTransition(async () => {
        try {
            await updateOrderStatus(storeId, order.id, productIds);
            toast.success('Order status updated!');
            onOrderUpdated(); // This will trigger a refetch in the parent component
            setSelectedOrderForReadiness(null); // Close the readiness modal
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
        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="fixed bottom-0 left-0 right-0 top-0 sm:top-auto sm:bottom-auto h-full w-full bg-slate-100 dark:bg-slate-900 shadow-2xl flex flex-col z-50 sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">All Store Orders ({orders.length})</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close orders modal">
                <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </button>
            </header>

            <main className="flex-grow p-4 overflow-y-auto">
              {orders.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedOrders).map(([day, dayOrders]) => (
                    <div key={day}>
                      <h3 className="font-bold text-lg text-slate-600 dark:text-slate-300 mb-3">{day}</h3>
                      <div className="space-y-4">
                        {dayOrders.map((order) => (
                          <CustomerOrdersCard key={order.id} order={order} onViewReceipt={setSelectedOrderForReceipt} onMarkReady={handleMarkReady} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                  <ShoppingBag className="w-16 h-16 mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold">No Orders Yet</h3>
                  <p className="max-w-xs mt-2">As soon as customers place orders, they will appear here.</p>
                </div>
              )}
            </main>
          </motion.div>
        </motion.div>
      )}
      {selectedOrderForReceipt && (
        <ReceiptModal isOpen={!!selectedOrderForReceipt} onClose={() => setSelectedOrderForReceipt(null)} orders={[selectedOrderForReceipt]} />
      )}
      {selectedOrderForReadiness && (
          <MarkOrderReadyModal isOpen={!!selectedOrderForReadiness} onClose={handleCloseMarkReadyModal} order={selectedOrderForReadiness} onConfirm={handleConfirmMarkReady} isUpdating={isPending} />
      )}
    </AnimatePresence>
  );
};