'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Repeat, MessageSquare, Clock, ReceiptIcon, CheckCircle, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Order } from '../../../hooks/useOrders';
import { formatPrice } from '../../../utils/price';
import { ReceiptModal } from '../../modals/ReceiptModal';
import { useCustomer } from '@/context/CustomerContext';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';

interface OrderDetailCardProps {
  order: Order;
  addOrder: (products: Product[], storeMeta: StoreMeta, customerInfo: Customer, referralCode: string | null, bonusApplied: boolean) => Promise<void>;
  storeMeta: StoreMeta;
  isHighlighted?: boolean;
}

const getStatusUI = (status: Order['orderStatus']) => {
  switch (status) {
    case 'shipped':
      return { icon: <Truck className="w-4 h-4" />, text: 'Shipped', color: 'text-blue-400' };
    case 'ready':
      return { icon: <CheckCircle className="w-4 h-4" />, text: 'Ready for Pickup', color: 'text-green-400' };
    case 'partially-ready':
      return { icon: <CheckCircle className="w-4 h-4" />, text: 'Partially Ready', color: 'text-yellow-400' };
    case 'processing':
    default:
      return { icon: <Clock className="w-4 h-4" />, text: 'Processing', color: 'text-yellow-400' };
  }
};

export function OrderDetailCard({ order, addOrder, storeMeta, isHighlighted }: OrderDetailCardProps) {
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const { customer } = useCustomer();

  // Backward compatibility: Handle both new multi-product orders and old single-product orders.
  const products = order.products || [];

  const handleReorder = async () => {
    if (!customer) {
      toast.error('Please log in to reorder.');
      return;
    }

    if (!storeMeta || !storeMeta.whatsapp) {
      toast.error("Seller's contact information is not available.");
      return;
    }

    try {
      // FIX: Use the backward-compatible 'products' array.
      await addOrder(products, storeMeta, customer, null, false);

      const sanitizedWhatsappNumber = storeMeta.whatsapp.replace(/\D/g, '');
      const productDetails = products.map(p => `* ${p.name} (Qty: ${p.productType === 'general' ? p.quantity : 1})`).join('\n');

      const message = `*Reorder Request*\n\nI would like to reorder the following items:\n${productDetails}`;

      const whatsappUrl = `https://wa.me/${sanitizedWhatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Reorder placed successfully!');

    } catch (error) {
      console.error("Failed to place reorder:", error);
      toast.error('There was an issue placing your reorder.');
    }
  };

  const handleDispute = () => {
    console.log('Dispute initiated for order:', order.id);
    toast.success('Dispute functionality will be added soon!');
  };

  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // FIX: Use the backward-compatible 'products' array for calculation.
  const totalAmount = products.reduce((acc, p) => acc + p.price * (p.productType === 'general' ? p.quantity : 1), 0);
  const statusInfo = getStatusUI(order.orderStatus);

  return (
    <>
      <div className={`bg-card-background rounded-2xl shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl ${isHighlighted ? 'ring-2 ring-green-500 shadow-lg shadow-green-500/20' : ''
        }`}>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg card-text-gradient truncate">Order #{order.id.substring(0, 6)}</p>
              <p className="text-sm text-text-secondary">Placed on {orderDate}</p>
            </div>
            <div className={`flex items-center gap-2 text-sm font-medium ${statusInfo.color}`}>
              {isHighlighted && order.orderStatus === 'ready' ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, repeat: 2, repeatType: "reverse" }}
                  className="flex items-center gap-2"
                >
                  {statusInfo.icon}
                  <span>{statusInfo.text}</span>
                </motion.div>
              ) : (
                <>
                  {statusInfo.icon}
                  <span>{statusInfo.text}</span>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* FIX: Use the backward-compatible 'products' array for rendering. */}
            {products.map((product, index) => {
              // Defensive check for images, as legacy product objects might not have an 'images' array.
              const imageUrl = product.images && product.images.length > 0 ? product.images[0] : undefined;
              return (
                <div key={product.id || index} className="flex items-center gap-3">
                  <div className="w-12 h-12 relative flex-shrink-0">
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        layout="fill"
                        className="object-cover rounded-md"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary text-sm">{product.name}</p>
                    <p className="text-xs text-text-secondary">Qty: {product.productType === 'general' ? product.quantity : 1}</p>
                  </div>
                  <p className="font-semibold text-text-primary text-sm">{formatPrice(product.price * (product.productType === 'general' ? product.quantity : 1))}</p>
                </div>
              );
            })}
          </div>

          {order.orderNotes && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Special Instructions</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{order.orderNotes}"</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border-color flex justify-between items-center">
            <p className="font-semibold text-text-secondary">Total</p>
            <p className="text-lg font-bold text-purple-400">{formatPrice(totalAmount)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-border-color">
          <button
            onClick={handleReorder}
            className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-text-secondary hover:bg-zinc-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            <Repeat className="w-4 h-4" />
            <span>Reorder</span>
          </button>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-text-secondary hover:bg-zinc-700 transition-colors duration-200 ease-in-out border-l border-border-color focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            <ReceiptIcon className={isReceiptModalOpen ? "w-4 h-4 text-purple-400" : "w-4 h-4"} />
            <span>Receipt</span>
          </button>
          <button
            onClick={handleDispute}
            className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-text-secondary hover:bg-zinc-700 transition-colors duration-200 ease-in-out border-l border-border-color focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Dispute</span>
          </button>
        </div>
      </div>
      {/* The ReceiptModal already accepts an 'order' array and should be compatible */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        orders={[{
          ...order,
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            quantity: p.productType === 'general' ? p.quantity : 1,
            selectedSize: (p as any).selectedSize
          }))
        }]} // The modal expects an array of orders 
      />
    </>
  );
}
