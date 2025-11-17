'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ServerCrash, Gift, User, Calendar } from 'lucide-react';
import { getCommissionAnalytics } from '@/app/actions/commissionActions';
import { Naira } from '@/components/common/Naira';

// --- PROPS & DATA INTERFACES ---
interface CommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

interface CommissionEvent {
  orderId: string;
  customerName: string;
  commissionAmount: number;
  date: string;
}

interface CommissionAnalyticsData {
  totalCommission: number;
  commissionHistory: CommissionEvent[];
}

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return '₦0';
    return `₦${amount.toLocaleString()}`;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

// --- MAIN COMPONENT ---

export default function CommissionModal({ isOpen, onClose, storeId }: CommissionModalProps) {
  const [data, setData] = useState<CommissionAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && storeId) {
      document.body.style.overflow = 'hidden';
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const analyticsData = await getCommissionAnalytics(storeId);
          setData(analyticsData);
        } catch (err) {
          console.error("Error fetching commission analytics:", err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, storeId]);

  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          initial="hidden" animate="visible" exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* --- Header --- */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <Gift size={28} className="text-purple-500" /> Commission Analytics
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex flex-col items-center justify-center h-full min-h-[400px]">
                <ServerCrash className="w-10 h-10 text-red-500 mb-4" />
                <p className="font-semibold text-red-700 dark:text-red-300">Could Not Load Analytics</p>
                <p className="text-sm text-red-600 dark:text-red-400/80 text-center mt-1">{error}</p>
              </div>
            ) : data ? (
              <div>
                {/* === Total Commission KPI === */}
                <div className="bg-purple-50 dark:bg-gradient-to-br dark:from-purple-600 dark:via-violet-700 dark:to-indigo-900 p-6 sm:p-8 rounded-2xl shadow-lg mb-8 text-center">
                    <p className="text-lg text-purple-800 dark:text-purple-200">Total Commission Earned</p>
                    <p className="text-5xl sm:text-6xl font-bold flex items-center justify-center text-slate-900 dark:text-white"><Naira/>{data.totalCommission.toLocaleString()}</p>
                </div>

                {/* === Commission History === */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        Recent Commission Events
                    </h3>
                    {data.commissionHistory.length > 0 ? (
                        <div className="space-y-3">
                            {data.commissionHistory.map((event) => (
                                <div key={event.orderId} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                                            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{event.customerName}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Order ID: {event.orderId.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-lg text-green-700 dark:text-green-400">+{formatCurrency(event.commissionAmount)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1"><Calendar size={12}/> {formatDate(event.date)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-slate-600 dark:text-slate-400">No commission has been earned from completed deliveries yet.</p>
                        </div>
                    )}
                </div>
              </div>
            ) : null}
          </main>

          {/* --- Footer --- */}
          <footer className="flex-shrink-0 w-full max-w-5xl mx-auto p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800">
             <button 
                type="button" 
                className="w-full rounded-lg bg-slate-200 dark:bg-slate-700 px-4 py-3 text-base font-semibold text-slate-800 dark:text-white shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                onClick={onClose}
              >
                Close
              </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
