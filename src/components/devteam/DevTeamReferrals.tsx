'use client';
import { useState, useEffect, useMemo } from 'react';
import { Gift, Loader2, ServerCrash, CheckCircle, Clock } from 'lucide-react';
import { ActivationModal } from './modals/ActivationModal';

interface Referral {
  id: string;
  businessName: string;
  businessNumber: string;
  storeId: string;
  createdAt: string;
  status: 'pending' | 'activated';
  refereeStoreId?: string;
  activatedAt?: string;
}

interface ReferralsByStore {
  [key: string]: Referral[];
}

const DevTeamReferrals: React.FC = () => {
  const [referralsByStore, setReferralsByStore] = useState<ReferralsByStore>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'activated'>('pending');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  const fetchAllReferrals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/devteam/referrals');
      if (!response.ok) {
        throw new Error('Failed to fetch referrals for dev team');
      }
      const data: ReferralsByStore = await response.json();
      // The API now returns a status field, so we can use it directly
      setReferralsByStore(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReferrals();
  }, []);

  const handleOpenModal = (referral: Referral) => {
    setSelectedReferral(referral);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReferral(null);
  };

  const handleActivationSuccess = () => {
    // Re-fetch all data to get the latest status
    fetchAllReferrals();
  };

  const filteredReferrals = useMemo(() => {
    const filtered: ReferralsByStore = {};
    for (const storeId in referralsByStore) {
      const storeReferrals = referralsByStore[storeId].filter(ref => ref.status === activeTab);
      if (storeReferrals.length > 0) {
        filtered[storeId] = storeReferrals;
      }
    }
    return filtered;
  }, [referralsByStore, activeTab]);

  const storeIds = Object.keys(filteredReferrals);

  const TabButton = ({ tab, label }: { tab: 'pending' | 'activated', label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-orange-500 text-white'
          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-slate-900 shadow-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Gift className="w-6 h-6 text-orange-500 mr-3" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">All Store Referrals</h2>
        </div>
        <div className="flex space-x-2">
          <TabButton tab="pending" label="Pending" />
          <TabButton tab="activated" label="Activated" />
        </div>
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
        <p className="text-center text-slate-500 dark:text-slate-400 py-6">No {activeTab} referrals found.</p>
      ) : (
        <div className="space-y-6">
          {storeIds.map(storeId => (
            <div key={storeId} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
              <h3 className="font-bold text-md text-slate-700 dark:text-slate-200 mb-3 truncate">Referrer Store: <span className="font-mono text-sm bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{storeId}</span></h3>
              <div className="space-y-3">
                {filteredReferrals[storeId].map(ref => (
                  <div key={ref.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{ref.businessName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{ref.businessNumber}</p>
                      {ref.status === 'activated' && ref.refereeStoreId && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Activated as: <span className="font-mono bg-green-100 dark:bg-green-900/50 px-1 rounded">{ref.refereeStoreId}</span></p>
                      )}
                    </div>
                    <div className="text-right">
                        {ref.status === 'pending' ? (
                            <button 
                                onClick={() => handleOpenModal(ref)}
                                className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center"
                            >
                                <CheckCircle className="w-4 h-4 mr-1.5"/>
                                Activate
                            </button>
                        ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Activated: {ref.activatedAt ? new Date(ref.activatedAt).toLocaleDateString() : 'N/A'}
                            </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReferral && (
        <ActivationModal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            referral={selectedReferral}
            onActivationSuccess={handleActivationSuccess}
        />
      )}
    </div>
  );
};

export default DevTeamReferrals;
