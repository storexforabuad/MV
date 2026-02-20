'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Repeat, MessageSquare, Clock, CheckCircle, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Order } from '../../../hooks/useOrders';
import { formatPrice } from '../../../utils/price';
import { useCustomer } from '@/context/CustomerContext';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import { CartItem } from '@/lib/cartContext';

interface OrderDetailCardProps {
  order: Order;
  addOrder: (products: (Product | CartItem)[], storeMeta: StoreMeta, customerInfo: Customer, referralCode: string | null, bonusApplied?: boolean, deliveryMethod?: "home" | "pickup", orderNotes?: string, paymentEvidenceUrl?: string, paymentEvidenceFileName?: string) => Promise<any>;
  storeMeta: StoreMeta;
  isHighlighted?: boolean;
  onReorder?: (order: Order) => void;
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

export function OrderDetailCard({ order, addOrder, storeMeta, isHighlighted, onReorder }: OrderDetailCardProps) {
  const [isReordering, setIsReordering] = useState(false);
  const { customer } = useCustomer();

  // Backward compatibility: Handle both new multi-product orders and old single-product orders.
  const products = order.products || [];

  const handleReorder = async () => {
    if (onReorder) {
      onReorder(order);
    }
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
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((product as any).selectedSize) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Size: {(product as any).selectedSize}
                        </span>
                      )}
                      {((product as any).selectedSpiciness) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800">
                          {(product as any).selectedSpiciness === 'mild' && '😌 Mild'}
                          {(product as any).selectedSpiciness === 'medium' && '🌶️ Medium'}
                          {(product as any).selectedSpiciness === 'hot' && '🔥 Hot'}
                          {(product as any).selectedSpiciness === 'extra-hot' && '🤯 Extra Hot'}
                        </span>
                      )}
                      {((product as any).temperature) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                          {(product as any).temperature === 'hot' && '☕ Hot'}
                          {(product as any).temperature === 'cold' && '❄️ Cold'}
                          {(product as any).temperature === 'room-temp' && '🌡️ Room'}
                        </span>
                      )}
                    </div>
                    {((product as any).specialInstructions) && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                        <span className="font-semibold">Note:</span> {(product as any).specialInstructions}
                      </div>
                    )}
                    <p className="text-xs text-text-secondary mt-1">Qty: {product.productType === 'general' ? product.quantity : 1}</p>
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
        <div className="flex border-t border-border-color">
          <button
            onClick={handleReorder}
            disabled={isReordering}
            className="flex-1 flex items-center justify-center gap-2 p-3 text-sm font-bold text-text-secondary hover:bg-zinc-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Repeat className="w-4 h-4" />
            <span>Reorder Now</span>
          </button>
        </div>
      </div>
    </>
  );
}
