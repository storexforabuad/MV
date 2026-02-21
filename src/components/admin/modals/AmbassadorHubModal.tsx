'use client';
import { useState, FC, FormEvent, useEffect, useCallback, useMemo } from 'react';
import { X, Gift, LayoutDashboard, Loader2, ArrowLeft, Trophy, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/db';
import ReferralCard from '../ambassador/ReferralCard';
import ViewsBreakdown from '@/components/common/ViewsBreakdown';
import { SUBSCRIPTION_CONFIG } from '@/types/subscription';

// --- Re-usable "Refer a Business" Form Overlay Content ---
const ReferBusinessForm = ({ storeId, onReferralAdded, onClose }: { storeId: string; onReferralAdded: () => void; onClose: () => void; }) => {
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
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">Back to Hub</span>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Refer a Business</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Know a great business? Refer them to BizConnect™and help them grow while securing your 50% discount.
            </p>
          </div>

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
            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center px-4 py-3 rounded-lg bg-orange-500 text-white font-bold transition-all duration-200 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30">
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Referral'}
            </button>
            {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}
            {successMessage && <p className="text-sm text-green-500 text-center pt-2">{successMessage}</p>}
          </form>
        </div>
      </div>
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

interface AmbassadorHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onReferralAdded: () => void;
}

export const AmbassadorHubModal: FC<AmbassadorHubModalProps> = ({ isOpen, onClose, storeId, onReferralAdded }) => {
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  const [isReferralFormOpen, setIsReferralFormOpen] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeData, setStoreData] = useState({ activeReferrals: 0 });

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
      setIsReferralFormOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!storeId) return;

    // Fetch store data for active referrals count
    const storeRef = doc(db, 'stores', storeId);
    const unsubscribeStore = onSnapshot(storeRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStoreData({
          activeReferrals: data.activeReferrals || 0,
        });
      }
    });

    // Fetch referrals list
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

  if (!isOpen) return null;

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
          <header className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-100 dark:border-amber-900/30 flex-shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-900">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Ambassador Hub
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800">
                  Premium
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your network & discounts</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </button>
          </header>

          <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-amber-400 font-medium mb-1 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Ambassador Status
                    </p>
                    <h3 className="text-3xl font-bold">Active</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm mb-1">Current Savings</p>
                    <p className="text-2xl font-bold text-white">₦{(SUBSCRIPTION_CONFIG.ORIGINAL_MONTHLY_AMOUNT - SUBSCRIPTION_CONFIG.MONTHLY_AMOUNT).toLocaleString()}<span className="text-sm text-slate-400 font-normal">/mo</span></p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">50% Discount Secured</p>
                      <p className="text-xs text-slate-300">Your subscription is currently ₦{SUBSCRIPTION_CONFIG.MONTHLY_AMOUNT.toLocaleString()} instead of ₦{SUBSCRIPTION_CONFIG.ORIGINAL_MONTHLY_AMOUNT.toLocaleString()}.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referrals List */}
            <div className="mb-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Network</h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">{referrals.length} Referrals</span>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : referrals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {referrals.map(ref => (
                    <ReferralCard
                      key={ref.id}
                      referral={ref}
                      ambassadorTier="bronze" // Deprecated but kept for prop compatibility
                      onViewDetailsClick={handleViewDetailsClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Referrals Yet</h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                    Start referring businesses to secure your discount and grow your network.
                  </p>
                  <button
                    onClick={() => setIsReferralFormOpen(true)}
                    className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    Refer a Business
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Floating Action Button for Referral */}
          <div className="absolute bottom-6 right-6 z-20">
            <motion.button
              onClick={() => setIsReferralFormOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300"
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Refer Business
            </motion.button>
          </div>

          {/* Referral Form Overlay */}
          <AnimatePresence>
            {isReferralFormOpen && (
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-30 bg-white dark:bg-slate-900"
              >
                <ReferBusinessForm
                  storeId={storeId}
                  onReferralAdded={onReferralAdded}
                  onClose={() => setIsReferralFormOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
