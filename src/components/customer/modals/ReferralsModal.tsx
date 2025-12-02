'use client';

import React, { Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { GiftIcon, UsersIcon, SparklesIcon, ShareIcon, ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useCustomer } from '@/context/CustomerContext';
import { useReferrals } from '@/hooks/useReferrals';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';

interface ReferralsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

// Helper function to format the date header
const formatDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const ReferralsModal: React.FC<ReferralsModalProps> = ({ isOpen, onClose, storeId }) => {
  const { customer } = useCustomer();
  const { referrals, isLoading } = useReferrals(customer?.id || null, storeId);

  const referralLink = customer ? `https://tinyurl.com/bizcononline/${storeId}?ref=${customer.referralCode}` : '';

  const referralData = customer?.referralDataByStore?.[storeId];
  const commissionEarned = referralData?.commissionEarned || 0;
  const referralCount = referralData?.referralCount || 0;

  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Group referrals by date
  const groupedReferrals = useMemo(() => {
    if (!referrals) return {};

    return referrals.reduce((acc, referral) => {
      const referralDate = new Date(referral.orderDate.toDate()).toDateString();
      if (!acc[referralDate]) {
        acc[referralDate] = [];
      }
      acc[referralDate].push(referral);
      return acc;
    }, {} as Record<string, typeof referrals>);

  }, [referrals]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedReferrals).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedReferrals]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* --- Overlay --- */}
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

        {/* --- Modal Content --- */}
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
                <div className="relative flex w-full flex-col overflow-hidden bg-background shadow-2xl h-screen md:h-[90vh] md:rounded-2xl">

                  {/* Header */}
                  <div className="p-4 flex justify-between items-center border-b border-border-color sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                      <Dialog.Title as="h3" className="text-xl font-bold card-text-gradient">Referral Bonuses</Dialog.Title>
                    </div>
                    <GiftIcon className="h-6 w-6 text-text-secondary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <AnimatePresence mode="wait">
                      {!customer ? (
                        <motion.div
                          key="no-customer"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center h-full text-center py-12"
                        >
                          <GiftIcon className="w-24 h-24 text-zinc-600 mb-4" />
                          <h3 className="text-xl font-semibold text-text-primary">Login Required</h3>
                          <p className="text-text-secondary mt-2 max-w-xs">
                            Please log in to view your referral bonuses and share your link.
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="customer-content"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="space-y-6"
                        >
                          {/* Hero Section - Total Earned */}
                          <motion.div
                            variants={itemVariants}
                            className="card-glass rounded-2xl p-6 text-center"
                          >
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <SparklesIcon className="w-6 h-6 text-indigo-500" />
                              <p className="text-sm font-medium text-text-secondary">Total Earned</p>
                            </div>
                            <p className="text-4xl sm:text-5xl font-bold card-text-gradient">
                              {formatPrice(commissionEarned)}
                            </p>
                            <p className="text-xs text-text-secondary mt-2">from referral bonuses</p>
                          </motion.div>

                          {/* Stats Cards */}
                          <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-2 gap-3"
                          >
                            <div className="card-glass rounded-xl p-4 text-center">
                              <UsersIcon className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-text-primary">{referralCount}</p>
                              <p className="text-xs text-text-secondary mt-1">Successful Referrals</p>
                            </div>
                            <div className="card-glass rounded-xl p-4 text-center">
                              <GiftIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-text-primary">{referrals.length}</p>
                              <p className="text-xs text-text-secondary mt-1">Total Orders</p>
                            </div>
                          </motion.div>

                          {/* How It Works */}
                          <motion.div
                            variants={itemVariants}
                            className="card-glass rounded-xl p-4"
                          >
                            <h4 className="text-sm font-semibold text-text-primary mb-2">🎯 How It Works</h4>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              Share your unique referral link with friends. When a new customer uses your link to make their first purchase, you'll earn a percentage, gifts and so much more!
                            </p>
                          </motion.div>

                          {/* Share Section */}
                          <motion.div
                            variants={itemVariants}
                            className="card-glass rounded-xl p-4"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <ShareIcon className="w-5 h-5 text-indigo-500" />
                              <h4 className="text-sm font-semibold text-text-primary">Share Your Link</h4>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                readOnly
                                value={referralLink}
                                className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                onClick={handleCopyLink}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
                              >
                                {copied ? (
                                  <>
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>

                          {/* Referrals List */}
                          <motion.div variants={itemVariants}>
                            <h4 className="text-sm font-semibold text-text-primary mb-3">Recent Referrals</h4>
                            {isLoading ? (
                              <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className="h-20 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
                                ))}
                              </div>
                            ) : referrals.length > 0 ? (
                              <div className="space-y-4">
                                {sortedDateKeys.map((dateKey, index) => (
                                  <motion.div
                                    key={dateKey}
                                    className="mb-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                                  >
                                    <h5 className="font-semibold text-xs card-text-gradient mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1">
                                      {formatDateGroup(dateKey)}
                                    </h5>
                                    <div className="space-y-2">
                                      {groupedReferrals[dateKey].map(referral => (
                                        <div key={referral.id} className="card-glass rounded-xl p-3 flex justify-between items-center">
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-text-primary truncate">{referral.refereeName}</p>
                                            <p className="text-xs text-text-secondary truncate">{referral.productName}</p>
                                          </div>
                                          <div className="text-right ml-3">
                                            <p className="font-bold text-sm text-green-600 dark:text-green-400">{formatPrice(referral.commissionEarned)}</p>
                                            <p className="text-xs text-text-secondary">{referral.orderDate.toDate().toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="card-glass rounded-xl p-8 text-center"
                              >
                                <GiftIcon className="w-16 h-16 text-zinc-400 mx-auto mb-3" />
                                <h4 className="text-lg font-semibold text-text-primary mb-1">No Referrals Yet</h4>
                                <p className="text-sm text-text-secondary max-w-xs mx-auto">
                                  Start sharing your referral link to earn bonuses when your friends make their first purchase!
                                </p>
                              </motion.div>
                            )}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="bg-background/80 backdrop-blur-sm p-4 border-t border-border-color">
                      <button onClick={handleClose} className="w-full bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 font-semibold py-3 px-4 rounded-full hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors duration-200">
                        close
                      </button>
                    </div>
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
