'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Target,
    Users,
    BarChart3,
    Settings2,
    Bell,
    ChevronLeft,
    Plus,
    Minus,
    X,
    Store,
    Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collection, onSnapshot, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';
import { Naira } from '@/components/common/Naira';

// Tabs
import OverviewTab from './OverviewTab';
import StrategyTab from './StrategyTab';
import TeamTab from './TeamTab';
import AnalyticsTab from './AnalyticsTab';
import VendorsTab from './VendorsTab';

type TabType = 'overview' | 'strategy' | 'team' | 'analytics' | 'vendors';

export default function GrowthPortal() {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [currentVendors, setCurrentVendors] = useState(0);
    const [currentWeeklyRR, setCurrentWeeklyRR] = useState(0);
    const [manualBoost, setManualBoost] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    const db = getFirestore(firebaseApp);

    useEffect(() => {
        const storesRef = collection(db, 'stores');
        // Filter out weekly billing stores (usually real ones)
        const weeklyBillingQuery = query(storesRef, where('isWeeklyBilling', '==', true));

        const unsubscribe = onSnapshot(weeklyBillingQuery, (snapshot) => {
            // METRICS RESET: Force 0 regardless of Firestore data for clean start
            setCurrentVendors(0);
            setCurrentWeeklyRR(0);
            setManualBoost(0);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const handleUpdateBoost = async (newBoost: number) => {
        // Disabled for now as we want 0
        return;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-32">
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* --- Header --- */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/superadmin" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent truncate">
                                Growth Portal
                            </h1>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Scaling to 10k</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsUpdateModalOpen(true)}
                            className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                        >
                            <Plus className="w-4 h-4" /> Update
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="max-w-5xl mx-auto p-4 sm:p-6 pb-20">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    <MetricCard
                        label="Active Vendors"
                        value="0"
                        trend="+0%"
                        icon={Store}
                        color="indigo"
                    />
                    <MetricCard
                        label="WeeklyRR"
                        value="0"
                        trend="₦0 expected"
                        icon={BarChart3}
                        color="purple"
                        isCurrency={true}
                    />
                    <MetricCard
                        label="Referrals"
                        value="0"
                        trend="v1.2 active"
                        icon={Users}
                        color="blue"
                    />
                    <MetricCard
                        label="Goal Progress"
                        value="0.00%"
                        trend="Just started"
                        icon={Target}
                        color="pink"
                    />
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && <OverviewTab currentVendors={0} currentWeeklyRR={0} />}
                        {activeTab === 'analytics' && <AnalyticsTab currentVendors={0} currentWeeklyRR={0} />}
                        {activeTab === 'strategy' && <StrategyTab />}
                        {activeTab === 'team' && <TeamTab />}
                        {activeTab === 'vendors' && <VendorsTab />}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Premium Mobile Bottom Navigation */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-2 flex items-center justify-between z-50">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Pulse" icon={LayoutDashboard} />
                <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} label="Data" icon={BarChart3} />
                <TabButton active={activeTab === 'strategy'} onClick={() => setActiveTab('strategy')} label="Plan" icon={Target} />
                <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} label="Team" icon={Users} />
                <TabButton active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} label="Stores" icon={Settings2} />
            </nav>

            {/* Manual Update Modal (mostly for internal use now) */}
            <AnimatePresence>
                {isUpdateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative border border-slate-100 dark:border-slate-800"
                        >
                            <button
                                onClick={() => setIsUpdateModalOpen(false)}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold">Metrics Restricted</h3>
                                <p className="text-sm text-slate-500">Public metrics are currently reset to 0.</p>
                            </div>

                            <button
                                onClick={() => setIsUpdateModalOpen(false)}
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98]"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MetricCard({ label, value, trend, icon: Icon, color, isCurrency }: any) {
    const colorMap: any = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 border-indigo-100/50',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 border-purple-100/50',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 border-blue-100/50',
        pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 border-pink-100/50',
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
                {isCurrency && <Naira className="w-4 h-4 text-slate-900 dark:text-white" />}
                <p className="text-xl sm:text-2xl font-black">{value}</p>
            </div>
            <p className="text-[10px] text-indigo-500 font-bold mt-1">{trend}</p>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 flex-1 py-3 transition-all duration-300 relative rounded-[2rem] ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            {active && (
                <motion.div
                    layoutId="activeTabGrowth"
                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
            )}
            <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[9px] font-black uppercase tracking-tight">{label}</span>
        </button>
    );
}
