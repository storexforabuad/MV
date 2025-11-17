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

  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  const grandTotal = (totalCommission || 0) + (totalExpenses || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white"
          initial="hidden" animate="visible" exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* --- Header --- */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-800">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <TrendingDown size={28} className="text-red-500" /> Expenses Breakdown
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6">
            <div className="space-y-4">

              {/* Bizcon Commission Expense */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-red-900/50 p-2 rounded-full">
                    <Percent className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">Bizcon™ Network Commission</p>
                    <p className="text-sm text-slate-400">Platform, maintenance, and network fees</p>
                  </div>
                </div>
                <p className="font-semibold text-lg text-red-400 flex items-center"><Naira />{formatCurrency(totalCommission)}</p>
              </div>

              {/* Other Expenses */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-red-900/50 p-2 rounded-full">
                     <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">Other Expenses</p>
                    <p className="text-sm text-slate-400">Manually tracked operational costs</p>
                  </div>
                </div>
                 <p className="font-semibold text-lg text-red-400 flex items-center"><Naira />{formatCurrency(totalExpenses)}</p>
              </div>

            </div>

            {/* --- Grand Total --- */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center">
                <p className="text-lg font-bold text-slate-200">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400 flex items-center"><Naira />{formatCurrency(grandTotal)}</p>
            </div>

          </main>

          {/* --- Footer --- */}
          <footer className="flex-shrink-0 w-full max-w-5xl mx-auto p-4 sm:p-6 border-t border-slate-800">
             <button 
                type="button" 
                className="w-full rounded-lg bg-slate-700 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-950"
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
