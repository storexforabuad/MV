
"use client";

import { FC, useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, getPopularProducts, getStoreMeta } from '@/lib/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, Loader2, ServerCrash, TrendingUp } from 'lucide-react';
import { Product } from '@/types/product';

interface ViewsBreakdownProps {
  storeId: string;
}

interface DailyMetric {
  date: string;
  views: number;
  storePageViews?: number;
}

interface StoreMeta {
  name: string;
  totalViews?: number;
  storePageViews?: number;
}

const ViewsBreakdown: FC<ViewsBreakdownProps> = ({ storeId }) => {
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch daily metrics
        const metricsRef = collection(db, 'stores', storeId, 'dailyMetrics');
        const q = query(metricsRef, orderBy('date', 'desc',), limit(7));
        const metricsSnap = await getDocs(q);
        const last7DaysData = metricsSnap.docs.map(doc => doc.data() as DailyMetric).reverse();

        // Fill in missing days
        const filledData = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const existingDay = last7DaysData.find(m => m.date === dateStr);
          return existingDay || { date: dateStr, views: 0, storePageViews: 0 };
        }).reverse();

        setDailyMetrics(filledData);

        // Fetch other data
        const [products, meta] = await Promise.all([
          getPopularProducts(storeId, 5),
          getStoreMeta(storeId),
        ]);

        setPopularProducts(products);
        setStoreMeta(meta as StoreMeta);

      } catch (err) {
        console.error("Error fetching store breakdown data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId) {
      fetchData();
    }
  }, [storeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-50 dark:bg-slate-900/50 rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex flex-col items-center justify-center min-h-[400px]">
        <ServerCrash className="w-10 h-10 text-red-500 mb-4" />
        <p className="font-semibold text-red-700 dark:text-red-300">Could Not Load Analytics</p>
        <p className="text-sm text-red-500 dark:text-red-400/80 text-center mt-1">{error}</p>
      </div>
    );
  }

  const totalProductViews7d = dailyMetrics.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0);
  const totalStoreVisits7d = dailyMetrics.reduce((acc, curr) => acc + (Number(curr.storePageViews) || 0), 0);

  const bestDay = [...dailyMetrics].sort((a, b) => ((Number(b.views) || 0) + (Number(b.storePageViews) || 0)) - ((Number(a.views) || 0) + (Number(a.storePageViews) || 0)))[0];

  return (
    <div className="p-1 sm:p-2">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-center">
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1">Product Interacts (7d)</p>
          <p className="text-3xl font-black text-sky-500">{totalProductViews7d}</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1">Store Visits (7d)</p>
          <p className="text-3xl font-black text-amber-500">{totalStoreVisits7d}</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1">Product (All-Time)</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{storeMeta?.totalViews ?? 0}</p>
          <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 italic">Counts taps & carousels</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1">Store (All-Time)</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{storeMeta?.storePageViews ?? 0}</p>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" /> Daily Traffic Comparison
          </h3>
          <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-sky-500" /> <span className="text-slate-500">Products</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500" /> <span className="text-slate-500">Storefront</span></div>
          </div>
        </div>
        <div className="h-64 sm:h-80 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyMetrics} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { weekday: 'short' })}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: '#f1f5f9',
                  padding: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                itemStyle={{ fontSize: 12, fontWeight: 700, padding: '2px 0' }}
                labelStyle={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              />
              <Bar dataKey="views" fill="#0ea5e9" name="Product Interacts" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="storePageViews" fill="#f59e0b" name="Store Visits" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products List */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Top Performing Products</h3>
        {popularProducts.length > 0 ? (
          <div className="space-y-3">
            {popularProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:scale-[1.01]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs font-black text-slate-400 group-hover:text-sky-500">
                    {index + 1}
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{product.name}</p>
                </div>
                <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 px-3 py-1.5 rounded-full ring-1 ring-sky-100 dark:ring-sky-900/50">
                  <Eye className="w-4 h-4 text-sky-500" />
                  <span className="font-black text-sky-600 dark:text-sky-400 text-sm">{product.views}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">No product view data available yet.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ViewsBreakdown;
