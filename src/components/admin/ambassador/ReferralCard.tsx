'use client';
import { FC, useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db, getCategories } from '@/lib/db';
import { Naira } from '@/components/common/Naira';
import { Eye, Loader2, ServerCrash, Share2, ShieldCheck, Zap } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import { getStatusDisplay, SubscriptionStatus } from '@/types/subscription';

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
  subscriptionStatus?: SubscriptionStatus;
  nextBillingDate?: Timestamp;
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
          subscriptionStatus: data.subscriptionStatus || 'trial',
          nextBillingDate: data.nextBillingDate,
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

    const storeUrl = `https://tinyurl.com/atlasintl/${referral.refereeStoreId}`;

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

  const viewsLast7Days = dailyMetrics.reduce((acc, curr) => acc + curr.views, 0);
  const statusInfo = storeData?.subscriptionStatus ? getStatusDisplay(storeData.subscriptionStatus) : null;

  // Calculate urgency
  let urgencyColor = 'border-slate-200 dark:border-slate-700/80';
  let daysUntilDue = null;

  if (storeData?.nextBillingDate) {
    const now = new Date();
    const dueDate = storeData.nextBillingDate.toDate();
    const diffTime = dueDate.getTime() - now.getTime();
    daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 2) {
      urgencyColor = 'border-red-500 shadow-red-500/20';
    } else if (daysUntilDue <= 7) {
      urgencyColor = 'border-yellow-500 shadow-yellow-500/20';
    }
  }

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
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl shadow border border-red-200 dark:border-red-800/50">
        <p className="font-semibold text-red-700 dark:text-red-300">{referral.businessName}</p>
        <div className="mt-2 text-center text-sm text-red-500 dark:text-red-400/80 p-3 bg-red-100/50 dark:bg-red-900/30 rounded-lg flex items-center justify-center gap-2">
          <ServerCrash className="w-4 h-4" /> Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow-lg border w-full flex flex-col transition-all duration-300 ${urgencyColor}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-bold text-lg text-slate-800 dark:text-slate-100 text-left">{referral.businessName}</p>
          {daysUntilDue !== null && daysUntilDue <= 7 && (
            <p className={`text-xs font-bold mt-1 ${daysUntilDue <= 2 ? 'text-red-500' : 'text-yellow-600'}`}>
              {daysUntilDue <= 0 ? 'Due Today!' : `Due in ${daysUntilDue} days`}
            </p>
          )}
        </div>
        {statusInfo && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusInfo.color === 'green' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
            statusInfo.color === 'blue' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
              statusInfo.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                'bg-red-500/10 text-red-600 border-red-500/20'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusInfo.label}
          </div>
        )}
      </div>

      <div
        className="text-center mb-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
        onClick={() => referral.refereeStoreId && onViewDetailsClick(referral.refereeStoreId)}
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">Views (Last 7 Days)</p>
        <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-2xl">
          <Eye className="w-5 h-5 text-slate-400" />
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

      <div className="bg-green-500/5 dark:bg-green-500/10 p-4 rounded-lg mb-4 border border-green-500/10">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Zap className="w-4 h-4 fill-current" />
          <p className="text-sm font-bold">Discount Secured</p>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          This referral helps maintain your 50% ambassador discount.
        </p>
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
