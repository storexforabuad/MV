'use client';

import { X, Percent, TrendingDown } from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Naira } from '@/components/common/Naira';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCommission: number;
  totalExpenses: number;
}

const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number') return '₦0.00';
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ExpensesModal({ isOpen, onClose, totalCommission, totalExpenses }: ExpensesModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const modalVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } };
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };

  const grandTotal = (totalCommission || 0) + (totalExpenses || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial="hidden" animate="visible" exit="exit"
            variants={backdropVariants}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            initial="hidden" animate="visible" exit="exit"
            variants={modalVariants}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* --- Header --- */}
            <header className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-500" />
                </div>
                Expenses Breakdown
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </header>

            {/* --- Main Scrollable Content --- */}
            <main className="flex-grow overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-slate-950/50">

              {/* Bizcon Commission Expense */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                      <Percent className="w-5 h-5 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">Bizcon™ Commission</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Platform & network fees</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <p className="font-bold text-lg text-red-600 dark:text-red-400 flex items-center">
                    <span className="text-sm font-normal text-slate-400 mr-1">-</span>
                    <Naira />{formatCurrency(totalCommission)}
                  </p>
                </div>
              </div>

              {/* Other Expenses */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">Other Expenses</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Operational costs</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <p className="font-bold text-lg text-red-600 dark:text-red-400 flex items-center">
                    <span className="text-sm font-normal text-slate-400 mr-1">-</span>
                    <Naira />{formatCurrency(totalExpenses)}
                  </p>
                </div>
              </div>

            </main>

            {/* --- Footer / Grand Total --- */}
            <footer className="p-5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex justify-between items-center mb-4">
                <p className="text-base font-medium text-slate-600 dark:text-slate-400">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                  <Naira />{formatCurrency(grandTotal)}
                </p>
              </div>
              <button
                type="button"
                className="w-full rounded-xl bg-slate-900 dark:bg-slate-800 text-white py-3.5 font-semibold shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                onClick={onClose}
              >
                Close
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
