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
    BellOff,
    Smartphone,
    ChevronLeft,
    Plus,
    Minus,
    X,
    Info,
    CheckCircle2,
    ShieldCheck,
    Store
} from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collection, onSnapshot, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Naira } from '@/components/common/Naira';
import PWAInstallModal from './PWAInstallModal';

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
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isPWAInstructionsOpen, setIsPWAInstructionsOpen] = useState(false);
    const { isInstallAvailable, handleInstall } = useInstallPrompt();

    const db = getFirestore(firebaseApp);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }

        const storesRef = collection(db, 'stores');
        // ONLY count real weekly-billing subscribers (from NeedAWebsiteModal / customer sign-up flow)
        // Admin-created accounts (test, influencer, legacy monthly) are excluded automatically
        const weeklyBillingQuery = query(storesRef, where('isWeeklyBilling', '==', true));

        const unsubscribe = onSnapshot(weeklyBillingQuery, (snapshot) => {
            const realPayingCount = snapshot.docs.filter(doc => {
                const data = doc.data();
                return data.subscriptionStatus === 'active';
            }).length;
            const configRef = doc(db, 'admin', 'roadmap');
            getDoc(configRef).then((docSnap) => {
                const boost = docSnap.exists() ? (docSnap.data().manualBoost || 0) : 0;
                setManualBoost(boost);
                setCurrentVendors(realPayingCount + boost);
                setCurrentWeeklyRR((realPayingCount + boost) * 5000);
                setLoading(false);
            });
        });

        return () => unsubscribe();
    }, [db]);

    const handlePWAInstall = () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
            setIsPWAInstructionsOpen(true);
        } else if (isInstallAvailable) {
            handleInstall();
        } else {
            // Provide feedback if not installable (e.g., already installed)
            setIsPWAInstructionsOpen(true);
        }
    };

    const handleUpdateBoost = async (newBoost: number) => {
        try {
            const configRef = doc(db, 'admin', 'roadmap');
            await setDoc(configRef, { manualBoost: newBoost }, { merge: true });
            setManualBoost(newBoost);
            setIsUpdateModalOpen(false);
        } catch (error) {
            console.error("Error updating boost:", error);
        }
    };

    const totalTargetVendors = 10000;
    const progressPercentage = (currentVendors / totalTargetVendors) * 100;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'strategy', label: 'Strategy', icon: Target },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'vendors', label: 'Vendors', icon: Store },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* --- Header --- */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/devteam" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
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
                        {/* PWA Install Button */}
                        <button
                            onClick={handlePWAInstall}
                            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                        >
                            <Smartphone className="w-3.5 h-3.5" /> Install App
                        </button>

                        <button
                            onClick={() => setIsUpdateModalOpen(true)}
                            className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                        >
                            <Plus className="w-4 h-4" /> Update
                        </button>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                                <Bell className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                                <Settings2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Global Progress Bar --- */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-tighter">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {currentVendors.toLocaleString()} / 10,000 Vendors
                            </span>
                            <span>{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(2, progressPercentage)}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Current WeeklyRR</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-end">
                            <Naira />{currentWeeklyRR.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <main className="max-w-5xl mx-auto p-4 sm:p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && <OverviewTab currentVendors={currentVendors} currentWeeklyRR={currentWeeklyRR} />}
                        {activeTab === 'strategy' && <StrategyTab />}
                        {activeTab === 'team' && <TeamTab />}
                        {activeTab === 'analytics' && <AnalyticsTab currentVendors={currentVendors} currentWeeklyRR={currentWeeklyRR} />}
                        {activeTab === 'vendors' && <VendorsTab />}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* --- Bottom Navigation (Mobile) --- */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-2 z-40">
                <div className="max-w-md mx-auto flex items-center justify-around">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === tab.id
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                                <tab.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* --- Update Progress Modal --- */}
            <AnimatePresence>
                {isUpdateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUpdateModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Update Progress</h3>
                                <button onClick={() => setIsUpdateModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-indigo-500 mt-0.5" />
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                            Use "Manual Boost" to include paying vendors who are currently onboarding offline or via WhatsApp.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Manual Vendor Boost</label>
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => setManualBoost(Math.max(0, manualBoost - 1))}
                                            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <span className="text-2xl font-black">{manualBoost}</span>
                                        <button
                                            onClick={() => setManualBoost(manualBoost + 1)}
                                            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => handleUpdateBoost(manualBoost)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- PWA Instructions Modal --- */}
            <PWAInstallModal
                isOpen={isPWAInstructionsOpen}
                onClose={() => setIsPWAInstructionsOpen(false)}
            />
        </div>
    );
}
