'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, HomeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { CartItem } from '@/lib/cartContext';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { formatPrice } from '@/utils/price';
import { useOrders } from '@/hooks/useOrders';
import toast from 'react-hot-toast';
import { getReferralBonus, getCustomerDetails } from '@/app/actions/customerActions';

interface CartOrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  storeMeta: StoreMeta | null;
  customer: Customer | null;
}

export default function CartOrderSummaryModal({ isOpen, onClose, cartItems, storeMeta, customer: initialCustomer }: CartOrderSummaryModalProps) {
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [referralBonus, setReferralBonus] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [bonusApplied, setBonusApplied] = useState(false);
  const { addOrder } = useOrders(customer?.id || null);

  useEffect(() => {
    if (isOpen && initialCustomer) {
        setBonusApplied(false);
      getCustomerDetails(initialCustomer.id).then(details => {
        if (details) {
          setCustomer(details);
        }
      });
      getReferralBonus(initialCustomer.id).then(setReferralBonus);
    }
  }, [isOpen, initialCustomer]);

  if (cartItems.length === 0) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'home' ? 500 : 0;
  const total = subtotal + deliveryFee - (bonusApplied ? referralBonus : 0);

  const handlePlaceOrder = async () => {
    if (!storeMeta || !storeMeta.whatsapp || !customer) return;

    try {
      const storeMetaWithId = { ...storeMeta, id: cartItems[0].storeId };
      const referrerId = localStorage.getItem('referrerId');
      
      for (const item of cartItems) {
        await addOrder(item, storeMetaWithId, item.quantity, customer, referrerId, bonusApplied);
      }
      
      toast.success('Order placed! Redirecting to WhatsApp...');

      const itemsSummary = cartItems.map(item => `*${item.name}* (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}`).join('\n');
      const message = `🛍️ *New Order Request*\n\n` +
                      `Hello! I would like to order the following items:\n\n` +
                      `${itemsSummary}\n\n`+
                      `• Delivery Method: ${deliveryMethod === 'home' ? 'Home Delivery' : 'Pick Up'}\n`+
                      `${deliveryMethod === 'home' && customer.deliveryAddress ? `• Address: ${customer.deliveryAddress.street}\n` : ''}`+
                      `• Subtotal: ${formatPrice(subtotal)}\n`+
                      `• Delivery Fee: ${formatPrice(deliveryFee)}\n`+
                      `${bonusApplied ? `• Referral Bonus: -${formatPrice(referralBonus)}\n` : ''}` +
                      `*• Total: ${formatPrice(total)}*\n\n` +
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
                    <button type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500" onClick={onClose}><XMarkIcon className="h-6 w-6" aria-hidden="true" /></button>
                  </div>

                  <div className="mt-4 max-h-60 overflow-y-auto pr-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center space-x-4 py-2">
                        <Image src={item.images[0]} alt={item.name} width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">{item.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(item.price)} x {item.quantity}</p>
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
                      <div className="flex justify-between"><dt>Home delivery</dt><dd className="font-medium text-gray-900 dark:text-gray-200">{formatPrice(deliveryFee)}</dd></div>
                      <div className="flex justify-between"><dt>Referral bonus</dt><dd className="font-medium text-green-600 dark:text-green-400">-{formatPrice(bonusApplied ? referralBonus : 0)}</dd></div>
                      <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
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

                <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3">
                  <button type="button" className="w-full rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onClick={onClose}>Cancel</button>
                  <button type="button" className="w-full rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" onClick={handlePlaceOrder}>Place Order</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
