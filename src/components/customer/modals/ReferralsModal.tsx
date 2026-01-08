'use client';

import React, { useMemo, useEffect, useState, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Gift, Users, Sparkles, Share2, Copy, CheckCircle, Trophy, Star, Calendar, Loader2, X } from 'lucide-react';
import { useCustomer } from '@/context/CustomerContext';
import { useReferrals } from '@/hooks/useReferrals';
import { formatPrice } from '@/utils/price';
import toast from 'react-hot-toast';
import { Naira } from '@/components/common/Naira';

interface ReferralsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

const formatDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const ReferralsModal: React.FC<ReferralsModalProps> = ({ isOpen, onClose, storeId }) => {
  const { customer } = useCustomer();
  const { referrals, isLoading } = useReferrals(customer?.id || null, storeId);
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const referralLink = customer ? `https://tinyurl.com/bizcononline/${storeId}?ref=${customer.referralCode}` : '';
  const referralData = customer?.referralDataByStore?.[storeId];
  const commissionEarned = referralData?.commissionEarned || 0;
  const referralCount = referralData?.referralCount || 0;

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const groupedReferrals = useMemo(() => {
    if (!referrals) return {};
    return referrals.reduce((acc, referral) => {
      const referralDate = new Date(referral.orderDate.toDate()).toDateString();
      if (!acc[referralDate]) acc[referralDate] = [];
      acc[referralDate].push(referral);
      return acc;
    }, {} as Record<string, typeof referrals>);
  }, [referrals]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedReferrals).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedReferrals]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-t-[2rem] bg-white dark:bg-modal-background text-left align-middle shadow-2xl transition-all flex flex-col max-h-[92vh] sm:max-w-2xl sm:rounded-2xl sm:max-h-[85vh]">

                {/* Handle Bar for Mobile */}
                <div className="flex-shrink-0 pt-3 pb-1 flex justify-center sm:hidden">
                  <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-modal-background">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Referral Bonuses
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your rewards & bonuses</p>
                  </div>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors shadow-sm"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Content */}
                <div ref={scrollContainerRef} className="flex-grow overflow-y-auto">
                  <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
                    {!customer ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                          <Gift className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Login Required</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                          Please log in to view your referral bonuses and share your link.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-800">
                            <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-1">
                              <Sparkles className="w-4 h-4" /> Total Earned
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                              <Naira />{commissionEarned.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4" /> Referrals
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                              {referralCount}
                            </p>
                          </div>
                        </div>

                        {/* Share Section */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-2 mb-4">
                            <Share2 className="w-5 h-5 text-purple-500" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">Share Your Link</h4>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-600 dark:text-gray-300 truncate">
                              {referralLink}
                            </div>
                            <button
                              onClick={handleCopyLink}
                              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
                            >
                              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                              <span>{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Referrals List */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" /> Recent Referrals
                          </h3>
                          {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                          ) : referrals.length > 0 ? (
                            <div className="space-y-6">
                              {sortedDateKeys.map((dateKey) => (
                                <div key={dateKey}>
                                  <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 sticky top-0 bg-white/95 dark:bg-modal-background/95 backdrop-blur-md py-3 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-100/50 dark:border-gray-800/50">
                                    {formatDateGroup(dateKey)}
                                  </h4>
                                  <div className="space-y-3">
                                    {groupedReferrals[dateKey].map(referral => (
                                      <div key={referral.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-xl flex justify-between items-center shadow-sm">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-gray-900 dark:text-white truncate">{referral.refereeName}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{referral.productName}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                            +{formatPrice(referral.commissionEarned)}
                                          </p>
                                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            {referral.orderDate.toDate().toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
                              <Gift className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                              <h4 className="font-semibold text-gray-900 dark:text-white">No Referrals Yet</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                                Start sharing your referral link to earn bonuses!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
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
};

export { ReferralsModal };
