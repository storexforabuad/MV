
"use client";

import { useState } from 'react';
import { useCustomer } from '@/context/CustomerContext';
import { formatPrice } from '@/utils/price';
import ShareReferralModal from '@/components/customer/modals/ShareReferralModal';

interface ReferralBannerProps {
  storeId: string;
  storeName: string;
  onLoginClick: () => void;
}

const ReferralBanner = ({ storeId, storeName, onLoginClick }: ReferralBannerProps) => {
  const { customer } = useCustomer();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const referralLink = customer ? `${window.location.origin}/${storeId}?ref=${customer.referralCode}` : '';

  const LoggedInView = () => (
    <div className="flex justify-between items-center w-full">
      <p className="text-sm font-semibold">
        <span className="font-bold text-green-500">{formatPrice(customer?.totalReferralCommission || 0)}</span> bonus earned!
      </p>
      <button
        onClick={() => setIsShareModalOpen(true)}
        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-full text-sm shadow-md hover:scale-105 transition-transform"
      >
        Share Link
      </button>
    </div>
  );

  const LoggedOutView = () => (
    <div className="flex justify-between items-center w-full">
      <p className="text-sm font-semibold">Get referral bonuses & gifts!</p>
      <button
        onClick={onLoginClick}
        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-full text-sm shadow-md hover:scale-105 transition-transform"
      >
        Log In
      </button>
    </div>
  );

  return (
    <>
      <div className="px-4 sm:px-6 mt-3 mb-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800 text-white p-4 rounded-2xl shadow-lg flex items-center">
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
