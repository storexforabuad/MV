'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, HomeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { CartItem, useCart } from '@/lib/cartContext';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { formatPrice } from '@/utils/price';
import { useOrders } from '@/hooks/useOrders';
import toast from 'react-hot-toast';
import { getCustomerDetails } from '@/app/actions/customerActions';

interface CartOrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
  cartItems: CartItem[];
  storeMeta: StoreMeta | null;
  customer: Customer | null;
}

export default function CartOrderSummaryModal({ isOpen, onClose, onOrderSuccess, cartItems, storeMeta, customer: initialCustomer }: CartOrderSummaryModalProps) {
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const storeId = cartItems[0]?.storeId;
  const { addOrder } = useOrders(customer?.id || null, storeId || "");
  const { dispatch } = useCart();

  useEffect(() => {
    if (isOpen && initialCustomer) {
      getCustomerDetails(initialCustomer.id).then(details => {
        if (details) {
          setCustomer(details);
        }
      });
    }
  }, [isOpen, initialCustomer]);

  if (cartItems.length === 0) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  const handlePlaceOrder = async () => {
    if (!storeMeta || !storeMeta.whatsapp || !customer) return;

    setIsPlacingOrder(true);
    try {
      if (!storeId) {
        toast.error('Could not determine the store for this order.');
        setIsPlacingOrder(false);
        return;
      }
      const storeMetaWithId = { ...storeMeta, id: storeId };
      const referrerId = localStorage.getItem('referrerId');

      // FIX: Submit all cart items as a single order.
      await addOrder(cartItems, storeMetaWithId, customer, referrerId, false);

      toast.success('Order placed! Redirecting to WhatsApp...');

      const itemsSummary = cartItems.map(item => {
        const productUrl = `https://tinyurl.com/bizcononline/${storeId}/products/${item.id}`;
        const sizeText = item.selectedSize ? ` (Size: ${item.selectedSize})` : '';
        const unitText = item.productType === 'livestock' ? ((item as any).priceUnit === 'kg' ? 'kg' : 'pcs') : '';
        return `*${item.name}*${sizeText} (x${item.quantity}${unitText}) - ${formatPrice(item.price * item.quantity)}\n🔗 ${productUrl}`;
      }).join('\n\n');

      const message = `🛍️ *New Order Request*\n\n` +
        `Hello! I would like to order the following items:\n\n` +
        `${itemsSummary}\n\n` +
        `🚚 *Delivery Method:* ${deliveryMethod === 'home' ? 'Home Delivery' : 'Pick Up'}\n` +
        `${deliveryMethod === 'home' && customer.deliveryAddress ? `📍 *Address:* ${customer.deliveryAddress.street}\n` : ''}` +
        `*Subtotal:* ${formatPrice(subtotal)}\n` +
        `*Total (excluding delivery):* ${formatPrice(total)}\n\n` +
        `Please provide delivery fee and payment details.\n\n` +
        `Thank you! 🙏`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${storeMeta.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`;

      // Use window.location.href instead of window.open for better iOS compatibility
      window.location.href = whatsappUrl;
      dispatch({ type: 'CLEAR_CART' });
      onOrderSuccess();
    } catch (error) {
      console.error("Error placing order or redirecting to WhatsApp:", error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="flex items-start justify-between">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Order Summary</Dialog.Title>
                    <button type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500" onClick={onClose}><XMarkIcon className="h-6 w-6" aria-hidden="true" /></button>
                  </div>

                  <div className="mt-4 max-h-60 overflow-y-auto pr-2">
                    {cartItems.map(item => (
                      <div key={item.id + (item.selectedSize || '')} className="flex items-center space-x-4 py-2">
                        <Image src={item.images[0]} alt={item.name} width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">{item.name}</h4>
                          {item.selectedSize && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mt-1">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(item.price)} x {item.quantity}
                            {item.productType === 'livestock' && (
                              <span> {(item as any).priceUnit === 'kg' ? 'kg' : 'pcs'}</span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Method & Payment Details */}
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

                <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3">
                  <button type="button" className="w-full rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onClick={onClose}>Cancel</button>
                  <button type="button" className="w-full rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed" onClick={handlePlaceOrder} disabled={isPlacingOrder || !storeId}>
                    {isPlacingOrder ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4
                          "></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Ordering..
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
