'use client';

import { Fragment, useState, useEffect } from 'react';
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
import ModalShell from './ModalShell';
import OrderSummaryStrip from './OrderSummaryStrip';

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

  const storeId = cartItems[0]?.storeId;
  const { addOrder } = useOrders(customer?.id || null, storeId || "");
  const { dispatch } = useCart();

  const isPaymentFlowEnabled = shouldUsePaymentFlow(storeMeta?.storeType);

  useEffect(() => {
    if (isOpen && initialCustomer) {
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

      getCustomerDetails(initialCustomer.id).then(details => {
        if (details) setCustomer(details);
      });
    }
  }, [isOpen, initialCustomer, isPaymentFlowEnabled, storeId]);

  if (cartItems.length === 0) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  const handleEvidenceUploaded = (evidenceUrl: string, fileName: string) => {
    setUploadedEvidence({ url: evidenceUrl, fileName });
    if (storeId) {
      saveModalState(storeId, 2, evidenceUrl, fileName);
    }
  };

  const handlePlaceOrder = async () => {
    if (!storeMeta || !customer || !storeId) return;

    // For payment flow, evidence is required; for WhatsApp, it's not
    if (isPaymentFlowEnabled && !uploadedEvidence) {
      toast.error('Please upload payment evidence first');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const storeMetaWithId = { ...storeMeta, id: storeId };
      const referrerId = localStorage.getItem('referrerId');

      // For payment flow (restaurant), pass evidence URL
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

        // Request notification permission immediately after order placement
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
        // For non-payment flow stores, use WhatsApp
        await addOrder(cartItems, storeMetaWithId, customer, referrerId, false, deliveryMethod as 'home' | 'pickup', orderNotes);

        // Request notification permission immediately after order placement
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
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg text-left transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <ModalShell
                  title={currentPage === 1 ? 'Cart Summary' : 'Payment'}
                  onClose={onClose}
                  strip={currentPage === 2 ? (
                    <OrderSummaryStrip total={total}>
                      <div className="truncate text-sm font-medium">{cartItems.length} items</div>
                    </OrderSummaryStrip>
                  ) : undefined}
                  footer={
                    currentPage === 1 ? (
                      <div>
                        <button
                          type="button"
                          className="w-full rounded-md border border-transparent bg-green-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed"
                          onClick={isPaymentFlowEnabled ? handleProceedToPayment : handlePlaceOrder}
                          disabled={isPlacingOrder || !storeId || (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false)}
                        >
                          {isPlacingOrder ? (
                            <>
                              <Loader2 className="inline-block -ml-1 mr-3 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false) ? (
                            'Store Closed'
                          ) : isPaymentFlowEnabled ? (
                            'Proceed to Payment'
                          ) : (
                            'Place Order'
                          )}
                        </button>
                      </div>
                    ) : (
                      currentPage === 2 && isPaymentFlowEnabled && (
                        <div>
                          <button
                            type="button"
                            className="w-full rounded-md border border-transparent bg-green-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed"
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder || !uploadedEvidence}
                          >
                            {isPlacingOrder ? (
                              <>
                                <Loader2 className="inline-block -ml-1 mr-3 h-5 w-5 animate-spin" />
                                Placing Order...
                              </>
                            ) : (
                              'Complete Order'
                            )}
                          </button>
                        </div>
                      )
                    )
                  }
                >
                  {/* Page 1: Cart Summary */}
                  {currentPage === 1 && (
                    <div>
                      <div className="mt-4 max-h-60 overflow-y-auto pr-2 divide-y divide-gray-200 dark:divide-gray-700">
                        {cartItems.map(item => (
                          <div key={item.id + (item.selectedColor || '') + (item.selectedSize || '')} className="flex items-center space-x-4 py-3">
                            <Image src={item.images[0]} alt={item.name} width={48} height={48} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{item.name}</h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {item.selectedColor && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    Color: {item.selectedColor}
                                  </span>
                                )}
                                {item.selectedSize && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    Size: {item.selectedSize}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formatPrice(item.price)} x {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 ml-auto">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Order Notes */}
                      <div className="mt-6">
                        <label htmlFor="order-notes" className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                          Special Instructions (Optional)
                        </label>
                        <textarea
                          id="order-notes"
                          rows={2}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          placeholder="Any special requests for this order?"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                        />
                      </div>

                      {/* Delivery Method */}
                      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Delivery Method</h4>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div onClick={() => setDeliveryMethod('home')} className={`flex cursor-pointer items-center rounded-lg border p-4 ${deliveryMethod === 'home' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            <HomeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /><span className="ml-3 text-sm font-medium dark:text-gray-300">Home Delivery</span>
                          </div>
                          <div onClick={() => setDeliveryMethod('pickup')} className={`flex cursor-pointer items-center rounded-lg border p-4 ${deliveryMethod === 'pickup' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            <BriefcaseIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" /><span className="ml-3 text-sm font-medium dark:text-gray-300">Pick Up</span>
                          </div>
                        </div>
                        {deliveryMethod === 'home' && customer && customer.deliveryAddress && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">To: {customer.name} - {customer.deliveryAddress.street}</p>}
                      </div>

                      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <dl className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-medium text-gray-900 dark:text-gray-200">{formatPrice(subtotal)}</dd></div>
                          {deliveryMethod === 'home' && (
                            <div className="flex justify-between">
                              <dt>Home delivery</dt>
                              <dd className="font-medium text-gray-900 dark:text-gray-200">TBD by vendor</dd>
                            </div>
                          )}
                          <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {/* Page 2: Payment Flow */}
                  {currentPage === 2 && isPaymentFlowEnabled && storeMeta && (
                    <div>
                      <PaymentFlowPage
                        storeMeta={storeMeta}
                        onEvidenceUploaded={handleEvidenceUploaded}
                        onBack={handleBackToSummary}
                        uploadedEvidence={uploadedEvidence}
                      />
                    </div>
                  )}
                </ModalShell>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
