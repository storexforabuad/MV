'use client';

import { useState } from 'react';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { StoreMeta } from '@/types/store';
import { formatPrice } from '@/utils/price';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { addOrderToFirestore } from '@/app/actions/orderActions';
import { isFoodBeverageProduct } from '@/utils/productHelpers';

interface PaymentFlowPageProps {
  storeMeta: StoreMeta;
  onEvidenceUploaded: (evidenceUrl: string, fileName: string) => void;
  onBack: () => void;
  uploadedEvidence?: { url: string; fileName: string };
  total: number;
  customer: Customer | null;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedSpiciness?: string;
  specialInstructions?: string;
  deliveryMethod: string;
}

export default function PaymentFlowPage({
  storeMeta,
  onBack,
  total,
  customer,
  product,
  quantity,
  selectedSize,
  selectedColor,
  selectedSpiciness,
  specialInstructions,
  deliveryMethod
}: PaymentFlowPageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const storeId = storeMeta.id || '';

  const handlePaystackPayment = async () => {
    if (!customer) {
      toast.error('Please login to continue');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Pending Order
      const productToOrder = {
        ...product,
        quantity,
        selectedSize,
        selectedColor,
        selectedSpiciness: isFoodBeverageProduct(product) ? selectedSpiciness : undefined,
        specialInstructions: isFoodBeverageProduct(product) ? specialInstructions : undefined,
        storeId // Ensure storeId is present
      };

      // We use a temporary status or just rely on the fact that it's not "paid" yet?
      // The addOrderToFirestore defaults to 'pending'.
      // We might want to add a specific status 'awaiting_payment' if we want to distinguish.
      // For now, 'pending' is fine.

      const referrerId = localStorage.getItem('referrerId');

      const newOrder = await addOrderToFirestore(
        customer.id,
        [productToOrder],
        storeMeta,
        customer,
        referrerId,
        false, // bonusApplied
        deliveryMethod as 'home' | 'pickup',
        '', // orderNotes (handled in product specialInstructions for food, or we could pass a separate note)
        undefined, // evidenceUrl
        undefined  // evidenceFileName
      );

      if (!newOrder || !newOrder.id) {
        throw new Error('Failed to create order');
      }

      // 2. Initialize Paystack with Order ID
      const response = await fetch('/api/paystack/initialize-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customer.email || 'customer@example.com',
          amount: total,
          storeId,
          metadata: {
            orderId: newOrder.id, // CRITICAL: Pass orderId to Paystack
            cart_items: `${quantity}x ${product.name}`
          }
        })
      });

      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error('Could not initialize payment');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      toast.error('Payment failed to start');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1 transition-colors"
        >
          ← Back to Summary
        </button>

        {/* Digital Receipt Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative">
          {/* Perforated Edge Effect (Top) */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,black_4px,black_8px)] opacity-5"></div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-4">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Order Total</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-4">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Service Fee</span>
              <span className="font-medium text-gray-900 dark:text-white">₦0.00</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-900 dark:text-white font-bold text-lg">TOTAL TO PAY</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Secure Payment Option */}
        <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-6 border border-green-100 dark:border-green-800/50 shadow-sm">
          <div className="text-[10px] font-extrabold text-green-600 dark:text-green-400 uppercase tracking-widest mb-4">
            ATLAS™ CHECKOUT
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Secure Payment</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Encrypted & Safe</p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
            Pay securely with your Card, Bank Transfer, or USSD via Paystack.
          </p>

          <button
            onClick={handlePaystackPayment}
            disabled={isProcessing}
            className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Pay {formatPrice(total)} Securely</span>
              </>
            )}
          </button>

          {/* Trust Signals Strip */}
          <div className="mt-6 pt-4 border-t border-green-100 dark:border-green-800/30 flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
              <span className="font-bold text-blue-800 dark:text-blue-400 text-lg italic">Visa</span>
              <span className="font-bold text-red-600 dark:text-red-400 text-lg">Mastercard</span>
              <span className="font-bold text-green-700 dark:text-green-400 text-lg">Verve</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Secured by Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
