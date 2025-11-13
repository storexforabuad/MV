'use client';
import { FC, useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, getCategories } from '@/lib/db';
import { Naira } from '@/components/common/Naira';
import { Eye, Loader2, ServerCrash, Share2 } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

interface ReferralCardProps {
  referral: { 
    id: string;
    businessName: string;
    status: 'pending' | 'activated';
    refereeStoreId?: string;
  };
  ambassadorTier: string;
  onViewDetailsClick: (storeId: string) => void;
}

interface StoreData {
  totalViews?: number;
  totalCommissionEarned?: number;
}

interface Category {
    id: string;
    name: string;
}

interface DailyMetric {
    date: string;
    views: number;
}

const TIER_RATES = {
  bronze: 0.05, 
  silver: 0.10, 
  gold: 0.15,   
  platinum: 0.20, 
};

const ReferralCard: FC<ReferralCardProps> = ({ referral, ambassadorTier, onViewDetailsClick }) => {
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (referral.status !== 'activated' || !referral.refereeStoreId) {
      setIsLoading(false);
      return;
    }

    const storeId = referral.refereeStoreId;

    const fetchExtraData = async () => {
        try {
            // Fetch categories for sharing
            const fetchedCategories = await getCategories(storeId);
            setCategories(fetchedCategories);

            // Fetch daily metrics for trend
            const metricsRef = collection(db, 'stores', storeId, 'dailyMetrics');
            const q = query(metricsRef, orderBy('date', 'desc'), limit(7));
            const metricsSnap = await getDocs(q);
            const last7DaysData = metricsSnap.docs.map(doc => doc.data() as DailyMetric).reverse();
            setDailyMetrics(last7DaysData);

        } catch (catError) {
            console.error('Error fetching extra referral data:', catError);
        }
    };

    fetchExtraData();

    const storeRef = doc(db, 'stores', storeId);
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
      console.error(`Error fetching real-time store data for ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [referral.refereeStoreId, referral.status]);

  const handleShare = async () => {
    if (!referral.refereeStoreId) return;

    const storeUrl = `https://tinyurl.com/bizcononline/${referral.refereeStoreId}`;
    
    let formattedCategories = 'great products';
    if (categories.length > 0) {
        const categoryNames = categories.map(c => c.name);
        const firstFive = categoryNames.slice(0, 5);
        formattedCategories = firstFive.join(', ');
        if (categoryNames.length > 5) {
            formattedCategories += ' and more';
        }
    }

    const caption = `🌟 Discover authentic ${formattedCategories} at affordable prices in the new ${referral.businessName} Online Store! 🛒. Tap the link to shop:`;
    const shareMessage = `${caption}\n${storeUrl}`;

    const shareData = {
        title: `Visit ${referral.businessName}`,
        text: shareMessage,
        url: storeUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareMessage);
        alert('Store link and caption copied to clipboard!');
      }
    } catch (err) {
      console.error('Share/Clipboard error:', err);
      alert('Could not share or copy the store link.');
    }
  };

  const tierRate = TIER_RATES[ambassadorTier.toLowerCase() as keyof typeof TIER_RATES] || 0;
  const earnedBonus = (storeData?.totalCommissionEarned || 0) * tierRate;
  const viewsLast7Days = dailyMetrics.reduce((acc, curr) => acc + curr.views, 0);

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
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow border border-slate-200 dark:border-slate-700/80 flex items-center justify-center min-h-[220px]">
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
    <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/80 w-full flex flex-col">
      <p className="font-bold text-lg text-slate-800 dark:text-slate-100 text-left mb-4">{referral.businessName}</p>

        <div 
            className="text-center mb-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
            onClick={() => referral.refereeStoreId && onViewDetailsClick(referral.refereeStoreId)}
        >
            <p className="text-xs text-slate-500 dark:text-slate-400">Views (Last 7 Days)</p>
            <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-2xl">
              <Eye className="w-5 h-5 text-slate-400"/>
              <span>{viewsLast7Days}</span>
            </div>
            <div className="h-8 mt-2">
                {dailyMetrics.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyMetrics}>
                            <Bar dataKey="views" fill="#fb923c" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
            <p className="text-xs text-slate-400 mt-1">All-Time: {storeData?.totalViews ?? 0}</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <p className="text-slate-600 dark:text-slate-300 self-center">Your Tier Rate ({ambassadorTier}):</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-right self-center">{tierRate * 100}%</p>

          <p className="font-bold text-orange-500 text-base self-center">Your Earned Bonus:</p>
          <div className="font-bold text-orange-500 flex items-baseline justify-end text-lg">
            <Naira className="w-4 h-4 mr-0.5"/> 
            <span>{earnedBonus.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleShare}
        className="w-full mt-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200">
          <Share2 className="w-4 h-4" />
          <span>Share Store</span>
      </button>
    </div>
  );
};

export default ReferralCard;
