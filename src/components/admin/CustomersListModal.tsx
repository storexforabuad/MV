'use client';

import { useEffect, useState } from 'react';
import { fetchStoreCustomers, StoreCustomer } from '@/app/actions/customerActions';
import { CustomerDetailCard, CustomerDetailCardSkeleton } from './CustomerDetailCard';
import { Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface CustomersListModalProps {
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomersListModal: React.FC<CustomersListModalProps> = ({ storeId, isOpen, onClose }) => {
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadCustomers = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const fetchedCustomers = await fetchStoreCustomers(storeId);
          setCustomers(fetchedCustomers);
        } catch (err) {
          console.error("Failed to fetch store customers:", err);
          setError("Couldn't load customers. Please try again.");
        }
        finally {
          setIsLoading(false);
        }
      };
      loadCustomers();
    }
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
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Customers ({customers.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your store customers</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {isLoading && (
              <div className="space-y-4">
                <CustomerDetailCardSkeleton />
                <CustomerDetailCardSkeleton />
                <CustomerDetailCardSkeleton />
              </div>
            )}

            {!isLoading && error && (
              <div className="flex flex-col items-center justify-center h-full text-center text-red-500">
                <p>{error}</p>
              </div>
            )}

            {!isLoading && !error && customers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                <Users className="w-16 h-16 mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold">No Customers Yet</h3>
                <p className="max-w-xs mt-2">When a customer places their first order, they will appear here.</p>
              </div>
            )}

            {!isLoading && !error && customers.length > 0 && (
              <div className="space-y-4">
                {customers.map(customer => (
                  <CustomerDetailCard key={customer.id} customer={customer} />
                ))}
              </div>
            )}
          </main>

          {/* --- Footer --- */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
