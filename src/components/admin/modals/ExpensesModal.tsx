'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpensesModal({ isOpen, onClose }: ExpensesModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
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

  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-[var(--modal-background)] p-4 sm:p-6"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          <header className="flex items-center justify-between w-full max-w-7xl mx-auto mb-4">
            <h2 className="text-2xl font-bold text-white">Expenses</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </header>
          <main className="flex-grow flex items-center justify-center w-full max-w-7xl mx-auto">
            <p className="text-white/70">Expenses modal content is coming soon.</p>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
