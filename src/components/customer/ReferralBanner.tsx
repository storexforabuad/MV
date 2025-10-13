
"use client";

import { useState } from 'react';
import { useCustomer } from '@/context/CustomerContext';
import { formatPrice } from '@/utils/price';
import ShareReferralModal from '@/components/customer/modals/ShareReferralModal';
import { Gift } from 'lucide-react';

interface ReferralBannerProps {
  storeId: string;
  storeName: string;
  onLoginClick: () => void;
}

const ReferralBanner = ({ storeId, storeName, onLoginClick }: ReferralBannerProps) => {
  const { customer } = useCustomer();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const referralLink = customer ? `${window.location.origin}/${storeId}?ref=${customer.referralCode}` : '';

  // Get the store-specific commission, defaulting to 0 if not present
  const commissionEarned = customer?.referralDataByStore?.[storeId]?.commissionEarned || 0;

  const shimmerEffectClasses = `
    relative overflow-hidden 
    before:absolute before:inset-0 before:-translate-x-full 
    before:animate-[shimmer_3s_infinite] 
    before:bg-gradient-to-r before:from-transparent 
    dark:before:via-slate-800/50 before:via-slate-200/50 before:to-transparent
  `;

  const LoggedInView = () => (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        <Gift className="text-purple-500" size={24} />
        <p className="text-sm text-slate-700 dark:text-slate-300">
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(commissionEarned)}</span> Referral bonus earned!
        </p>
      </div>
      <button
        onClick={() => setIsShareModalOpen(true)}
        className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold py-2 px-5 rounded-full text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all whitespace-nowrap flex items-center justify-center"
      >
        Share 
      </button>
    </div>
  );

  const LoggedOutView = () => (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        <Gift className="text-purple-500" size={24} />
        <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">Get referral bonuses & gifts!</p>
      </div>
      <button
        onClick={onLoginClick}
        className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold py-2 px-5 rounded-full text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all whitespace-nowrap flex items-center justify-center"
      >
        Log In
      </button>
    </div>
  );

  return (
    <>
      <div className="px-4 sm:px-6 mt-3 mb-2">
        <div className={`bg-slate-100 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 p-4 rounded-2xl shadow-sm flex items-center ${shimmerEffectClasses}`}>
          {customer ? <LoggedInView /> : <LoggedOutView />}
        </div>
      </div>

      {customer && (
        <ShareReferralModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          storeName={storeName}
          referralLink={referralLink}
        />
      )}
    </>
  );
};

export default ReferralBanner;
