'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Store,
    Users,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
    Crown,
    Eye,
    Package,
    ExternalLink,
    Filter,
    Gift,
    Coins
} from 'lucide-react';
import Link from 'next/link';
import { getStores, getProducts, getPopularProducts } from '@/lib/db';
import { StoreMeta } from '@/types/store';
import type { SubscriptionStatus } from '@/types/subscription';

interface StoreStats {
    id: string;
    name: string;
    totalProducts: number;
    totalViews: number;
    rank: number;
    subscriptionStatus: SubscriptionStatus;
}

export default function VendorsTab() {
    const [stores, setStores] = useState<StoreMeta[]>([]);
    const [storeStats, setStoreStats] = useState<StoreStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<SubscriptionStatus | 'all'>('all');

    const fetchData = useCallback(async () => {
        try {
            const storesData = await getStores();
            setStores(storesData);

            const statsPromises = storesData.map(async (store) => {
                const products = await getProducts(store.id);
                const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
                return {
                    id: store.id,
                    name: store.name,
                    totalProducts: products.length,
                    totalViews,
                    rank: 0,
                    subscriptionStatus: (store.subscriptionStatus || 'trial') as SubscriptionStatus
                };
            });

            const stats = await Promise.all(statsPromises);
            stats.sort((a, b) => b.totalViews - a.totalViews);
            stats.forEach((s, i) => s.rank = i + 1);
            setStoreStats(stats);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching vendor data:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const statusCounts = {
        all: stores.length,
        trial: stores.filter(s => s.subscriptionStatus === 'trial').length,
        active: stores.filter(s => s.subscriptionStatus === 'active').length,
        cancelled: stores.filter(s => s.subscriptionStatus === 'cancelled').length,
        expired: stores.filter(s => s.subscriptionStatus === 'expired').length,
    };

    const filteredStats = filter === 'all'
        ? storeStats
        : storeStats.filter(s => s.subscriptionStatus === filter);

    const getStatusColor = (status: SubscriptionStatus) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'trial': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'cancelled': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'expired': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const getStatusIcon = (status: SubscriptionStatus) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="w-4 h-4" />;
            case 'trial': return <Clock className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            case 'expired': return <AlertTriangle className="w-4 h-4" />;
            default: return <Store className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* --- Subscription Status Summary --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <Store className="w-5 h-5 text-indigo-500" /> Subscription Overview
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                                <Users className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{statusCounts.all}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-green-200 dark:border-green-900/30 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Paying</span>
                        </div>
                        <p className="text-2xl font-black text-green-600">{statusCounts.active}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-blue-200 dark:border-blue-900/30 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                <Clock className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Trial</span>
                        </div>
                        <p className="text-2xl font-black text-blue-600">{statusCounts.trial}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-red-200 dark:border-red-900/30 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600">
                                <XCircle className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Churned</span>
                        </div>
                        <p className="text-2xl font-black text-red-600">{statusCounts.cancelled + statusCounts.expired}</p>
                    </motion.div>
                </div>
            </section>

            {/* --- Vendor Leaderboard --- */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-500" /> Vendor Leaderboard
                    </h2>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filter === 'active' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600' : 'text-slate-400'}`}
                        >
                            Paying
                        </button>
                        <button
                            onClick={() => setFilter('trial')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filter === 'trial' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
                        >
                            Trial
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {filteredStats.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <Store className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No vendors in this category</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStats.slice(0, 10).map((store, i) => (
                                <motion.div
                                    key={store.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${store.rank <= 3
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                        {store.rank}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{store.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase flex items-center gap-1 ${getStatusColor(store.subscriptionStatus)}`}>
                                                {getStatusIcon(store.subscriptionStatus)}
                                                {store.subscriptionStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3 h-3" /> {store.totalProducts} products
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" /> {store.totalViews.toLocaleString()} views
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/admin/${store.id}`}
                                        className="p-2 text-slate-300 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* --- Referral Performance --- */}
            <section className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl -mr-24 -mt-24 rounded-full" />
                <div className="relative z-10">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5" /> Referral Performance
                    </h2>
                    <p className="text-purple-100 text-sm leading-relaxed mb-6">
                        Track vendor referrals, pending activations, and bonus payouts. This section integrates with the referral system.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                            <p className="text-[10px] font-bold uppercase text-purple-200 mb-1">Total Referrals</p>
                            <p className="text-2xl font-black">—</p>
                            <p className="text-[10px] text-purple-200 mt-1">Coming soon</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                            <p className="text-[10px] font-bold uppercase text-purple-200 mb-1">Pending Activation</p>
                            <p className="text-2xl font-black">—</p>
                            <p className="text-[10px] text-purple-200 mt-1">Coming soon</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                            <p className="text-[10px] font-bold uppercase text-purple-200 mb-1 flex items-center gap-1">
                                <Coins className="w-3 h-3" /> Bonus Payouts
                            </p>
                            <p className="text-2xl font-black">—</p>
                            <p className="text-[10px] text-purple-200 mt-1">Coming soon</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Link
                            href="/devteam"
                            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        >
                            Manage Referrals <ExternalLink className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
