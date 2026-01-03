'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Gift, Users, Sparkles, Share2, Copy, CheckCircle, Trophy, Star, Calendar, Loader2 } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

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

  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* --- Header --- */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Referral Bonuses
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your rewards & bonuses</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {!customer ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  <Gift className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Login Required</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                  Please log in to view your referral bonuses and share your link.
                </p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {/* === KPIs Start === */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-600 dark:via-purple-700 dark:to-violet-900 p-4 sm:p-6 rounded-2xl shadow-md">
                    <p className="text-sm text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Total Earned
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold flex items-center text-slate-900 dark:text-white">
                      <Naira />{commissionEarned.toLocaleString()}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium mt-1">
                      from referral bonuses
                    </p>
                  </div>
                  <div className="bg-slate-100 dark:bg-gradient-to-br dark:from-slate-700 dark:via-gray-800 dark:to-zinc-900 p-4 sm:p-6 rounded-2xl shadow-md">
                    <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Successful Referrals
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                      {referralCount}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      friends joined
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full">
                      <Star className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{referrals.length}</p>
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                      <Trophy className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Next Reward</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">Coming Soon</p>
                    </div>
                  </div>
                </div>
                {/* === KPIs End === */}

                {/* Share Section */}
                <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Share2 className="w-5 h-5 text-indigo-500" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Share Your Link</h4>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 truncate">
                      {referralLink}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-md active:scale-95"
                    >
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      <span>{copied ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                    🎯 Share your unique referral link with friends. When a new customer uses your link to make their first purchase, you'll earn a percentage, gifts and so much more!
                  </p>
                </motion.div>

                {/* Referrals List */}
                <motion.div variants={itemVariants} className="pb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Recent Referrals
                  </h3>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  ) : referrals.length > 0 ? (
                    <div className="space-y-6">
                      {sortedDateKeys.map((dateKey) => (
                        <div key={dateKey}>
                          <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm py-2 z-10">
                            {formatDateGroup(dateKey)}
                          </h4>
                          <div className="space-y-3">
                            {groupedReferrals[dateKey].map(referral => (
                              <div key={referral.id} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex justify-between items-center">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{referral.refereeName}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{referral.productName}</p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                    +{formatPrice(referral.commissionEarned)}
                                  </p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
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
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                      <Gift className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">No Referrals Yet</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                        Start sharing your referral link to earn bonuses when your friends make their first purchase!
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </main>

          {/* --- Footer --- */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-800">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { ReferralsModal };
