'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Repeat, MessageSquare, Clock, ReceiptIcon } from 'lucide-react';
import { Order } from '../../../hooks/useOrders';
import { formatPrice } from '../../../utils/price';
import { ReceiptModal } from '../../modals/ReceiptModal';
import { useCustomer } from '@/context/CustomerContext';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';

interface OrderDetailCardProps {
  order: Order;
  addOrder: (product: Product, storeMeta: StoreMeta, quantity: number, customerInfo: Customer, referralCode: string | null, bonusApplied: boolean) => Promise<void>;
  storeMeta: StoreMeta;
}

export function OrderDetailCard({ order, addOrder, storeMeta }: OrderDetailCardProps) {
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const { customer } = useCustomer();

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
      // 1. Record the new order in Firestore
      await addOrder(order.product, storeMeta, 1, customer, null, false);

      // 2. Open WhatsApp with the pre-filled message
      const sanitizedWhatsappNumber = storeMeta.whatsapp.replace(/\D/g, '');
      const productUrl = `${window.location.origin}/${order.product.storeId}/products/${order.product.id}`;
      
      const message = `*Reorder Request*\n\n---\n\n*Product:* ${order.product.name}\n*Price:* ${formatPrice(order.product.price)}\n\nI would like to place another order for this item.\n\n*Product Link:* ${productUrl}`;
      
      const whatsappUrl = `https://wa.me/${sanitizedWhatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Reorder placed successfully!');

    } catch (error) {
      console.error("Failed to place reorder:", error);
      toast.error('There was an issue placing your reorder.');
    }
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
    <>
      <div className="bg-card-background rounded-2xl shadow-md overflow-hidden transition-transform duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl">
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
            <p className="font-bold text-lg card-text-gradient truncate">{order.product.name}</p>
            <p className="text-sm text-text-secondary">Order placed on {orderDate}</p>
            <p className="text-lg font-semibold text-purple-400 mt-1">{formatPrice(order.product.price)}</p>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-yellow-400">
              <Clock className="w-4 h-4" />
              <span>Processing</span>
            </div>
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
            <ReceiptIcon className="w-4 h-4" />
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
      <ReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={() => setIsReceiptModalOpen(false)} 
        order={order} 
      />
    </>
  );
}
