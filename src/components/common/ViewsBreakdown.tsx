
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
}

interface StoreMeta {
  name: string;
  totalViews?: number;
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
          return existingDay || { date: dateStr, views: 0 };
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

  const totalViewsLast7Days = dailyMetrics.reduce((acc, curr) => {
    const views = typeof curr.views === 'number' && !isNaN(curr.views) ? curr.views : 0;
    return acc + views;
  }, 0);
  const bestDay = [...dailyMetrics].sort((a, b) => b.views - a.views)[0];

  return (
    <div className="p-1 sm:p-2">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg">
          <p className="text-sm text-slate-500 dark:text-slate-400">Views (Last 7 Days)</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalViewsLast7Days || 0}</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg">
          <p className="text-sm text-slate-500 dark:text-slate-400">All-Time Views</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{storeMeta?.totalViews ?? 0}</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg col-span-2 sm:col-span-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">Best Day (Last 7 Days)</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{bestDay?.views ?? 0} views</p>
          {bestDay && <p className="text-xs text-slate-400">{new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>}
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Daily Traffic Breakdown
        </h3>
        <div className="h-60 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyMetrics} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  borderColor: '#334155',
                  color: '#f1f5f9'
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              />
              <Bar dataKey="views" fill="#3b82f6" name="Product Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products List */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Top Products (Last 7 Days)</h3>
        {popularProducts.length > 0 ? (
          <ul className="space-y-2">
            {popularProducts.map((product, index) => (
              <li key={product.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-400 w-4">{index + 1}.</span>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{product.name}</p>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{product.views}</span>
                </div>
              </li>
            ))}
          </ul>
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
