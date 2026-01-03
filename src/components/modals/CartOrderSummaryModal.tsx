'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HomeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { CartItem, useCart } from '@/lib/cartContext';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { formatPrice } from '@/utils/price';
import { useOrders } from '@/hooks/useOrders';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCustomerDetails } from '@/app/actions/customerActions';
import { shouldUsePaymentFlow } from '@/utils/storeHelpers';
import { saveModalState, getModalState, clearModalState } from '@/lib/paymentModalStorage';
import { requestCustomerNotificationPermission } from '@/lib/requestCustomerNotifications';
import PaymentFlowPage from './PaymentFlowPage';

interface CartOrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
  cartItems: CartItem[];
  storeMeta: StoreMeta | null;
  customer: Customer | null;
}

export default function CartOrderSummaryModal({ isOpen, onClose, onOrderSuccess, cartItems, storeMeta, customer: initialCustomer }: CartOrderSummaryModalProps) {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [uploadedEvidence, setUploadedEvidence] = useState<{ url: string; fileName: string } | undefined>();
  const hasPushedState = useRef(false);

  const storeId = cartItems[0]?.storeId;
  const { addOrder } = useOrders(customer?.id || null, storeId || "");
  const { dispatch } = useCart();

  const isPaymentFlowEnabled = shouldUsePaymentFlow(storeMeta?.storeType) || storeMeta?.storeType === 'general';

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setDeliveryMethod('home');
      setOrderNotes('');
      setUploadedEvidence(undefined);

      // Restore modal state from localStorage if payment flow is enabled
      if (isPaymentFlowEnabled && storeId) {
        const savedState = getModalState(storeId);
        if (savedState) {
          setCurrentPage(savedState.currentPage);
          if (savedState.evidenceUrl) {
            setUploadedEvidence({
              url: savedState.evidenceUrl,
              fileName: savedState.fileName || 'Uploaded proof'
            });
          }
        }
      }

      if (initialCustomer) {
        getCustomerDetails(initialCustomer.id).then(details => {
          if (details) {
            setCustomer(details);
          }
        });
      }
    }
  }, [isOpen, initialCustomer, isPaymentFlowEnabled, storeId]);

  // Dedicated history management effect
  useEffect(() => {
    if (!isOpen) return;

    // Push state to handle back button only once
    if (!hasPushedState.current) {
      window.history.pushState({ modal: 'cart-order-summary' }, '');
      hasPushedState.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      if (hasPushedState.current) {
        hasPushedState.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If modal is closed via X button, we need to clean up the history state
      if (hasPushedState.current) {
        hasPushedState.current = false;
        if (window.history.state?.modal === 'cart-order-summary') {
          window.history.back();
        }
      }
    };
  }, [isOpen]);

  const handleEvidenceUploaded = (evidenceUrl: string, fileName: string) => {
    setUploadedEvidence({ url: evidenceUrl, fileName });
    if (storeId) {
      saveModalState(storeId, 2, evidenceUrl, fileName);
    }
  };

  const handlePlaceOrder = async () => {
    if (!storeMeta || !customer || !storeId) return;

    if (isPaymentFlowEnabled && !uploadedEvidence) {
      toast.error('Please upload payment evidence first');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const storeMetaWithId = { ...storeMeta, id: storeId };
      const referrerId = localStorage.getItem('referrerId');

      if (isPaymentFlowEnabled) {
        await addOrder(
          cartItems,
          storeMetaWithId,
          customer,
          referrerId,
          false,
          deliveryMethod as 'home' | 'pickup',
          orderNotes,
          uploadedEvidence?.url,
          uploadedEvidence?.fileName
        );

        if (customer?.id) {
          requestCustomerNotificationPermission(customer.id).catch(err =>
            console.error('Failed to request notification permission:', err)
          );
        }

        toast.success('Order placed! Vendor will review your payment and confirm shortly.');
        clearModalState(storeId);
        dispatch({ type: 'CLEAR_CART' });
        onOrderSuccess();
        onClose();
      } else {
        await addOrder(cartItems, storeMetaWithId, customer, referrerId, false, deliveryMethod as 'home' | 'pickup', orderNotes);

        if (customer?.id) {
          requestCustomerNotificationPermission(customer.id).catch(err =>
            console.error('Failed to request notification permission:', err)
          );
        }

        toast.success('Order placed! Redirecting to WhatsApp...');

        const itemsSummary = cartItems.map(item => {
          const productUrl = `https://tinyurl.com/bizcononline/${storeId}/products/${item.id}`;
          const colorText = item.selectedColor ? `🎨 *Color:* ${item.selectedColor}\n` : '';
          const sizeText = item.selectedSize ? `📏 *Size:* ${item.selectedSize}\n` : '';
          const unitText = item.productType === 'livestock' ? (item as any).priceUnit === 'kg' ? 'kg' : 'pcs' : '';

          return `*${item.name}*\n` +
            `🔗 ${productUrl}\n` +
            colorText +
            sizeText +
            `🔢 *Quantity:* ${item.quantity} ${unitText}\n` +
            `*Subtotal:* ${formatPrice(item.price * item.quantity)}`;
        }).join('\n\n');

        const message = `🛍️ *New Cart Order*\n\n` +
          `Hello! I would like to order the following items:\n\n` +
          `${itemsSummary}\n\n` +
          `--------------------\n` +
          `🚚 *Delivery Method:* ${deliveryMethod === 'home' ? 'Home Delivery' : 'Pick Up'}\n` +
          `${deliveryMethod === 'home' && customer.deliveryAddress ? `📍 *Address:* ${customer.deliveryAddress.street}\n` : ''}` +
          (orderNotes ? `📝 *Special Instructions:* ${orderNotes}\n` : '') +
          `*Grand Total (excl. delivery):* ${formatPrice(total)}\n\n` +
          `Please confirm availability and provide payment details.\n\n` +
          `Thank you! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${storeMeta.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`;

        window.location.href = whatsappUrl;
        dispatch({ type: 'CLEAR_CART' });
        onOrderSuccess();
      }
    } catch (error) {
      console.error("Error placing cart order:", error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleBackToSummary = () => {
    setCurrentPage(1);
    if (storeId) {
      saveModalState(storeId, 1, uploadedEvidence?.url, uploadedEvidence?.fileName);
    }
  };

  const handleProceedToPayment = () => {
    setCurrentPage(2);
    if (storeId) {
      saveModalState(storeId, 2, uploadedEvidence?.url, uploadedEvidence?.fileName);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-0 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="fixed inset-0 w-full h-full max-w-none transform overflow-hidden bg-white dark:bg-slate-950 text-left align-middle shadow-xl transition-all flex flex-col">

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    {currentPage === 1 ? 'Cart Summary' : 'Payment'}
                  </h3>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors shadow-sm"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-grow overflow-y-auto p-4 sm:p-6">
                  <div className="max-w-3xl mx-auto w-full">
                    {/* Page 1: Cart Summary */}
                    {currentPage === 1 && (
                      <div className="pt-4 sm:pt-8">
                        <div className="space-y-4">
                          {cartItems.map(item => (
                            <div key={item.id + (item.selectedColor || '') + (item.selectedSize || '')} className="flex items-center space-x-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-shimmer bg-[length:200%_100%]" />
                                <Image src={item.images[0]} alt={item.name} width={64} height={64} className="h-16 w-16 object-cover relative z-10" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  {item.selectedColor && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                      {item.selectedColor}
                                    </span>
                                  )}
                                  {item.selectedSize && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                      {item.selectedSize}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1.5 flex items-center justify-between">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatPrice(item.price)} x {item.quantity}
                                  </p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Notes */}
                        <div className="mt-8">
                          <label htmlFor="order-notes" className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                            Special Instructions (Optional)
                          </label>
                          <textarea
                            id="order-notes"
                            rows={3}
                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white sm:text-sm p-3"
                            placeholder="Any special requests for this order?"
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                          />
                        </div>

                        {/* Delivery Method */}
                        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">Delivery Method</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div onClick={() => setDeliveryMethod('home')} className={`flex cursor-pointer items-center rounded-xl border p-4 transition-all duration-200 ${deliveryMethod === 'home' ? 'border-green-500 bg-green-50 dark:bg-green-900/10 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
                              <div className={`p-2 rounded-full mr-3 ${deliveryMethod === 'home' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                <HomeIcon className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium dark:text-gray-200">Home Delivery</span>
                            </div>
                            <div onClick={() => setDeliveryMethod('pickup')} className={`flex cursor-pointer items-center rounded-xl border p-4 transition-all duration-200 ${deliveryMethod === 'pickup' ? 'border-green-500 bg-green-50 dark:bg-green-900/10 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
                              <div className={`p-2 rounded-full mr-3 ${deliveryMethod === 'pickup' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                <BriefcaseIcon className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium dark:text-gray-200">Pick Up</span>
                            </div>
                          </div>
                          {deliveryMethod === 'home' && customer && customer.deliveryAddress && (
                            <div className="mt-3 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                              <span className="font-medium flex-shrink-0">Delivering to:</span>
                              <span>{customer.name} - {customer.deliveryAddress.street}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
                          <dl className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-medium text-gray-900 dark:text-gray-200">{formatPrice(subtotal)}</dd></div>
                            {deliveryMethod === 'home' && (
                              <div className="flex justify-between">
                                <dt>Home delivery</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200">TBD by vendor</dd>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                              <dt className="text-base font-bold text-gray-900 dark:text-white">Total</dt>
                              <dd className="text-xl font-bold text-green-600 dark:text-green-400">{formatPrice(total)}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    )}

                    {/* Page 2: Payment Flow */}
                    {currentPage === 2 && isPaymentFlowEnabled && storeMeta && (
                      <div className="h-full">
                        <PaymentFlowPage
                          storeMeta={storeMeta}
                          onEvidenceUploaded={handleEvidenceUploaded}
                          onBack={handleBackToSummary}
                          uploadedEvidence={uploadedEvidence}
                          total={total}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 p-4 sm:px-6">
                  <div className="max-w-3xl mx-auto w-full">
                    {currentPage === 1 ? (
                      <button
                        type="button"
                        className="w-full rounded-xl border border-transparent bg-green-600 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        onClick={isPaymentFlowEnabled ? handleProceedToPayment : handlePlaceOrder}
                        disabled={isPlacingOrder || !storeId || (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false)}
                      >
                        {isPlacingOrder ? (
                          <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Processing...</span>
                        ) : (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false) ? (
                          'Store Closed'
                        ) : isPaymentFlowEnabled ? (
                          'Proceed to Payment'
                        ) : (
                          'Place Order'
                        )}
                      </button>
                    ) : (
                      currentPage === 2 && isPaymentFlowEnabled && (
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            className="w-full rounded-xl border border-transparent bg-green-600 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder || !uploadedEvidence}
                          >
                            {isPlacingOrder ? (
                              <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Placing Order...</span>
                            ) : (
                              'Complete Order'
                            )}
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
