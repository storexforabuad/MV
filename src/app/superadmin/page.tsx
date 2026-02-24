'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    ClipboardCheck,
    Store,
    TrendingUp,
    Megaphone,
    PlusCircle,
    Bell,
    Package,
    ArrowUpRight,
    Zap,
    Download
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import MetricCard3D from '@/components/superadmin/MetricCard3D';
import RegistrationPipeline from '@/components/superadmin/RegistrationPipeline';
import TenantDirectory from '@/components/superadmin/TenantDirectory';
import GlobalBroadcast from '@/components/superadmin/GlobalBroadcast';
import BillingWatchdog from '@/components/superadmin/BillingWatchdog';
import NotificationModal from '@/components/superadmin/NotificationModal';
import { getPlatformStats } from '@/app/actions/superadminActions';
import Link from 'next/link';

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState('pulse');
    const [stats, setStats] = useState<any>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            const result = await getPlatformStats();
            if (result.success) {
                setStats(result.stats);
            }
        };
        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);

        // PWA Install Logic
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for pending registrations for the notification bell
        const q = query(collection(db, 'registrations'), where('status', 'in', ['pending', 'active']));
        const unsubPending = onSnapshot(q, (snapshot) => {
            setPendingCount(snapshot.size);
        });

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            unsubPending();
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    return (
        <div className="space-y-6 pb-32">
            {/* Header Section */}
            <header className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 border-b-4 border-indigo-500/20 inline-block pb-1">
                            SuperAdmin
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium mt-1">Platform Creator Dashboard</p>

                    {deferredPrompt && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleInstall}
                            className="mt-3 h-8 px-4 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-indigo-700 transition-all border border-indigo-500 animate-pulse"
                        >
                            <Download className="w-3 h-3" /> Install Dash App
                        </motion.button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/devteam/growth"
                        className="h-12 px-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                    >
                        <TrendingUp className="w-4 h-4" /> Growth Portal
                    </Link>

                    <button
                        onClick={() => setIsNotifOpen(true)}
                        className="w-12 h-12 rounded-2xl bg-white shadow-soft flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors border border-slate-100 relative group"
                    >
                        <Bell className={`w-6 h-6 ${pendingCount > 0 ? 'animate-swing' : ''}`} />
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md animate-in fade-in zoom-in group-hover:scale-110 transition-transform">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="min-h-[60vh]"
                >
                    {activeTab === 'pulse' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <MetricCard3D
                                    title="Global GMV"
                                    value={stats ? `₦${(stats.totalGMV / 1000).toFixed(1)}K` : '...'}
                                    subValue={stats ? `₦${stats.totalGMV.toLocaleString()}` : ''}
                                    icon={<Activity className="w-5 h-5" />}
                                    color="purple"
                                />
                                <MetricCard3D
                                    title="Active Stores"
                                    value={stats ? stats.activeStores : '...'}
                                    subValue={stats ? `of ${stats.totalStores}` : ''}
                                    icon={<Store className="w-5 h-5" />}
                                    color="blue"
                                />
                                <MetricCard3D
                                    title="Total Products"
                                    value={stats ? stats.totalProducts.toLocaleString() : '...'}
                                    subValue="Live"
                                    icon={<Package className="w-5 h-5" />}
                                    color="orange"
                                />
                                <MetricCard3D
                                    title="Reg. Pipeline"
                                    value={stats ? stats.pendingRegs : '...'}
                                    subValue="Pending"
                                    icon={<ClipboardCheck className="w-5 h-5" />}
                                    color="emerald"
                                />
                            </div>

                            {/* Growth Chart Section */}
                            <div className="bg-white squircle-32 shadow-soft border border-slate-100 p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Platform Pulse</h3>
                                        <p className="text-slate-500 text-sm font-medium">Growth trends across all stores</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        LIVE UPDATES
                                    </div>
                                </div>

                                <div className="h-48 w-full flex items-end gap-2 px-2">
                                    {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 100].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: i * 0.05, duration: 1, ease: 'easeOut' }}
                                            className="flex-1 bg-gradient-to-t from-indigo-50 to-indigo-500/20 rounded-t-lg relative group"
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                Day {i + 1}: {h} units
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="flex justify-between px-2 text-[10px] items-center font-bold text-slate-400 uppercase tracking-widest mt-4">
                                    <span>Start of Month</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            <span>Revenue</span>
                                        </div>
                                    </div>
                                    <span>Today</span>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-indigo-600 squircle-32 p-6 flex items-center justify-between text-white shadow-lg shadow-indigo-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <PlusCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Pending Registrations</h4>
                                        <p className="text-indigo-100 text-sm">New vendors awaiting approval</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveTab('apply')}
                                    className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'apply' && <RegistrationPipeline />}
                    {activeTab === 'tenants' && <TenantDirectory />}
                    {activeTab === 'broadcast' && <GlobalBroadcast />}
                    {activeTab === 'billing' && <BillingWatchdog />}
                </motion.div>
            </AnimatePresence>

            {/* Notification Modal */}
            <NotificationModal
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                onJumpToApply={() => setActiveTab('apply')}
            />

            {/* Bottom Navigation */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 backdrop-blur-xl border border-white/20 squircle-32 shadow-2xl p-2 flex items-center justify-between z-50">
                {[
                    { id: 'pulse', icon: Activity, label: 'Pulse' },
                    { id: 'apply', icon: ClipboardCheck, label: 'Apply' },
                    { id: 'tenants', icon: Store, label: 'Tenants' },
                    { id: 'billing', icon: TrendingUp, label: 'Billing' },
                    { id: 'broadcast', icon: Megaphone, label: 'Comms' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center gap-1 flex-1 py-3 transition-all duration-300 relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-indigo-50 squircle-32 -z-10"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <style jsx>{`
        .shadow-soft {
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
        }
        @keyframes swing {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(10deg); }
          30% { transform: rotate(-10deg); }
          50% { transform: rotate(5deg); }
          70% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-swing {
          animation: swing 1s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>
        </div>
    );
}
