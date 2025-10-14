'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomer } from '@/context/CustomerContext';
import { useReferrals } from '@/hooks/useReferrals';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';

interface ReferralsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

const ReferralsModal: React.FC<ReferralsModalProps> = ({ isOpen, onClose, storeId }) => {
  const { customer } = useCustomer();
  const { referrals, isLoading } = useReferrals(customer?.id || null, storeId);

  const referralLink = customer ? `${window.location.origin}/${storeId}?ref=${customer.referralCode}` : '';
  
  const referralData = customer?.referralDataByStore?.[storeId];
  const commissionEarned = referralData?.commissionEarned || 0;
  const referralCount = referralData?.referralCount || 0;

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const ReferralsContent = () => {
    if (!customer) {
      return <p className="text-center text-slate-500">Please log in to see your referrals.</p>;
    }

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium">How It Works</h3>
          <p className="text-sm text-slate-500 mt-2">
            Share your unique referral link with friends. When a new customer uses your link to make their first purchase on a product with commission, you&apos;ll earn a 50% cut!
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium">Your Referral Link</h3>
          <div className="mt-2 flex rounded-md shadow-sm">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800"
            />
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 dark:border-slate-700 rounded-r-md bg-gray-50 dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-200/50 dark:bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-slate-500">Total Commission Earned</h4>
            <p className="text-2xl font-semibold mt-1">{formatPrice(commissionEarned)}</p>
          </div>
          <div className="bg-slate-200/50 dark:bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-slate-500">Successful Referrals</h4>
            <p className="text-2xl font-semibold mt-1">{referralCount}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">Your Referrals</h3>
          {isLoading ? (
            <div className="mt-4 space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : referrals.length > 0 ? (
            <div className="mt-4 space-y-4">
              {referrals.map(referral => (
                <div key={referral.id} className="bg-slate-200/50 dark:bg-slate-800/50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{referral.refereeName}</p>
                    <p className="text-sm text-slate-500">{referral.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatPrice(referral.commissionEarned)}</p>
                    <p className="text-sm text-slate-500">{referral.orderDate.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">You have no successful referrals for this store yet.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95"
              enterTo="opacity-100 translate-y-0 md:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 md:scale-100"
              leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95"
            >
              <Dialog.Panel className="relative flex w-full max-w-2xl transform text-left text-base transition md:my-8">
                <div className="relative flex w-full flex-col overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-2xl h-screen md:h-auto md:max-h-[90vh] md:rounded-2xl">

                  <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                    <Dialog.Title as="h3" className="text-xl font-bold text-slate-800 dark:text-slate-100">My Referrals</Dialog.Title>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <XMarkIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={customer ? 'content' : 'login-prompt'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ReferralsContent />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="w-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 font-semibold py-3 px-4 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors duration-200">
                      Done
                    </button>
                  </div>

                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export { ReferralsModal };
