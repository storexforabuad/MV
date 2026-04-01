'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { StoreOrder } from '@/app/actions/orderActions';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';

interface MarkOrderReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: StoreOrder;
  onConfirm: (order: StoreOrder, productIds: string[]) => void;
  isUpdating: boolean;
}

const OrderProduct = ({ product, isSelected, onSelect }: { product: any, isSelected: boolean, onSelect: (productId: string) => void }) => {
  return (
    <div
      onClick={() => onSelect(product.id)}
      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-green-100 dark:bg-green-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
      <div className="flex-shrink-0">
        <div className="aspect-square w-14 h-14 relative rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700">
          <Image
            src={product.images[0]}
            alt={product.name}
            layout="fill"
            objectFit="cover"
          />
        </div>
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
        <p className="text-sm text-green-500 dark:text-green-400">{formatPrice(product.price)}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Qty: {product.quantity}</p>
      </div>
      <div className="flex-shrink-0">
        {isSelected ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full" />
        )}
      </div>
    </div>
  )
}

export const MarkOrderReadyModal = ({ isOpen, onClose, order, onConfirm, isUpdating }: MarkOrderReadyModalProps) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const handleSelectProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleConfirm = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }
    onConfirm(order, selectedProductIds);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mark Products as Ready</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </header>

            <main className="p-4 flex-grow overflow-y-auto">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Select the products that are ready for shipment. The order will be moved to the Deliveries Hub.</p>
              <div className="space-y-3">
                {order.products.map(product => (
                  <OrderProduct
                    key={product.id}
                    product={product}
                    isSelected={selectedProductIds.includes(product.id)}
                    onSelect={handleSelectProduct}
                  />
                ))}
              </div>
            </main>

            <footer className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 flex-shrink-0 flex justify-end items-center gap-4">
              <button
                onClick={onClose}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isUpdating || selectedProductIds.length === 0}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Confirming...' : `Confirm (${selectedProductIds.length})`}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
