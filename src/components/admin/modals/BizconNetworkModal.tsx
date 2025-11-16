'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface BizconNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BizconNetworkModal = ({ isOpen, onClose }: BizconNetworkModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900"
        >
          <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">(Biz+Con)™ Network</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </button>
          </header>
          <main className="flex-grow p-4 overflow-y-auto">
            {/* Content will go here */}
            <div className="text-center text-slate-500">
              <p>Bizcon Network modal content is coming soon.</p>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
