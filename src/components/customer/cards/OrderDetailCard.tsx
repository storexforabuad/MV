'use client';

import React from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Repeat, MessageSquare, CheckCircle } from 'lucide-react';
import { Order } from '../../../hooks/useOrders';
import { formatPrice } from '../../../utils/price';

interface OrderDetailCardProps {
  order: Order;
}

export function OrderDetailCard({ order }: OrderDetailCardProps) {

  const handleReorder = () => {
    const rawWhatsappNumber = order.storeMeta?.whatsapp;
    if (!rawWhatsappNumber) {
      toast.error("Seller's contact information is not available.");
      return;
    }
    
    const sanitizedWhatsappNumber = rawWhatsappNumber.replace(/\D/g, '');
    const productUrl = `${window.location.origin}/${order.product.storeId}/products/${order.product.id}`;
    
    const message = `*Reorder Request*\n\n---\n\n*Product:* ${order.product.name}\n*Price:* ${formatPrice(order.product.price)}\n\nI would like to place another order for this item.\n\n*Product Link:* ${productUrl}`;
    
    const whatsappUrl = `https://wa.me/${sanitizedWhatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDispute = () => {
    console.log('Dispute initiated for order:', order.product.id);
    toast.success('Dispute functionality will be added soon!');
  };

  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden transition-transform duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl">
      <div className="flex gap-4 p-4">
        <div className="w-24 h-24 relative flex-shrink-0">
          <Image
            src={order.product.images[0]}
            alt={order.product.name}
            layout="fill"
            className="object-cover rounded-lg"
          />
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{order.product.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Order placed on {orderDate}</p>
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-1">{formatPrice(order.product.price)}</p>
          <div className="flex items-center gap-2 mt-2 text-sm font-medium text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Delivered</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-slate-200 dark:border-slate-700">
        <button 
          onClick={handleReorder}
          className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
        >
          <Repeat className="w-4 h-4" />
          <span>Reorder</span>
        </button>
        <button 
          onClick={handleDispute}
          className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 ease-in-out border-l border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Dispute</span>
        </button>
      </div>
    </div>
  );
}
