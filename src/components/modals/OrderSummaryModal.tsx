'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HomeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { formatPrice } from '@/utils/price';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { getCustomerDetails } from '@/app/actions/customerActions';
import { isFoodBeverageProduct } from '@/utils/productHelpers';
import { shouldUsePaymentFlow } from '@/utils/storeHelpers';
import { saveModalState, getModalState, clearModalState } from '@/lib/paymentModalStorage';
import { requestCustomerNotificationPermission } from '@/lib/requestCustomerNotifications';
import PaymentFlowPage from './PaymentFlowPage';
import ModalShell from './ModalShell';
import OrderSummaryStrip from './OrderSummaryStrip';

const SPICINESS_LEVELS = [
  { value: 'mild', label: '😌 Mild', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'medium', label: '🌶️ Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'hot', label: '🔥 Hot', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'extra-hot', label: '🤯 Extra Hot', color: 'bg-red-100 text-red-800 border-red-200' },
];

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  storeMeta: StoreMeta | null;
  customer: Customer | null;
  selectedSize?: string;
  selectedColor?: string; // Added selectedColor prop
}

export default function OrderSummaryModal({ isOpen, onClose, product, storeMeta, customer: initialCustomer, selectedSize, selectedColor }: OrderSummaryModalProps) {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedSpiciness, setSelectedSpiciness] = useState('medium');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [uploadedEvidence, setUploadedEvidence] = useState<{ url: string; fileName: string } | undefined>();

  const routeParams = useParams();
  const storeId = typeof routeParams?.storeId === 'string' ? routeParams.storeId : Array.isArray(routeParams?.storeId) ? routeParams.storeId[0] : undefined;
  const { addOrder } = useOrders(customer?.id || null, storeId!);

  const isPaymentFlowEnabled = shouldUsePaymentFlow(storeMeta?.storeType);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setCurrentPage(1);
      setSelectedSpiciness('medium');
      setSpecialInstructions('');
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

  if (!product) return null;

  const total = product.price * quantity;

  const handleEvidenceUploaded = (evidenceUrl: string, fileName: string) => {
    setUploadedEvidence({ url: evidenceUrl, fileName });
    if (storeId) {
      saveModalState(storeId, 2, evidenceUrl, fileName);
    }
  };

  const handlePlaceOrder = async () => {
    if (!product || !storeId || !storeMeta || !customer) return;

    // For payment flow, evidence is required; for WhatsApp, it's not
    if (isPaymentFlowEnabled && !uploadedEvidence) {
      toast.error('Please upload payment evidence first');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const storeMetaWithId = { ...storeMeta, id: storeId };
      const referrerId = localStorage.getItem('referrerId');

      const productToOrder = {
        ...product,
        quantity,
        selectedSize,
        selectedColor,
        selectedSpiciness: isFoodBeverageProduct(product) ? selectedSpiciness : undefined,
        specialInstructions: isFoodBeverageProduct(product) ? specialInstructions : undefined
      };

      // For payment flow (restaurant), pass evidence URL
      if (isPaymentFlowEnabled) {
        await addOrder(
          [productToOrder],
          storeMetaWithId,
          customer,
          referrerId,
          false,
          deliveryMethod as 'home' | 'pickup',
          '',
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
        onClose();
      } else {
        // For non-payment flow stores, use WhatsApp
        await addOrder([productToOrder], storeMetaWithId, customer, referrerId, false, deliveryMethod as 'home' | 'pickup');

        // Request notification permission immediately after order placement
        if (customer?.id) {
          requestCustomerNotificationPermission(customer.id).catch(err =>
            console.error('Failed to request notification permission:', err)
          );
        }

        toast.success('Order placed! Redirecting to WhatsApp...');

        const productUrl = `https://tinyurl.com/bizcononline/${storeId}/products/${product.id}`;
        const message = `🛍️ *New Order Request*\n\n` +
          `Hello! I would like to order this item:\n\n` +
          `*${product.name}*\n` +
          `🔗 *Product Link:* ${productUrl}\n` +
          `🔢 *Quantity:* ${quantity} ${product.productType === 'livestock' ? ((product as any).priceUnit === 'kg' ? 'kg' : 'pcs') : ''}\n` +
          (selectedColor ? `🎨 *Color:* ${selectedColor}\n` : '') +
          (selectedSize ? `📏 *Size:* ${selectedSize}\n` : '') +
          (isFoodBeverageProduct(product) ? `🌶️ *Spiciness:* ${SPICINESS_LEVELS.find(s => s.value === selectedSpiciness)?.label}\n` : '') +
          (isFoodBeverageProduct(product) && specialInstructions ? `📝 *Note:* ${specialInstructions}\n` : '') +
          `💰 *Price:* ${formatPrice(product.price)}\n` +
          `🚚 *Delivery Method:* ${deliveryMethod === 'home' ? 'Home Delivery' : 'Pick Up'}\n` +
          `${deliveryMethod === 'home' && customer.deliveryAddress ? `📍 *To:* ${customer.deliveryAddress.street}\n` : ''}` +
          `*Total (excluding delivery):* ${formatPrice(total)}\n\n` +
          `Please provide delivery fee and payment details.\n\n` +
          `Thank you! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${storeMeta.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`;

        window.location.href = whatsappUrl;
        onClose();
      }
    } catch (error) {
      console.error("Error placing order:", error);
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
                    {currentPage === 1 ? 'Order Summary' : 'Payment'}
                  </h3>
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-slate-950 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-grow overflow-y-auto p-4 sm:p-6">
                  <div className="max-w-3xl mx-auto w-full">
                    {/* Page 1 content */}
                    {currentPage === 1 && (
                      <div>
                        {/* Product Details */}
                        <div className="flex items-center space-x-4">
                          <Image src={product.images[0]} alt={product.name} width={80} height={80} className="h-20 w-20 rounded-lg object-cover shadow-sm" />
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white">{product.name}</h4>
                            <div className="mt-1 mb-2 flex flex-wrap gap-2">
                              {selectedColor && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                  Color: {selectedColor}
                                </span>
                              )}
                              {selectedSize && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                  Size: {selectedSize}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {formatPrice(product.price)}
                              {product.productType === 'livestock' && (
                                <span>/{(product as any).priceUnit === 'kg' ? 'kg' : 'pc'}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                              {product.productType === 'livestock' && (product as any).priceUnit === 'kg' ? 'Kilos' : 'Qty'}
                            </span>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"><Minus size={18} /></button>
                              <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[1.5rem] text-center">{quantity}</span>
                              <button onClick={() => setQuantity(q => q + 1)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"><Plus size={18} /></button>
                            </div>
                          </div>
                        </div>

                        {/* Food Options */}
                        {isFoodBeverageProduct(product) && (
                          <div className="mt-8 space-y-6">
                            <div>
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">
                                Spiciness Level
                              </label>
                              <div className="grid grid-cols-4 gap-3">
                                {SPICINESS_LEVELS.map((level) => (
                                  <button
                                    key={level.value}
                                    onClick={() => setSelectedSpiciness(level.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${selectedSpiciness === level.value
                                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-2 ring-orange-500 ring-opacity-50 shadow-sm'
                                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                                      }`}
                                  >
                                    <span className="text-2xl mb-1">{level.label.split(' ')[0]}</span>
                                    <span className="text-xs font-medium text-center leading-tight dark:text-gray-300">
                                      {level.label.split(' ').slice(1).join(' ')}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label htmlFor="special-instructions" className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                                Special Instructions
                              </label>
                              <textarea
                                id="special-instructions"
                                rows={3}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white sm:text-sm p-3"
                                placeholder="E.g. No onions, extra sauce..."
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {/* Delivery Method */}
                        <div className="mt-8">
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
                              <span>{customer.deliveryAddress.street}</span>
                            </div>
                          )}
                        </div>

                        {/* Payment Details */}
                        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-4">Payment Summary</h4>
                          <dl className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex justify-between">
                              <dt>Item price</dt>
                              <dd className="font-medium text-gray-900 dark:text-gray-200">{formatPrice(product.price * quantity)}</dd>
                            </div>
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

                    {/* Page 2 content */}
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
                        disabled={isPlacingOrder || (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false)}
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
