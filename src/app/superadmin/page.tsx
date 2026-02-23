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
    Zap
} from 'lucide-react';
import MetricCard3D from '@/components/superadmin/MetricCard3D';
import RegistrationPipeline from '@/components/superadmin/RegistrationPipeline';
import TenantDirectory from '@/components/superadmin/TenantDirectory';
import GlobalBroadcast from '@/components/superadmin/GlobalBroadcast';
import BillingWatchdog from '@/components/superadmin/BillingWatchdog';
import { getPlatformStats } from '@/app/actions/superadminActions';

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState('pulse');
    const [stats, setStats] = useState<any>(null);

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
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 pb-32">
            {/* Header Section */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 border-b-4 border-indigo-500/20 inline-block pb-1">
                        SuperAdmin
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Platform Creator Dashboard</p>
                </div>
                <button className="w-12 h-12 rounded-2xl bg-white shadow-soft flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors border border-slate-100">
                    <Bell className="w-6 h-6" />
                </button>
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
      `}</style>
        </div>
    );
}
