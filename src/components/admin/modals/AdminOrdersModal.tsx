'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, User, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import { StoreOrder } from '@/app/actions/orderActions';
import { formatPrice } from '@/utils/price';

interface AdminOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: StoreOrder[];
}

const modalVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: '0%', opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 150 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const AdminOrderDetailCard = ({ order }: { order: StoreOrder }) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-[1.02]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-4 items-start">
        {/* Product Image */}
        <div className="col-span-3">
          <div className="aspect-square relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
            <Image 
              src={order.product.images[0]} 
              alt={order.product.name} 
              layout="fill" 
              objectFit="cover" 
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Product & Order Info */}
        <div className="col-span-9 flex flex-col justify-center">
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{order.product.name}</p>
            <p className="text-md font-semibold text-indigo-500 dark:text-indigo-400">{formatPrice(order.product.price)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Qty: {order.quantity}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Ordered on: {new Date(order.orderDate).toLocaleString()}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 mb-3">
          <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <h4 className="font-semibold text-md text-slate-700 dark:text-slate-200">{order.customerInfo.name}</h4>
        </div>
        <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">{order.customerInfo.phoneNumber}</span>
            </div>
            <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">{order.customerInfo.deliveryAddress.street}, {order.customerInfo.deliveryAddress.city}, {order.customerInfo.deliveryAddress.state} - {order.customerInfo.deliveryAddress.zip}</span>
            </div>
        </div>
      </div>
    </div>
  );
}

export const AdminOrdersModal = ({ isOpen, onClose, orders }: AdminOrdersModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 top-0 sm:top-auto sm:bottom-auto h-full w-full bg-slate-100 dark:bg-slate-900 shadow-2xl flex flex-col z-50"
            style={{ maxHeight: '100vh', maxWidth: '100vw' }}
          >
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">All Store Orders ({orders.length})</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close orders modal"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </button>
            </header>

            {/* Orders List */}
            <main className="flex-grow p-4 overflow-y-auto">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => (
                    <AdminOrderDetailCard key={order.id} order={order} />
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
    </AnimatePresence>
  );
};
