'use client';
import { FC, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/db';
import { Naira } from '@/components/common/Naira';
import { Eye, Loader2, ServerCrash } from 'lucide-react';

interface ReferralCardProps {
  referral: { // This is the referral document from the ambassador's sub-collection
    id: string;
    businessName: string;
    status: 'pending' | 'activated';
    refereeStoreId?: string;
  };
  ambassadorTier: string;
}

interface StoreData {
  totalViews?: number;
  totalCommissionEarned?: number;
}

const TIER_RATES = {
  bronze: 0.05, // 5%
  silver: 0.10, // 10%
  gold: 0.15,   // 15%
  platinum: 0.20, // 20%
};

const ReferralCard: FC<ReferralCardProps> = ({ referral, ambassadorTier }) => {
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (referral.status !== 'activated' || !referral.refereeStoreId) {
      setIsLoading(false);
      return;
    }

    const storeRef = doc(db, 'stores', referral.refereeStoreId);
    
    const unsubscribe = onSnapshot(storeRef, (storeSnap) => {
      if (storeSnap.exists()) {
        const data = storeSnap.data();
        setStoreData({
          totalViews: data.totalViews || 0,
          totalCommissionEarned: data.totalCommissionEarned || 0,
        });
      } else {
        setError('Referred store data not found.');
      }
      setIsLoading(false);
    }, (err) => {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [referral.refereeStoreId, referral.status]);

  const tierRate = TIER_RATES[ambassadorTier.toLowerCase() as keyof typeof TIER_RATES] || 0;
  const earnedBonus = (storeData?.totalCommissionEarned || 0) * tierRate;

  if (referral.status === 'pending') {
    return (
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow border border-slate-200 dark:border-slate-700/80">
        <p className="font-semibold text-slate-800 dark:text-slate-100">{referral.businessName}</p>
        <div className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          Activation Pending...
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow border border-slate-200 dark:border-slate-700/80 flex items-center justify-center min-h-[150px]">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500"/>
      </div>
    );
  }

  if (error) {
    return (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl shadow border border-red-200 dark:border-red-800/50">
            <p className="font-semibold text-red-700 dark:text-red-300">{referral.businessName}</p>
            <div className="mt-2 text-center text-sm text-red-500 dark:text-red-400/80 p-3 bg-red-100/50 dark:bg-red-900/30 rounded-lg flex items-center justify-center gap-2">
                <ServerCrash className="w-4 h-4"/> Error: {error}
            </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 w-full">
        {/* Business Name */}
        <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{referral.businessName}</p>

        {/* Mentorship Stats */}
        <div className="flex justify-around gap-4 my-4">
            <div className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Store Views</p>
                <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-lg">
                    <Eye className="w-4 h-4 text-slate-400"/> {storeData?.totalViews ?? 0}
                </div>
            </div>
        </div>

        {/* Commission Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-sm mb-2">
                <p className="text-slate-600 dark:text-slate-300">Referee Store&apos;s Commission:</p>
                <p className="font-semibold flex items-center text-slate-700 dark:text-slate-200">
                    <Naira className="w-3 h-3 mr-0.5"/> {storeData?.totalCommissionEarned?.toFixed(2) ?? '0.00'}
                </p>
            </div>
            <div className="flex justify-between items-center text-sm">
                <p className="text-slate-600 dark:text-slate-300">Your Tier Rate ({ambassadorTier}):</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{tierRate * 100}%</p>
            </div>
            <hr className="my-2 border-slate-200 dark:border-slate-700"/>
            <div className="flex justify-between items-center font-bold text-orange-500">
                <p>Your Earned Bonus:</p>
                <p className="flex items-center text-lg">
                    <Naira className="w-4 h-4 mr-0.5"/> {earnedBonus.toFixed(2)}
                </p>
            </div>
        </div>
    </div>
  );
};

export default ReferralCard;
