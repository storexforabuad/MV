'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, TooltipProps
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Loader2, ServerCrash, TrendingUp, CircleDollarSign, Calendar, Star, Trophy } from 'lucide-react';
import { getRevenueAnalytics } from '@/app/actions/orderActions';
import { Naira } from '@/components/common/Naira';

// --- PROPS & DATA INTERFACES ---
interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

interface TopProduct {
  id: string;
  name: string;
  totalRevenue: number;
}

interface RevenueData {
  lifetimeRevenue: number;
  lifetimeBonus: number;
  historicalData: { date: string; totalRevenue: number; totalBonus: number }[];
  topEarningProducts: TopProduct[];
}

// --- HELPER & CUSTOM COMPONENTS ---

const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number') return '₦0';
  return `₦${amount.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType> & { payload?: any[], label?: any }) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const fullDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const revenue = payload.find(p => p.dataKey === 'totalRevenue')?.value || 0;
    const bonus = payload.find(p => p.dataKey === 'totalBonus')?.value || 0;
    const total = revenue + bonus;

    return (
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg min-w-[150px]">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{dayName}, {fullDate}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Sales:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(revenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Bonus:</span>
            <span className="font-semibold text-amber-500 dark:text-amber-400">{formatCurrency(bonus)}</span>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-1 mt-1 flex justify-between text-sm font-bold">
            <span className="text-slate-700 dark:text-slate-200">Total:</span>
            <span className="text-slate-900 dark:text-white">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- MAIN COMPONENT ---

export default function RevenueModal({ isOpen, onClose, storeId }: RevenueModalProps) {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING ---
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
          setData(analyticsData as RevenueData);
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

  // --- DERIVED STATE & CALCULATIONS ---
  const { totalRevenueLast7Days, averageDailyRevenue, bestDay } = useMemo(() => {
    if (!data?.historicalData) return { totalRevenueLast7Days: 0, averageDailyRevenue: 0, bestDay: null };

    // Calculate totals including bonus
    const total = data.historicalData.reduce((acc, curr) => acc + curr.totalRevenue + curr.totalBonus, 0);
    const average = total / (data.historicalData.length || 1);

    // Find best day based on total (revenue + bonus)
    const best = data.historicalData.reduce((max, day) => {
      const dayTotal = day.totalRevenue + day.totalBonus;
      const maxTotal = (max.totalRevenue || 0) + (max.totalBonus || 0);
      return dayTotal > maxTotal ? day : max;
    }, data.historicalData[0] || { totalRevenue: 0, totalBonus: 0 });

    return { totalRevenueLast7Days: total, averageDailyRevenue: average, bestDay: best };
  }, [data]);

  // --- RENDER LOGIC ---
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
                Revenue Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track your earnings</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <CircleDollarSign className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[600px]">
                <Loader2 className="w-10 h-10 animate-spin text-green-500" />
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex flex-col items-center justify-center h-full min-h-[600px]">
                <ServerCrash className="w-10 h-10 text-red-500 mb-4" />
                <p className="font-semibold text-red-700 dark:text-red-300">Could Not Load Analytics</p>
                <p className="text-sm text-red-600 dark:text-red-400/80 text-center mt-1">{error}</p>
              </div>
            ) : data ? (
              <div>
                {/* === KPIs Start === */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="bg-green-50 dark:bg-gradient-to-br dark:from-green-600 dark:via-emerald-700 dark:to-teal-900 p-4 sm:p-6 rounded-2xl shadow-md">
                    <p className="text-sm text-green-800 dark:text-green-200">Revenue (Last 7 Days)</p>
                    <p className="text-3xl sm:text-4xl font-bold flex items-center text-slate-900 dark:text-white"><Naira />{totalRevenueLast7Days.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-gradient-to-br dark:from-slate-700 dark:via-gray-800 dark:to-zinc-900 p-4 sm:p-6 rounded-2xl shadow-md">
                    <p className="text-sm text-slate-600 dark:text-slate-300">All-Time Gross Revenue</p>
                    <div className="flex flex-col">
                      <p className="text-3xl sm:text-4xl font-bold flex items-center text-slate-900 dark:text-white">
                        <Naira />{(data.lifetimeRevenue + data.lifetimeBonus).toLocaleString()}
                      </p>
                      {data.lifetimeBonus > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                          Includes <Naira />{data.lifetimeBonus.toLocaleString()} Bonus
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full"><Star className="w-6 h-6 text-yellow-500 dark:text-yellow-400" /></div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Best Day (Last 7 Days)</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency((bestDay?.totalRevenue || 0) + (bestDay?.totalBonus || 0))}</p>
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full"><TrendingUp className="w-6 h-6 text-blue-500 dark:text-blue-400" /></div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Daily Revenue</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(Math.round(averageDailyRevenue))}</p>
                    </div>
                  </div>
                </div>
                {/* === KPIs End === */}

                {/* === 7-Day Chart Start === */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Daily Revenue Breakdown
                  </h3>
                  <div className="h-64 sm:h-72 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorBonus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} />
                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => `₦${Number(val) / 1000}k`} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
                        <ReferenceLine y={averageDailyRevenue} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1.5} />
                        <Bar dataKey="totalRevenue" stackId="a" fill="url(#colorRevenue)" name="Sales" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="totalBonus" stackId="a" fill="url(#colorBonus)" name="Bonus" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* === 7-Day Chart End === */}

                {/* === Top Products Start === */}
                {data.topEarningProducts && data.topEarningProducts.length > 0 && (
                  <div className="pb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Top Earning Products
                    </h3>
                    <div className="space-y-3">
                      {data.topEarningProducts.map((product, index) => (
                        <div key={product.id} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg flex justify-between items-center text-sm">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-500 w-4">{index + 1}.</span>
                            <p className="text-slate-800 dark:text-slate-100 font-medium truncate">{product.name}</p>
                          </div>
                          <p className="font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">{formatCurrency(product.totalRevenue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* === Top Products End === */}
              </div>
            ) : null}
          </main>

          {/* --- Footer --- */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-900 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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
}
