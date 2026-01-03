'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/db';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Loader2 } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  handleClose: () => void;
  storeId: string;
}

export default function AccountModal({ isOpen, handleClose, storeId }: AccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    if (!storeId || !isOpen) return;
    let mounted = true;
    (async () => {
      try {
        const ref = doc(db, 'stores', storeId);
        const snap = await getDoc(ref);
        if (snap.exists() && mounted) {
          const data = snap.data() as any;
          setBankAccountName(data.bankAccountName || '');
          setBankAccountNumber(data.bankAccountNumber || '');
          setBankName(data.bankName || '');
        }
      } catch (err) {
        console.error('Failed to load account info', err);
      }
    })();
    return () => { mounted = false; };
  }, [storeId, isOpen]);

  const handleSave = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const ref = doc(db, 'stores', storeId);
      await updateDoc(ref, {
        bankAccountName: bankAccountName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankName: bankName || null,
      });
      toast.success('Account details saved');
      handleClose();
    } catch (err) {
      console.error('Failed to save account details', err);
      toast.error('Failed to save account details');
    } finally {
      setLoading(false);
    }
  };

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
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Account Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your payout information</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            <div className="max-w-md mx-auto space-y-6 py-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  Please provide accurate bank details to ensure smooth and timely payouts for your sales.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Name</label>
                  <input
                    value={bankAccountName}
                    onChange={e => setBankAccountName(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Number</label>
                  <input
                    value={bankAccountNumber}
                    onChange={e => setBankAccountNumber(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. 0123456789"
                    type="text"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bank Name</label>
                  <input
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. First Bank"
                  />
                </div>
              </div>
            </div>
          </main>

          {/* --- Footer --- */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-6 rounded-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-[2] bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
