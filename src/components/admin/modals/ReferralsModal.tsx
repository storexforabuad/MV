'use client';
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { Gift, X, Loader2, ServerCrash } from 'lucide-react';

interface ReferralsModalProps {
  storeId: string;
  handleClose: () => void;
  onReferralAdded: () => void;
}

interface Referral {
  id: string;
  businessName: string;
  businessNumber: string;
  createdAt: { seconds: number; nanoseconds: number; };
}

const ReferralsModal: React.FC<ReferralsModalProps> = ({ storeId, handleClose, onReferralAdded }) => {
  const [businessName, setBusinessName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [submittedReferrals, setSubmittedReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferrals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stores/${storeId}/referrals`);
      if (!response.ok) throw new Error('Failed to fetch referrals');
      const data: Referral[] = await response.json();
      console.log('Fetched referrals data:', data);
      setSubmittedReferrals(data.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !businessNumber.trim()) {
      setError('Business name and number are required.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

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
      onReferralAdded(); // Trigger refresh on the parent page
      await fetchReferrals(); // Refresh the list in the modal

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 relative">
        <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-slate-800 rounded-full p-1.5 transition-colors"
            aria-label="Close"
        >
            <X className="w-5 h-5" />
        </button>
        <div className="w-full flex flex-col items-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 mb-4 border border-orange-500/20">
                <Gift className="w-7 h-7 text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Refer a Business</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Submit business contacts to earn rewards.</p>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                    <label htmlFor="businessName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label>
                    <input
                        id="businessName"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g., John's Bakery"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label htmlFor="businessNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Number</label>
                    <input
                        id="businessNumber"
                        type="text"
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value)}
                        placeholder="e.g., 555-123-4567"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        disabled={isSubmitting}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center px-4 py-2.5 rounded-lg bg-orange-500 text-white font-semibold transition-all duration-200 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    {isSubmitting ? 'Submitting...' : 'Submit Referral'}
                </button>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </form>

            {/* Submitted List Section */}
            <div className="w-full mt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Your Referrals ({submittedReferrals.length})</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                        </div>
                    ) : error && submittedReferrals.length === 0 ? (
                        <div className="text-center p-4 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                             <ServerCrash className="mx-auto h-8 w-8 text-red-500 mb-2" />
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Could not load referrals.</p>
                            <p className="text-xs text-red-500 dark:text-red-400/80">Please try again later.</p>
                        </div>
                    ) : submittedReferrals.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">You haven&apos;t referred any businesses yet.</p>
                    ) : (
                        submittedReferrals.map(ref => (
                            <div key={ref.id} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg flex justify-between items-center border border-gray-200 dark:border-slate-700">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{ref.businessName}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{ref.businessNumber}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ReferralsModal;
