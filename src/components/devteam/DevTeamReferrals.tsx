'use client';
import { useState, useEffect } from 'react';
import { Gift, Loader2, ServerCrash } from 'lucide-react';

interface Referral {
  id: string;
  businessName: string;
  businessNumber: string;
  storeId: string;
  createdAt: string; // Changed to string to match API response
}

interface ReferralsByStore {
  [key: string]: Referral[];
}

const DevTeamReferrals: React.FC = () => {
  const [referralsByStore, setReferralsByStore] = useState<ReferralsByStore>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllReferrals = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/devteam/referrals');
        if (!response.ok) {
          throw new Error('Failed to fetch referrals for dev team');
        }
        const data: ReferralsByStore = await response.json();
        setReferralsByStore(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllReferrals();
  }, []);

  const storeIds = Object.keys(referralsByStore);

  return (
    <div className="bg-white dark:bg-slate-900 shadow-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center mb-4">
        <Gift className="w-6 h-6 text-orange-500 mr-3" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">All Store Referrals</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : error ? (
        <div className="text-center p-8 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
          <ServerCrash className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="font-semibold text-red-600 dark:text-red-400">Error Loading Referrals</p>
          <p className="text-sm text-red-500 dark:text-red-400/80">{error}</p>
        </div>
      ) : storeIds.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-6">No referrals have been submitted by any store yet.</p>
      ) : (
        <div className="space-y-6">
          {storeIds.map(storeId => (
            <div key={storeId} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
              <h3 className="font-bold text-md text-slate-700 dark:text-slate-200 mb-3 truncate">Store ID: <span className="font-mono text-sm bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{storeId}</span></h3>
              <div className="space-y-2">
                {referralsByStore[storeId].map(ref => (
                  <div key={ref.id} className="p-3 bg-white dark:bg-slate-800 rounded-md flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{ref.businessName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{ref.businessNumber}</p>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevTeamReferrals;
