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
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg text-left transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <ModalShell
                  title={currentPage === 1 ? 'Order Summary' : 'Payment'}
                  onClose={onClose}
                  strip={currentPage === 2 ? (
                    <OrderSummaryStrip total={total}>
                      <div className="truncate text-sm font-medium">{product.name} &times; {quantity}</div>
                    </OrderSummaryStrip>
                  ) : undefined}
                  footer={
                    currentPage === 1 ? (
                      <div>
                        <button
                          type="button"
                          className="w-full rounded-md border border-transparent bg-green-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={isPaymentFlowEnabled ? handleProceedToPayment : handlePlaceOrder}
                          disabled={isPlacingOrder || (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false)}
                        >
                          {isPlacingOrder ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing..</>
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
                            className="w-full rounded-md border border-transparent bg-green-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder || !uploadedEvidence}
                          >
                            {isPlacingOrder ? (
                              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Placing Order..</>
                            ) : (
                              'Complete Order'
                            )}
                          </button>
                        </div>
                      )
                    )
                  }
                >
                  {/* Page 1 content */}
                  {currentPage === 1 && (
                    <div>
                      {/* Product Details */}
                      <div className="mt-4 flex items-center space-x-4">
                        <Image src={product.images[0]} alt={product.name} width={64} height={64} className="h-16 w-16 rounded-md object-cover" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.name}</h4>
                          <div className="mt-1 mb-1 flex flex-wrap gap-2">
                            {selectedColor && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Color: {selectedColor}
                              </span>
                            )}
                            {selectedSize && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Size: {selectedSize}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(product.price)}
                            {product.productType === 'livestock' && (
                              <span>/{(product as any).priceUnit === 'kg' ? 'kg' : 'pc'}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {product.productType === 'livestock' && (product as any).priceUnit === 'kg' ? 'Select Kilos' : 'Quantity'}
                          </span>
                          <div className="flex items-center">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 text-gray-500 dark:text-gray-400"><Minus size={16} /></button>
                            <span className="px-3 text-sm font-medium text-gray-900 dark:text-gray-200">{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)} className="p-1 text-gray-500 dark:text-gray-400"><Plus size={16} /></button>
                          </div>
                        </div>
                      </div>

                      {/* Food Options */}
                      {isFoodBeverageProduct(product) && (
                        <div className="mt-6 space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                              Spiciness Level
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {SPICINESS_LEVELS.map((level) => (
                                <button
                                  key={level.value}
                                  onClick={() => setSelectedSpiciness(level.value)}
                                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${selectedSpiciness === level.value
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-500'
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                  <span className="text-xl mb-1">{level.label.split(' ')[0]}</span>
                                  <span className="text-[10px] font-medium text-center leading-tight dark:text-gray-300">
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
                              rows={2}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                              placeholder="E.g. No onions, extra sauce..."
                              value={specialInstructions}
                              onChange={(e) => setSpecialInstructions(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Delivery Method */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Delivery Method</h4>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div onClick={() => setDeliveryMethod('home')} className={`flex cursor-pointer items-center rounded-lg border p-4 ${deliveryMethod === 'home' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            <HomeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <span className="ml-3 text-sm font-medium dark:text-gray-300">Home Delivery</span>
                          </div>
                          <div onClick={() => setDeliveryMethod('pickup')} className={`flex cursor-pointer items-center rounded-lg border p-4 ${deliveryMethod === 'pickup' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            <BriefcaseIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <span className="ml-3 text-sm font-medium dark:text-gray-300">Pick Up</span>
                          </div>
                        </div>
                        {deliveryMethod === 'home' && customer && customer.deliveryAddress && (
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">To: {customer.deliveryAddress.street}</p>
                        )}
                      </div>

                      {/* Payment Details */}
                      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Payment Details</h4>
                        <dl className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
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
                          <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                            <dt>Total</dt>
                            <dd>{formatPrice(total)}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {/* Page 2 content */}
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
