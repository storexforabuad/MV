'use client';
import { useState, FC } from 'react';
import { X, Loader2 } from 'lucide-react';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: {
    id: string;
    businessName: string;
    storeId: string; // This is the referrerStoreId
  };
  onActivationSuccess: () => void;
}

export const ActivationModal: FC<ActivationModalProps> = ({ isOpen, onClose, referral, onActivationSuccess }) => {
  const [newRefereeStoreId, setNewRefereeStoreId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefereeStoreId.trim()) {
      setError('The new store ID is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/dev/activate-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerStoreId: referral.storeId,
          referralId: referral.id,
          newRefereeStoreId: newRefereeStoreId.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate referral.');
      }

      // Success
      onActivationSuccess();
      setNewRefereeStoreId(''); // Reset for next time
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8" 
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Activate Referral</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Activate the referral for <span className="font-semibold text-slate-600 dark:text-slate-300">{referral.businessName}</span>.</p>
        
        <form onSubmit={handleSubmit} className="mt-6">
          <div>
            <label htmlFor="newRefereeStoreId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              New Referee Store ID
            </label>
            <input
              id="newRefereeStoreId"
              type="text"
              value={newRefereeStoreId}
              onChange={(e) => setNewRefereeStoreId(e.target.value)}
              placeholder="e.g., johns-bakery-ng"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition"
              disabled={isSubmitting}
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center px-6 py-3 rounded-lg bg-orange-500 text-white font-bold text-base transition-all duration-200 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} 
              {isSubmitting ? 'Activating...' : 'Confirm & Activate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
