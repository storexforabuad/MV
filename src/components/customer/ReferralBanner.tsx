
"use client";

import { useState } from 'react';
import { useCustomer } from '@/context/CustomerContext';
import { formatPrice } from '@/utils/price';
import ShareReferralModal from '@/components/customer/modals/ShareReferralModal';
import { Gift, Sparkles, LogIn, Share2 } from 'lucide-react';

interface ReferralBannerProps {
  storeId: string;
  storeName: string;
  onLoginClick: () => void;
}

const ReferralBanner = ({ storeId, storeName, onLoginClick }: ReferralBannerProps) => {
  const { customer } = useCustomer();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const referralLink = customer ? `https://tinyurl.com/bizcononline/${storeId}?ref=${customer.referralCode}` : '';
  const commissionEarned = customer?.referralDataByStore?.[storeId]?.commissionEarned || 0;

  const shimmerEffectClasses = `
    relative overflow-hidden 
    before:absolute before:inset-0 before:-translate-x-full 
    before:animate-[shimmer_4s_infinite] 
    before:bg-gradient-to-r before:from-transparent 
    before:via-white/5 before:to-transparent
  `;

  const LoggedInView = () => (
    <div className="flex justify-between items-center w-full gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
          <Gift className="text-amber-400" size={20} />
        </div>
        <div>
          <p className="text-xs text-indigo-200/60 font-medium uppercase tracking-wider">Your Rewards</p>
          <p className="text-sm text-white font-bold">
            <span className="text-amber-400">{formatPrice(commissionEarned)}</span> bonus earned!
          </p>
        </div>
      </div>
      <button
        onClick={() => setIsShareModalOpen(true)}
        className="bg-gradient-to-br from-amber-400 to-amber-600 text-indigo-950 font-black py-2.5 px-6 rounded-xl text-xs shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap flex items-center gap-2"
      >
        <Share2 size={14} />
        Share
      </button>
    </div>
  );

  const LoggedOutView = () => (
    <div className="flex justify-between items-center w-full gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 flex-shrink-0">
          <Sparkles className="text-amber-400" size={16} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-indigo-200/60 font-medium uppercase tracking-wider truncate">Join & Earn</p>
          <p className="text-[11px] sm:text-sm text-white font-bold truncate">Get referral bonuses & gifts!</p>
        </div>
      </div>
      <button
        onClick={onLoginClick}
        className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl text-[11px] sm:text-xs border border-white/10 shadow-lg backdrop-blur-md active:scale-[0.98] transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0"
      >
        <LogIn size={12} className="sm:w-3.5 sm:h-3.5" />
        Log In
      </button>
    </div>
  );

  return (
    <>
      <div className="px-4 sm:px-6 mt-3 mb-4">
        <div className={`relative bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/20 p-4 rounded-[1.5rem] shadow-xl flex items-center ${shimmerEffectClasses}`}>
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/5 blur-[50px] rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full" />

          <div className="relative z-10 w-full">
            {customer ? <LoggedInView /> : <LoggedOutView />}
          </div>
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
