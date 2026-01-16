'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Store,
    TrendingUp,
    TrendingDown,
    MessageCircle,
    ChevronRight,
    CreditCard,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';
import { ReferralDashboardData, ReferralStoreStats } from '@/app/actions/referralActions';
import { PerformanceChart, MiniTrendChart } from './ReferralCharts';
import Image from 'next/image';

interface ReferralDashboardClientProps {
    initialData: ReferralDashboardData;
}

export default function ReferralDashboardClient({ initialData }: ReferralDashboardClientProps) {
    const [activeTab, setActiveTab] = useState<'stores' | 'registrations'>('stores');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 pb-24">
            {/* Header */}
            <header className="p-6 pt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                            <Zap className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">Referral Dashboard</h1>
                    </div>
                    <p className="text-slate-400 text-sm">Code: <span className="text-emerald-400 font-bold uppercase">{initialData.referralCode}</span></p>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="px-6 grid grid-cols-2 gap-4 mb-8">
                <SummaryCard
                    label="Total Referrals"
                    value={initialData.summary.totalRegistrations.toString()}
                    icon={Users}
                    color="blue"
                />
                <SummaryCard
                    label="Active Stores"
                    value={initialData.summary.activeStores.toString()}
                    icon={Store}
                    color="emerald"
                />
                <SummaryCard
                    label="Weekly Earnings"
                    value={formatCurrency(initialData.summary.totalWeeklyCommission)}
                    icon={CreditCard}
                    color="amber"
                    subLabel="20% Commission"
                />
                <SummaryCard
                    label="Weekly Views"
                    value={initialData.summary.totalViews.toLocaleString()}
                    icon={TrendingUp}
                    color="purple"
                />
            </div>

            {/* Tabs */}
            <div className="px-6 mb-6">
                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('stores')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'stores' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        Active Stores
                    </button>
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'registrations' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        Registrations
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 space-y-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'stores' ? (
                        <motion.div
                            key="stores"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {initialData.stores.length === 0 ? (
                                <EmptyState message="No active stores yet. Share your code to start earning!" />
                            ) : (
                                initialData.stores.map((store) => (
                                    <StoreCard key={store.id} store={store} formatCurrency={formatCurrency} />
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="registrations"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {initialData.registrations.length === 0 ? (
                                <EmptyState message="No registrations found for this code." />
                            ) : (
                                initialData.registrations.map((reg) => (
                                    <RegistrationCard key={reg.id} reg={reg} />
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-6">
                <button
                    onClick={() => window.open(`https://wa.me/2347032905036?text=Hello%20Admin,%20I'm%20a%20referrer%20with%20code%20${initialData.referralCode}.%20I'd%20like%20to%20discuss%20my%20earnings.`, '_blank')}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <MessageCircle className="w-5 h-5" />
                    Talk to Admin
                </button>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, color, subLabel }: any) {
    const colors: any = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <div className={`p-4 rounded-3xl border ${colors[color]} bg-slate-900/40 backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-xl font-black tracking-tight">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</div>
            {subLabel && <div className="text-[9px] mt-1 opacity-40">{subLabel}</div>}
        </div>
    );
}

function StoreCard({ store, formatCurrency }: { store: ReferralStoreStats, formatCurrency: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-4 flex items-center gap-4" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="w-12 h-12 rounded-2xl bg-slate-800 relative overflow-hidden flex-shrink-0 border border-slate-700">
                    {store.logo ? (
                        <Image src={store.logo} alt={store.name} fill className="object-cover" />
                    ) : (
                        <Store className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{store.name}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${store.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {store.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium capitalize">{store.subscriptionTier}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-black text-emerald-400">+{formatCurrency(store.commission.weeklyAmount)}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Weekly</div>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-slate-800/50 pt-4 space-y-4"
                    >
                        {/* Performance Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <PerformanceMetric
                                label="Views"
                                current={store.weeklyPerformance.views.current}
                                trend={store.weeklyPerformance.views.trend}
                            />
                            <PerformanceMetric
                                label="Orders"
                                current={store.weeklyPerformance.orders.current}
                                trend={store.weeklyPerformance.orders.trend}
                            />
                        </div>

                        {/* Commission Info */}
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 flex items-start gap-3">
                            <Info className="w-4 h-4 text-emerald-400 mt-0.5" />
                            <div className="text-[11px] text-emerald-100/80 leading-relaxed">
                                You earn 20% of their weekly fee for 12 months.
                                <br />
                                <span className="text-emerald-400 font-bold">Expires: {new Date(store.referralDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.open(`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`, '_blank')}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Chat with Owner
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PerformanceMetric({ label, current, trend }: any) {
    const isUp = trend >= 0;
    return (
        <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/50">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="flex items-end justify-between">
                <div className="text-lg font-black">{current.toLocaleString()}</div>
                <div className={`flex items-center text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(Math.round(trend))}%
                </div>
            </div>
        </div>
    );
}

function RegistrationCard({ reg }: any) {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Users className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{reg.businessName}</h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-medium capitalize">{reg.storeType}</span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-500">{new Date(reg.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${reg.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {reg.status === 'completed' ? 'Live' : 'Pending'}
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-12 text-center px-6 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
            <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{message}</p>
        </div>
    );
}
