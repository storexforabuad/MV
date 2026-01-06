'use client';
import { useState, FC, FormEvent, useEffect, useCallback, useMemo } from 'react';
import { X, Gift, LayoutDashboard, Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/db';
import AmbassadorProgressBar from '../ambassador/AmbassadorProgressBar';
import ReferralCard from '../ambassador/ReferralCard';
import ViewsBreakdown from '@/components/common/ViewsBreakdown';

// --- Re-usable "Refer a Business" Tab Content ---
const ReferBusinessForm = ({ storeId, onReferralAdded }: { storeId: string; onReferralAdded: () => void; }) => {
  const [businessName, setBusinessName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [referralNote, setReferralNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categories = [
    'Fashion',
    'Electronics',
    'Food & Drinks',
    'Beauty & Personal Care',
    'Home & Living',
    'Services',
    'Automotive',
    'Livestock',
    'Others'
  ];

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
        body: JSON.stringify({
          businessName,
          businessNumber,
          businessCategory,
          businessLocation,
          referralNote
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit referral');
      }

      setBusinessName('');
      setBusinessNumber('');
      setBusinessCategory('');
      setBusinessLocation('');
      setReferralNote('');
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
      <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-2 mb-6">Know a great business? Refer them to Bizpro and help them grow while securing your 50% discount.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="businessName" className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Name</label>
          <input id="businessName" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Jane's Apparel" className="mt-1 w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition" disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="businessNumber" className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Number</label>
          <input id="businessNumber" type="text" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} placeholder="e.g., 08012345678" className="mt-1 w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition" disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="businessCategory" className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Category</label>
          <select id="businessCategory" value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} className="mt-1 w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition" disabled={isSubmitting}>
            <option value="">Select a category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="businessLocation" className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Location</label>
          <input id="businessLocation" type="text" value={businessLocation} onChange={(e) => setBusinessLocation(e.target.value)} placeholder="e.g., Lagos, Nigeria" className="mt-1 w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition" disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="referralNote" className="text-sm font-medium text-slate-700 dark:text-slate-300">Referral Note (Optional)</label>
          <textarea id="referralNote" value={referralNote} onChange={(e) => setReferralNote(e.target.value)} placeholder="Tell us more about this business..." className="mt-1 w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition min-h-[100px]" disabled={isSubmitting} />
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

interface Referral {
  id: string;
  status: 'pending' | 'activated';
  businessName: string;
  businessNumber?: string;
  businessCategory?: string;
  businessLocation?: string;
  referralNote?: string;
  refereeStoreId?: string;
  activatedAt?: Timestamp;
  createdAt?: Timestamp;
}

const DashboardContent = ({ storeId, onReferralAdded, onViewDetailsClick }: { storeId: string; onReferralAdded: () => void; onViewDetailsClick: (storeId: string) => void; }) => {
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
    const unsubscribeReferrals = onSnapshot(query(referralsRef, orderBy('createdAt', 'desc')), (snapshot) => {
      const referralsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
      referralsList.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return (b.activatedAt?.seconds || 0) - (a.activatedAt?.seconds || 0);
      });
      setReferrals(referralsList);
      setIsLoading(false);
    });

    return () => {
      unsubscribeStore();
      unsubscribeReferrals();
    };
  }, [storeId, onReferralAdded]);

  if (isLoading) {
    return <div className="flex justify-center items-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-500/10 dark:bg-orange-500/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800/50">
        <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400 mb-2">Ongoing 50% Discount</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          As a Bizpro Ambassador, you enjoy a 50% discount on your monthly subscription.
          Refer new businesses to keep this benefit active and help our community grow!
        </p>
      </div>
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
              onViewDetailsClick={onViewDetailsClick}
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


interface AmbassadorHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onReferralAdded: () => void;
}

export const AmbassadorHubModal: FC<AmbassadorHubModalProps> = ({ isOpen, onClose, storeId, onReferralAdded }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'refer'>('dashboard');
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);

  const handleViewDetailsClick = (storeId: string) => {
    setViewingStoreId(storeId);
  };

  const handleCloseDetails = () => {
    setViewingStoreId(null);
  };

  // Reset view when main modal is closed
  useEffect(() => {
    if (!isOpen) {
      setViewingStoreId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const TabButton = ({ tab, label, icon: Icon }: { tab: 'dashboard' | 'refer', label: string, icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-colors duration-200 border-b-2 ${activeTab === tab
        ? 'text-orange-500 border-orange-500'
        : 'text-slate-500 border-transparent hover:text-orange-500 hover:border-orange-300'
        }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  const storeName = viewingStoreId ? 'Store' : ''; // Basic name, can be fetched for more detail

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100vh' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100vh' }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Ambassador Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Secure your 50% subscription discount</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </header>
          <div className="flex flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <TabButton tab="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <TabButton tab="refer" label="Refer a Business" icon={Gift} />
          </div>
          <div className="flex-grow overflow-y-auto p-4 sm:p-6">
            {activeTab === 'dashboard' ? (
              <DashboardContent storeId={storeId} onReferralAdded={onReferralAdded} onViewDetailsClick={handleViewDetailsClick} />
            ) : (
              <ReferBusinessForm storeId={storeId} onReferralAdded={onReferralAdded} />
            )}
          </div>

          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="relative max-w-3xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </footer>

          {/* Detailed Views Modal Layer */}
          {viewingStoreId && (
            <div className="absolute inset-0 z-10 bg-slate-50 dark:bg-slate-950 flex flex-col animation-fade-in">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
                <button onClick={handleCloseDetails} className="flex items-center gap-2 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Go back">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-bold">Store Analytics</span>
                </button>
                <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors" aria-label="Close">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-4 sm:p-6">
                <ViewsBreakdown storeId={viewingStoreId} />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
