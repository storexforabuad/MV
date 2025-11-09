
'use client';
import { useState, FC, FormEvent, useEffect, useCallback, useMemo } from 'react';
import { X, Gift, LayoutDashboard, Loader2 } from 'lucide-react';
import { doc, getDoc, collection, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/db';
import AmbassadorProgressBar from '../ambassador/AmbassadorProgressBar';
import ReferralCard from '../ambassador/ReferralCard';

// --- Re-usable "Refer a Business" Tab Content ---
const ReferBusinessForm = ({ storeId, onReferralAdded }: { storeId: string; onReferralAdded: () => void; }) => {
  const [businessName, setBusinessName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !businessNumber.trim()) {
      setError('Business name and number are required.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/stores/${storeId}/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, businessNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit referral');
      }
      
      setBusinessName('');
      setBusinessNumber('');
      onReferralAdded();
      setSuccessMessage('Referral submitted successfully! Thank you.');
      setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-white">Refer a Business</h3>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-2 mb-6">Know a great business? Refer them to Bizcon and earn rewards when they succeed.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="businessName" className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Name</label>
                <input id="businessName" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Jane's Apparel" className="mt-1 w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition" disabled={isSubmitting}/>
            </div>
            <div>
                <label htmlFor="businessNumber" className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Number</label>
                <input id="businessNumber" type="text" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} placeholder="e.g., 08012345678" className="mt-1 w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition" disabled={isSubmitting}/>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center px-4 py-3 rounded-lg bg-orange-500 text-white font-bold transition-all duration-200 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} 
                {isSubmitting ? 'Submitting...' : 'Submit Referral'}
            </button>
            {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}
            {successMessage && <p className="text-sm text-green-500 text-center pt-2">{successMessage}</p>}
        </form>
    </div>
  );
}

// Define the shape of a referral object for TypeScript
interface Referral {
  id: string;
  status: 'pending' | 'activated';
  businessName: string;
  refereeStoreId?: string;
  activatedAt?: Timestamp;
  createdAt?: Timestamp;
}

// --- Dashboard Tab Content ---
const DashboardContent = ({ storeId, onReferralAdded }: { storeId: string; onReferralAdded: () => void; }) => {
    const [storeData, setStoreData] = useState({ ambassadorTier: 'bronze', activeReferrals: 0 });
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!storeId) return;
        const storeRef = doc(db, 'stores', storeId);
        const unsubscribeStore = onSnapshot(storeRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setStoreData({
                    ambassadorTier: data.ambassadorTier || 'bronze',
                    activeReferrals: data.activeReferrals || 0,
                });
            }
        });

        const referralsRef = collection(db, 'stores', storeId, 'referrals');
        const unsubscribeReferrals = onSnapshot(referralsRef, (snapshot) => {
            const referralsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
            // Sort by pending first, then by date if available
            referralsList.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (b.status === 'pending' && a.status !== 'pending') return 1;
                const dateA = a.activatedAt?.seconds || a.createdAt?.seconds || 0;
                const dateB = b.activatedAt?.seconds || b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setReferrals(referralsList);
            setIsLoading(false);
        });
        
        // Callback to refresh parent if a new referral is added from the other tab
        onReferralAdded();

        return () => {
            unsubscribeStore();
            unsubscribeReferrals();
        };
    }, [storeId, onReferralAdded]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500"/></div>
    }

    return (
        <div className="space-y-6">
            <AmbassadorProgressBar 
                ambassadorTier={storeData.ambassadorTier}
                activeReferrals={storeData.activeReferrals}
            />
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Your Referred Stores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {referrals.map(ref => (
                        <ReferralCard 
                            key={ref.id}
                            referral={ref}
                            ambassadorTier={storeData.ambassadorTier}
                        />
                    ))}
                    {referrals.length === 0 && (
                        <p className="col-span-full text-center text-slate-500 dark:text-slate-400 py-8">
                            You haven't referred any businesses yet. Use the 'Refer a Business' tab to get started!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Main Hub Modal ---
interface AmbassadorHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onReferralAdded: () => void;
}

export const AmbassadorHubModal: FC<AmbassadorHubModalProps> = ({ isOpen, onClose, storeId, onReferralAdded }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'refer'>('dashboard');

  if (!isOpen) return null;

  const TabButton = ({ tab, label, icon: Icon }: { tab: 'dashboard' | 'refer', label: string, icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-colors duration-200 border-b-2 ${
        activeTab === tab
          ? 'text-orange-500 border-orange-500'
          : 'text-slate-500 border-transparent hover:text-orange-500 hover:border-orange-300'
      }`}
    >
      <Icon className="w-5 h-5"/>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center animation-fade-in" onClick={onClose}>
        <style jsx>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .animation-fade-in { animation: fade-in 0.2s ease-out; }
        `}</style>
        <div className="relative flex flex-col w-full h-full bg-slate-50 dark:bg-slate-950 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ambassador Hub</h2>
                <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors" aria-label="Close">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <TabButton tab="dashboard" label="Dashboard" icon={LayoutDashboard} />
                <TabButton tab="refer" label="Refer a Business" icon={Gift} />
            </div>
            <div className="flex-grow overflow-y-auto p-4 sm:p-6">
                {activeTab === 'dashboard' ? (
                    <DashboardContent storeId={storeId} onReferralAdded={onReferralAdded}/>
                ) : (
                    <ReferBusinessForm storeId={storeId} onReferralAdded={onReferralAdded} />
                )}
            </div>
        </div>
    </div>
  );
};
