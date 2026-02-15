'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, TooltipProps
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Loader2, ServerCrash, TrendingUp, CircleDollarSign, Calendar, Star, Trophy, ShoppingCart, FileText } from 'lucide-react';
import { getRevenueAnalytics } from '@/app/actions/orderActions';
import { Naira } from '@/components/common/Naira';
import { getDoc, doc, collection, query, where, getDocs, getFirestore, Timestamp } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';

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

interface WholesaleCustomer {
  customerId: string;
  customerName: string;
  orderCount: number;
  totalRevenue: number;
  lastOrderDate: Date;
}

interface WholesaleInvoiceData {
  invoiceNumber: string;
  date: Timestamp;
  amount: number;
  status: 'pending' | 'settled' | 'overdue';
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

// --- TAB COMPONENTS ---

const RetailTab = ({ data }: { data: RevenueData }) => {
  const totalRevenueLast7Days = (data.historicalData || []).reduce((sum: number, day: any) => sum + (day.totalRevenue || 0) + (day.totalBonus || 0), 0);
  const averageDailyRevenue = data.historicalData?.length ? totalRevenueLast7Days / data.historicalData.length : 0;
  const bestDay = [...(data.historicalData || [])].sort((a: any, b: any) => (b.totalRevenue || 0) + (b.totalBonus || 0) - (a.totalRevenue || 0) - (a.totalBonus || 0))[0];

  const CustomRetailTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType> & { payload?: any[], label?: any }) => {
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

  return (
    <div>
      {/* === KPIs Start === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-green-50 dark:bg-gradient-to-br dark:from-green-600 dark:via-emerald-700 dark:to-teal-900 p-4 sm:p-6 rounded-2xl shadow-md">
          <p className="text-sm text-green-800 dark:text-green-200">Revenue (Last 7 Days)</p>
          <p className="text-3xl sm:text-4xl font-bold flex items-center text-slate-900 dark:text-white mt-2"><Naira />{totalRevenueLast7Days.toLocaleString()}</p>
        </div>
        <div className="bg-slate-100 dark:bg-gradient-to-br dark:from-slate-700 dark:via-gray-800 dark:to-zinc-900 p-4 sm:p-6 rounded-2xl shadow-md">
          <p className="text-sm text-slate-600 dark:text-slate-300">All-Time Gross Revenue</p>
          <div className="flex flex-col">
            <p className="text-3xl sm:text-4xl font-bold flex items-center text-slate-900 dark:text-white mt-2">
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
              <Tooltip content={<CustomRetailTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
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
            {data.topEarningProducts.map((product: TopProduct, index: number) => (
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
  );
};

const WholesaleTab = ({ wholesaleData }: { wholesaleData: any }) => {
  const CustomWholesaleTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType> & { payload?: any[], label?: any }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const fullDate = date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
      const revenue = payload[0]?.value || 0;

      return (
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{fullDate}</p>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(revenue)}</p>
        </div>
      );
    }
    return null;
  };

  const stats = wholesaleData.stats || {};
  const topCustomers = wholesaleData.topCustomers || [];
  const recentInvoices = wholesaleData.recentInvoices || [];
  const chartData = wholesaleData.chartData || [];

  return (
    <div>
      {/* === Wholesale KPIs Start === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-blue-50 dark:bg-gradient-to-br dark:from-blue-600 dark:via-cyan-700 dark:to-teal-900 p-4 sm:p-6 rounded-2xl shadow-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">Total Wholesale Revenue</p>
          <p className="text-2xl sm:text-3xl font-bold flex items-center text-slate-900 dark:text-white mt-2"><Naira />{(stats.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 dark:bg-gradient-to-br dark:from-purple-600 dark:via-violet-700 dark:to-indigo-900 p-4 sm:p-6 rounded-2xl shadow-md">
          <p className="text-sm text-purple-800 dark:text-purple-200">Active Wholesale Customers</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.activeCustomers || 0}</p>
        </div>
        <div className="bg-orange-50 dark:bg-gradient-to-br dark:from-orange-600 dark:via-amber-700 dark:to-yellow-900 p-4 sm:p-6 rounded-2xl shadow-md">
          <p className="text-sm text-orange-800 dark:text-orange-200">Orders This Month</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.ordersThisMonth || 0}</p>
        </div>
        <div className="bg-pink-50 dark:bg-gradient-to-br dark:from-pink-600 dark:via-rose-700 dark:to-red-900 p-4 sm:p-6 rounded-2xl shadow-md">
          <p className="text-sm text-pink-800 dark:text-pink-200">Avg. Order Value</p>
          <p className="text-2xl sm:text-3xl font-bold flex items-center text-slate-900 dark:text-white mt-2"><Naira />{(stats.averageOrderValue || 0).toLocaleString()}</p>
        </div>
      </div>
      {/* === Wholesale KPIs End === */}

      {/* === Wholesale 7-Day Chart Start === */}
      {chartData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> 7-Day Wholesale Revenue
          </h3>
          <div className="h-64 sm:h-72 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWholesaleRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} />
                <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `₦${Number(val) / 1000}k`} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomWholesaleTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
                <Bar dataKey="revenue" fill="url(#colorWholesaleRevenue)" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {/* === Wholesale 7-Day Chart End === */}

      {/* === Top Wholesale Customers Start === */}
      {topCustomers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Top 10 Wholesale Customers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-400">#</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-400">Customer</th>
                  <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-400">Orders</th>
                  <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-400">Total Revenue</th>
                  <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-400">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer: WholesaleCustomer, index: number) => (
                  <tr key={customer.customerId} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{index + 1}</td>
                    <td className="p-3 text-slate-900 dark:text-white font-medium">{customer.customerName}</td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">{customer.orderCount}</td>
                    <td className="p-3 text-right font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(customer.totalRevenue)}</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                      {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* === Top Wholesale Customers End === */}

      {/* === Recent Wholesale Invoices Start === */}
      {recentInvoices.length > 0 && (
        <div className="pb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-slate-600 dark:text-slate-400" /> Recent Invoices
          </h3>
          <div className="space-y-2">
            {recentInvoices.map((invoice: WholesaleInvoiceData, idx: number) => (
              <div key={idx} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(invoice.date.toDate?.() || invoice.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(invoice.amount)}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'settled' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    invoice.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* === Recent Wholesale Invoices End === */}
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function RevenueModal({ isOpen, onClose, storeId }: RevenueModalProps) {
  const [activeTab, setActiveTab] = useState<'retail' | 'wholesale'>('retail');
  const [data, setData] = useState<RevenueData | null>(null);
  const [wholesaleData, setWholesaleData] = useState<{
    stats: any;
    topCustomers: WholesaleCustomer[];
    recentInvoices: WholesaleInvoiceData[];
    chartData: { date: string; revenue: number }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(firebaseApp);

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
          // Fetch retail analytics
          const analyticsData = await getRevenueAnalytics(storeId);
          setData(analyticsData as RevenueData);

          // Fetch wholesale data
          const storeRef = doc(db, 'stores', storeId);
          const storeSnap = await getDoc(storeRef);
          const store = storeSnap.data();

          if (store?.wholesaleStats) {
            // Fetch recent invoices (last 30 days)
            const invoicesRef = collection(db, 'wholesaleInvoices');
            const invoicesQuery = query(
              invoicesRef,
              where('sellerStoreId', '==', storeId)
            );
            const invoicesSnap = await getDocs(invoicesQuery);
            
            const recentInvoices: WholesaleInvoiceData[] = invoicesSnap.docs
              .map((doc) => ({
                invoiceNumber: doc.data().invoiceNumber,
                date: doc.data().createdAt,
                amount: doc.data().total,
                status: doc.data().status,
              }))
              .slice(0, 10);

            // Fetch top wholesale customers
            const transactionsRef = collection(db, 'wholesaleTransactions');
            const transactionsQuery = query(
              transactionsRef,
              where('sellerStoreId', '==', storeId)
            );
            const transactionsSnap = await getDocs(transactionsQuery);
            
            const customerMap = new Map<string, {
              name: string;
              orders: number;
              revenue: number;
              lastDate: Timestamp;
            }>();

            for (const docSnap of transactionsSnap.docs) {
              const trans = docSnap.data();
              const buyerId = trans.buyerStoreId;
              if (!customerMap.has(buyerId)) {
                // Fetch buyer store name
                const buyerSnap = await getDoc(doc(db, 'stores', buyerId));
                const buyerName = buyerSnap.data()?.name || 'Unknown';
                customerMap.set(buyerId, {
                  name: buyerName,
                  orders: 0,
                  revenue: 0,
                  lastDate: trans.createdAt,
                });
              }
              const customer = customerMap.get(buyerId)!;
              customer.orders += 1;
              customer.revenue += trans.amountInKobo / 100;
              if (trans.createdAt > customer.lastDate) {
                customer.lastDate = trans.createdAt;
              }
            }

            const topCustomers: WholesaleCustomer[] = Array.from(customerMap.entries())
              .map(([id, data]) => ({
                customerId: id,
                customerName: data.name,
                orderCount: data.orders,
                totalRevenue: data.revenue,
                lastOrderDate: data.lastDate.toDate(),
              }))
              .sort((a, b) => b.totalRevenue - a.totalRevenue)
              .slice(0, 10);

            // Generate 7-day chart data
            const chartData: { date: string; revenue: number }[] = [];
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              chartData.push({ date: dateStr, revenue: 0 });
            }

            // Sum revenues by date
            transactionsSnap.docs.forEach((doc) => {
              const date = doc.data().createdAt.toDate();
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const entry = chartData.find((d) => d.date === dateStr);
              if (entry) {
                entry.revenue += doc.data().amountInKobo / 100;
              }
            });

            setWholesaleData({
              stats: store.wholesaleStats,
              topCustomers,
              recentInvoices,
              chartData,
            });
          }
        } catch (err) {
          console.error("Error fetching analytics:", err);
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
  }, [isOpen, onClose, storeId, db]);

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
          <header className="flex-shrink-0 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between py-4 sm:py-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Revenue Analytics
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Track your earnings</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CircleDollarSign className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 sm:gap-4 py-4">
                <button
                  onClick={() => setActiveTab('retail')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'retail'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Retail Sales
                </button>
                <button
                  onClick={() => setActiveTab('wholesale')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'wholesale'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-2" />
                  Wholesale Sales
                </button>
              </div>
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
            ) : activeTab === 'retail' && data ? (
              <RetailTab data={data} />
            ) : activeTab === 'wholesale' && wholesaleData ? (
              <WholesaleTab wholesaleData={wholesaleData} />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-slate-600 dark:text-slate-400">No data available</p>
              </div>
            )}
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
