'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { X, Loader2, ServerCrash, TrendingUp, CircleDollarSign } from 'lucide-react';
import { getRevenueAnalytics } from '@/app/actions/orderActions';
import { Naira } from '@/components/common/Naira';

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

interface RevenueData {
  lifetimeRevenue: number;
  historicalData: { date: string; totalRevenue: number }[];
}

export default function RevenueModal({ isOpen, onClose, storeId }: RevenueModalProps) {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      const fetchData = async () => {
        if (!storeId) {
          setError("Store ID is missing.");
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        setError(null);
        try {
          const analyticsData = await getRevenueAnalytics(storeId);
          setData(analyticsData);
        } catch (err) {
          console.error("Error fetching revenue analytics:", err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, storeId]);

  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
  };

  const totalRevenueLast7Days = data?.historicalData.reduce((acc, curr) => acc + curr.totalRevenue, 0) || 0;

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
          <header className="flex items-center justify-between w-full max-w-4xl mx-auto mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CircleDollarSign size={24} className="text-green-400" /> Revenue Analytics
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </header>
          <main className="flex-grow w-full max-w-4xl mx-auto overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-green-400" />
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex flex-col items-center justify-center h-full">
                <ServerCrash className="w-10 h-10 text-red-500 mb-4" />
                <p className="font-semibold text-red-700 dark:text-red-300">Could Not Load Analytics</p>
                <p className="text-sm text-red-500 dark:text-red-400/80 text-center mt-1">{error}</p>
              </div>
            ) : data ? (
              <div className="p-1 sm:p-2">
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-center">
                  <div className="bg-slate-800/60 p-6 rounded-lg">
                    <p className="text-sm text-slate-400">Revenue (Last 7 Days)</p>
                    <p className="text-4xl font-bold text-slate-100 flex items-center justify-center"><Naira />{totalRevenueLast7Days.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/60 p-6 rounded-lg">
                    <p className="text-sm text-slate-400">All-Time Gross Revenue</p>
                    <p className="text-4xl font-bold text-slate-100 flex items-center justify-center"><Naira />{data.lifetimeRevenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* 7-Day Chart */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Daily Revenue Breakdown
                  </h3>
                  <div className="h-72 bg-slate-900/50 p-2 rounded-lg">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                        <YAxis tickFormatter={(val) => `₦${val / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#334155', color: '#f1f5f9' }}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          formatter={(value: number) => [value.toLocaleString(), 'Revenue']}
                        />
                        <Bar dataKey="totalRevenue" fill="#34d399" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
