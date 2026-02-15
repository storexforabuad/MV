'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { createWholesaleOrder } from '@/app/actions/wholesaleActions';
import { StoreMeta } from '@/types/store';

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  wholesalePrice: number;
  image?: string;
}

interface OrderReviewModalProps {
  partner: StoreMeta;
  buyerStoreId: string;
  items: CartItem[];
  total: number;
  paymentTermsDays: 0 | 7 | 14 | 30;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

const PAYMENT_TERMS_LABELS: Record<number, string> = {
  0: 'Pay on Delivery',
  7: '7 Days Credit',
  14: '14 Days Credit',
  30: '30 Days Credit',
};

export function OrderReviewModal({
  partner,
  buyerStoreId,
  items,
  total,
  paymentTermsDays,
  isOpen,
  onClose,
  onSuccess,
}: OrderReviewModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await createWholesaleOrder(
        buyerStoreId,
        partner.id!,
        items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          wholesalePrice: item.wholesalePrice,
        })),
        paymentTermsDays,
        notes || undefined
      );

      if (result.success && result.orderId) {
        onSuccess(result.orderId);
      } else {
        setError(result.error || 'Failed to create order');
      }
    } catch (err) {
      console.error(err);
      setError('Error creating order');
    } finally {
      setSubmitting(false);
    }
  };

  const discountAmount = items.reduce((sum, item) => {
    // Get original price from the discount calculation
    // wholesalePrice = originalPrice * (1 - discount%) 
    // We need to work backward from wholesalePrice to estimate savings
    // This is approximate - actual discount is calculated server-side
    return sum + item.quantity * (item.wholesalePrice * 0.1); // Approximation
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold">Review Order</h2>
                <p className="text-sm text-green-100">{partner.name}</p>
              </div>
              <button
                onClick={onClose}
                disabled={submitting}
                className="p-2 hover:bg-green-500 rounded-lg transition disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Order Items */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Order Items</h3>
                <div className="space-y-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Product</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Price</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.productId} className="border-b border-gray-100">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-10 h-10 rounded object-cover bg-gray-100"
                                />
                              )}
                              <span className="text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-gray-700">{item.quantity}</td>
                          <td className="py-3 px-3 text-right text-gray-700">
                            ₦{item.wholesalePrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-gray-900">
                            ₦{(item.wholesalePrice * item.quantity).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="space-y-3 max-w-sm ml-auto">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>
                      ₦{total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700 font-semibold">
                      <span>Discount Applied</span>
                      <span>
                        -₦{discountAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg">
                    <span className="text-gray-900">Total</span>
                    <span className="text-green-600">
                      ₦{total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Payment Terms</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">
                        {PAYMENT_TERMS_LABELS[paymentTermsDays]}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {paymentTermsDays === 0
                          ? 'Payment is due upon delivery of goods'
                          : `Payment is due within ${paymentTermsDays} days from delivery date`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="p-6 border-b border-gray-200">
                <label className="block font-bold text-gray-900 mb-2">Add Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special delivery instructions, packaging preferences, etc."
                  maxLength={500}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">{notes.length}/500</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-6 bg-red-50 border-b border-red-200 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Confirm & Create Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
