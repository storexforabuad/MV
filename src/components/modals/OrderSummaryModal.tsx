'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, HomeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { formatPrice } from '@/utils/price';
import { Minus, Plus } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { getCustomerDetails } from '@/app/actions/customerActions';

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  storeMeta: StoreMeta | null;
  customer: Customer | null;
}

export default function OrderSummaryModal({ isOpen, onClose, product, storeMeta, customer: initialCustomer }: OrderSummaryModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [bonusApplied, setBonusApplied] = useState(false);

  const { addOrder } = useOrders(customer?.id || null);
  const routeParams = useParams();
  const storeId = typeof routeParams?.storeId === 'string' ? routeParams.storeId : Array.isArray(routeParams?.storeId) ? routeParams.storeId[0] : undefined;
  const referralBonus = storeId ? customer?.referralDataByStore?.[storeId]?.commissionEarned || 0 : 0;

  useEffect(() => {
    if (isOpen) {
      setQuantity(1); // Reset quantity when modal opens
      setBonusApplied(false);
      if (initialCustomer) {
        getCustomerDetails(initialCustomer.id).then(details => {
          if (details) {
            setCustomer(details);
          }
        });
      }
    }
  }, [isOpen, initialCustomer]);

  if (!product) return null;

  const deliveryFee = 0; // Delivery fee is no longer charged in the modal
  const total = product.price * quantity - (bonusApplied ? referralBonus : 0);

  const handlePlaceOrder = async () => {
    if (!product || !storeId || !storeMeta || !storeMeta.whatsapp || !customer) return;

    try {
      const storeMetaWithId = { ...storeMeta, id: storeId };
      const referrerId = localStorage.getItem('referrerId');
      await addOrder(product, storeMetaWithId, quantity, customer, referrerId, bonusApplied);
      toast.success('Order placed! Redirecting to WhatsApp...');

      const productUrl = `https://tinyurl.com/bizcononline/${storeId}/products/${product.id}`;
      const message = `🛍️ *New Order Request*\n\n` +
                      `Hello! I would like to order this item:\n\n` +
                      `*${product.name}*\n` +
                      `🔗 *Product Link:* ${productUrl}\n` +
                      `🔢 *Quantity:* ${quantity}\n` +
                      `💰 *Price:* ${formatPrice(product.price)}\n` +
                      `🚚 *Delivery Method:* ${deliveryMethod === 'home' ? 'Home Delivery' : 'Pick Up'}\n`+
                      `${deliveryMethod === 'home' && customer.deliveryAddress ? `📍 *To:* ${customer.deliveryAddress.street}\n` : ''}`+
                      `${bonusApplied ? `🎉 *Referral Bonus:* -${formatPrice(referralBonus)}\n` : ''}` +
                      `*Total:* ${formatPrice(total)}\n\n` +
                      `Thank you! 🙏`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${storeMeta.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
      onClose();
    } catch (error) {
      console.error("Error placing order or redirecting to WhatsApp:", error);
      toast.error('Failed to place order. Please try again.');
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
                    <button type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500" onClick={onClose}>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="mt-4 flex items-center space-x-4">
                    <Image src={product.images[0]} alt={product.name} width={64} height={64} className="h-16 w-16 rounded-md object-cover" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(product.price)}</p>
                    </div>
                    <div className="flex items-center">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 text-gray-500 dark:text-gray-400"><Minus size={16} /></button>
                      <span className="px-3 text-sm font-medium text-gray-900 dark:text-gray-200">{quantity}</span>
                      <button onClick={() => setQuantity(q => q + 1)} className="p-1 text-gray-500 dark:text-gray-400"><Plus size={16} /></button>
                    </div>
                  </div>

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
                      <div className="flex justify-between">
                        <dt>Referral bonus</dt>
                        <dd className="font-medium text-green-600 dark:text-green-400">-{formatPrice(bonusApplied ? referralBonus : 0)}</dd>
                      </div>
                      <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                        <dt>Total</dt>
                        <dd>{formatPrice(total)}</dd>
                      </div>
                    </dl>
                    <button 
                        onClick={() => setBonusApplied(true)}
                        disabled={referralBonus < 100}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Use ₦{referralBonus} bonus
                    </button>
                     {referralBonus < 100 && <p className="text-xs text-gray-500 dark:text-gray-400">Earn ₦{100-referralBonus} more to use your bonus</p>}
                    
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3">
                  <button type="button" className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm" onClick={onClose}>Cancel</button>
                  <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm" onClick={handlePlaceOrder}>Place Order</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
