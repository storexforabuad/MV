'use client';
import { useState, useEffect, useMemo } from 'react';
import { Gift, Loader2, ServerCrash, CheckCircle } from 'lucide-react';
import { ActivationModal } from './modals/ActivationModal';

// Updated Referral interface to match the new API response
interface Referral {
  id: string;
  businessName: string;
  businessNumber?: string;
  businessCategory?: string;
  businessLocation?: string;
  referralNote?: string;
  status: 'pending' | 'activated';
  referrerStoreId: string; // ID of the store that made the referral
  refereeStoreId?: string; // ID of the new store created from the referral
  activatedAt?: string; // ISO string format
  createdAt?: string;   // ISO string format
}

const DevTeamReferrals: React.FC = () => {
  const [allReferrals, setAllReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'activated'>('pending');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  const fetchAllReferrals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch from the new centralized endpoint
      const response = await fetch('/api/devteam/referrals');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch referrals');
      }
      const data: Referral[] = await response.json();
      setAllReferrals(data);
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
    // Re-fetch all data to get the latest status after an activation
    fetchAllReferrals();
    handleCloseModal();
  };

  // Filter the flat list of referrals based on the active tab
  const filteredReferrals = useMemo(() => {
    return allReferrals.filter(ref => ref.status === activeTab);
  }, [allReferrals, activeTab]);

  const TabButton = ({ tab, label }: { tab: 'pending' | 'activated', label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab
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
      ) : filteredReferrals.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-6">No {activeTab} referrals found.</p>
      ) : (
        <div className="space-y-4">
          {/* We no longer group by store, just list all referrals */}
          {filteredReferrals.map(ref => (
            <div key={ref.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex justify-between items-center border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <div>
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{ref.businessName}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Referred by: <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{ref.referrerStoreId}</span></p>
                {ref.status === 'activated' && ref.refereeStoreId && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Activated as: <span className="font-mono bg-green-100 dark:bg-green-900/50 px-1 rounded">{ref.refereeStoreId}</span></p>
                )}
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                {ref.status === 'pending' ? (
                  <button
                    onClick={() => handleOpenModal(ref)}
                    className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center shadow-md hover:shadow-lg"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
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
