'use client';

import { useState, useEffect, useRef } from 'react';
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
    Info,
    X,
    Trophy,
    Target,
    BarChart3,
    Calendar,
    User,
    Copy,
    Check,
    ExternalLink
} from 'lucide-react';
import { ReferralDashboardData, ReferralStoreStats, ReferralRegistration } from '@/app/actions/referralActions';
import { PerformanceChart, MiniTrendChart } from './ReferralCharts';
import Image from 'next/image';
import Link from 'next/link';

interface ReferralDashboardClientProps {
    initialData: ReferralDashboardData;
}

export default function ReferralDashboardClient({ initialData }: ReferralDashboardClientProps) {
    const [activeTab, setActiveTab] = useState<'stores' | 'registrations' | 'notifications'>('stores');
    const [copySuccess, setCopySuccess] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [selectedModal, setSelectedModal] = useState<'tier' | 'referrals' | 'active' | 'earnings' | 'views' | null>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallBanner(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const referralLink = `tinyurl.com/thelinkinmybio/register/${initialData.referralCode}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const message = `Hey! I'm inviting you to start your business on MV. Use my link to get a 14-day free trial and a LIFETIME 50% discount on your subscription: ${referralLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 pb-24">
            {/* Header */}
            <header className="p-6 pt-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                            </div>
                            <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-[1.1]">
                                Referral<br className="sm:hidden" /> Dashboard
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/start/${initialData.referralCode}/profile`}
                                className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Profile"
                            >
                                <User className="w-5 h-5 text-emerald-400" />
                            </Link>
                            {showInstallBanner && (
                                <button
                                    onClick={handleInstall}
                                    className="bg-emerald-500 text-black px-3 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
                                >
                                    Install App
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Code</span>
                            <span className="text-emerald-400 text-xs font-black uppercase">{initialData.referralCode}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${initialData.tier.name === 'Elite' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            initialData.tier.name === 'Pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                            {initialData.tier.name} Tier
                        </div>
                    </div>
                </div>
            </header>

            {/* Tier Progress */}
            <div className="px-6 mb-8">
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedModal('tier')}
                    className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 backdrop-blur-sm cursor-pointer hover:border-emerald-500/30 transition-colors group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tier Progress</div>
                        <div className="text-xs font-black text-emerald-400 flex items-center gap-1">
                            {initialData.tier.commissionPercentage}% Commission
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${initialData.tier.progress}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        />
                    </div>
                    {initialData.tier.nextTierThreshold && (
                        <div className="text-[10px] text-slate-500 font-medium">
                            Add <span className="text-white font-bold">{initialData.tier.nextTierThreshold - initialData.summary.activeStores}</span> more active stores to reach the next tier.
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Share Section */}
            <div className="px-6 mb-8">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-5">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        Share Your Link
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopyLink}
                            className="flex-1 bg-slate-900 border border-slate-800 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            {copySuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <CreditCard className="w-4 h-4 text-slate-400" />}
                            {copySuccess ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button
                            onClick={handleShareWhatsApp}
                            className="flex-1 bg-emerald-600 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="px-6 grid grid-cols-2 gap-4 mb-8">
                <SummaryCard
                    label="Total Referrals"
                    value={initialData.summary.totalRegistrations.toString()}
                    icon={Users}
                    color="blue"
                    onClick={() => setSelectedModal('referrals')}
                />
                <SummaryCard
                    label="Active Stores"
                    value={initialData.summary.activeStores.toString()}
                    icon={Store}
                    color="emerald"
                    onClick={() => setSelectedModal('active')}
                />
                <SummaryCard
                    label="Weekly Earnings"
                    value={formatCurrency(initialData.summary.totalWeeklyCommission)}
                    icon={CreditCard}
                    color="amber"
                    subLabel={`${initialData.tier.commissionPercentage}% Commission`}
                    onClick={() => setSelectedModal('earnings')}
                />
                <SummaryCard
                    label="Weekly Views"
                    value={initialData.summary.totalViews.toLocaleString()}
                    icon={TrendingUp}
                    color="purple"
                    onClick={() => setSelectedModal('views')}
                />
            </div>

            {/* Tabs */}
            <div className="px-6 mb-6">
                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('stores')}
                        className={`flex-1 min-w-[100px] py-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'stores' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        Stores
                    </button>
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`flex-1 min-w-[100px] py-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'registrations' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        Registrations
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 min-w-[100px] py-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'notifications' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        Notifications
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
                                <EmptyState message="No active stores yet. Share your link to start earning!" />
                            ) : (
                                initialData.stores.map((store) => (
                                    <StoreCard key={store.id} store={store} formatCurrency={formatCurrency} />
                                ))
                            )}
                        </motion.div>
                    ) : activeTab === 'registrations' ? (
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
                    ) : (
                        <motion.div
                            key="notifications"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {initialData.notifications.length === 0 ? (
                                <EmptyState message="No notifications yet. We'll alert you here when things happen!" />
                            ) : (
                                initialData.notifications.map((notif) => (
                                    <NotificationCard key={notif.id} notif={notif} />
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedModal && (
                    <DashboardModal
                        type={selectedModal}
                        initialData={initialData}
                        onClose={() => setSelectedModal(null)}
                        formatCurrency={formatCurrency}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, color, subLabel, onClick }: any) {
    const colors: any = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`p-4 rounded-3xl border ${colors[color]} bg-slate-900/40 backdrop-blur-sm cursor-pointer hover:bg-slate-900/60 transition-colors group`}
        >
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            </div>
            <div className="text-xl font-black tracking-tight">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</div>
            {subLabel && <div className="text-[9px] mt-1 opacity-40">{subLabel}</div>}
        </motion.div>
    );
}

function DashboardModal({ type, initialData, onClose, formatCurrency }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
            >
                {/* Header - Fixed */}
                <div className="p-6 sm:p-8 pb-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                            {type === 'tier' ? <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" /> :
                                type === 'referrals' ? <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" /> :
                                    type === 'active' ? <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" /> :
                                        type === 'earnings' ? <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" /> :
                                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />}
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                                {type === 'tier' ? 'Tier Roadmap' :
                                    type === 'referrals' ? 'Referral Stats' :
                                        type === 'active' ? 'Active Stores' :
                                            type === 'earnings' ? 'Earnings Deep Dive' :
                                                'Traffic Insights'}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Detailed Breakdown</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-2 scrollbar-hide">
                    <div className="space-y-6 pb-6">
                        {type === 'tier' && <TierModalContent initialData={initialData} />}
                        {type === 'referrals' && <ReferralModalContent initialData={initialData} />}
                        {type === 'active' && <ActiveModalContent initialData={initialData} />}
                        {type === 'earnings' && <EarningsModalContent initialData={initialData} formatCurrency={formatCurrency} />}
                        {type === 'views' && <ViewsModalContent initialData={initialData} />}
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="p-6 sm:p-8 pt-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm transition-colors shadow-lg active:scale-95"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function TierModalContent({ initialData }: any) {
    const tiers = [
        { name: 'Novice', commission: 10, range: '0-2 Stores', color: 'slate' },
        { name: 'Pro', commission: 20, range: '3-10 Stores', color: 'blue' },
        { name: 'Elite', commission: 30, range: '11+ Stores', color: 'amber' }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-4">
                <h4 className="text-sm font-black text-white mb-2">How commissions are calculated</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    You earn a percentage of each referred store's <span className="font-bold text-white">weekly subscription fee</span>. Formula: <span className="font-bold text-white">Weekly commission = Subscription Tier Price × Your Tier%</span>.
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                    Example: If a referred store is on <span className="font-bold">Pro tier (₦50,000/week)</span> and you're at <span className="font-bold">Pro (20%)</span>, you earn <span className="font-bold text-emerald-400">₦10,000 per week</span> for up to 5 years.
                </p>
            </div>

            {tiers.map((t) => {
                const isCurrent = initialData.tier.name === t.name;
                return (
                    <div key={t.name} className={`p-5 rounded-3xl border transition-all ${isCurrent ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/30 border-slate-800'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCurrent ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                    <Trophy className="w-4 h-4" />
                                </div>
                                <h3 className={`font-black uppercase tracking-tight ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}`}>{t.name} Tier</h3>
                            </div>
                            {isCurrent && <span className="text-[10px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-full uppercase">Current</span>}
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-2xl font-black text-white">{t.commission}%</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Commission</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-300">{t.range}</div>
                                <div className="text-[10px] text-slate-500 font-medium">Active Referrals</div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ReferralModalContent({ initialData }: any) {
    const completed = initialData.registrations.filter((r: any) => r.status === 'completed').length;
    const pending = initialData.registrations.length - completed;
    const conversionRate = initialData.registrations.length > 0 ? Math.round((completed / initialData.registrations.length) * 100) : 0;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <StatBox label="Live Stores" value={completed} icon={CheckCircle2} color="emerald" />
                <StatBox label="Pending" value={pending} icon={Clock} color="blue" />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 text-center">
                <div className="text-4xl font-black text-blue-400 mb-1">{conversionRate}%</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</div>
                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                    {conversionRate > 50 ? "You're doing great! Your referrals are highly likely to start a store." : "Keep following up with your pending registrations to boost your earnings!"}
                </p>
            </div>
        </div>
    );
}

function ActiveModalContent({ initialData }: any) {
    const trialStores = initialData.stores.filter((s: any) => s.status === 'trial').length;
    const paidStores = initialData.stores.length - trialStores;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <StatBox label="Paid Subs" value={paidStores} icon={CreditCard} color="emerald" />
                <StatBox label="On Trial" value={trialStores} icon={Zap} color="amber" />
            </div>
            <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Insight</h4>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        You have <span className="text-white font-bold">{trialStores} stores</span> on trial. Remind them that their 50% lifetime discount is waiting for them if they subscribe before their trial ends!
                    </p>
                </div>
            </div>
        </div>
    );
}

function EarningsModalContent({ initialData, formatCurrency }: any) {
    const weekly = initialData.summary.totalWeeklyCommission || 0;
    const monthlyProjection = weekly * 4;
    const yearlyProjection = weekly * 52;
    const fiveYearProjection = initialData.summary.total5YearProjection ?? (weekly * 52 * 5);

    return (
        <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
                <div className="text-3xl font-black text-emerald-400 mb-1">{formatCurrency(weekly)}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Weekly Income</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Monthly (Est)</div>
                    <div className="text-lg font-black text-white">{formatCurrency(monthlyProjection)}</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Yearly (Est)</div>
                    <div className="text-lg font-black text-white">{formatCurrency(yearlyProjection)}</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">5-Year Projection</div>
                    <div className="text-lg font-black text-white">{formatCurrency(fiveYearProjection)}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5">
                    <div className="text-[10px] font-bold text-slate-700 uppercase mb-1">Total Remaining</div>
                    <div className="text-lg font-black text-emerald-400">{formatCurrency(initialData.summary.totalRemainingCommission || 0)}</div>
                </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center px-4 leading-relaxed">
                *Projections include expected commission for up to 5 years per referred store. Earnings are paid out weekly.
            </p>
        </div>
    );
}

function ViewsModalContent({ initialData }: any) {
    return (
        <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 text-center">
                <div className="text-4xl font-black text-purple-400 mb-1">{initialData.summary.totalViews.toLocaleString()}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Weekly Traffic</div>
            </div>
            <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Traffic Performance</h4>
                <div className="space-y-4">
                    {initialData.stores.slice(0, 3).map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-[10px] font-bold">
                                    {s.name.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-slate-300">{s.name}</span>
                            </div>
                            <div className="text-xs font-black text-white">{s.weeklyPerformance.views.current.toLocaleString()} views</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };

    return (
        <div className={`p-5 rounded-3xl border ${colors[color]} bg-slate-900/40`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 opacity-60" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</span>
            </div>
            <div className="text-2xl font-black">{value}</div>
        </div>
    );
}

function StoreCard({ store, formatCurrency }: { store: ReferralStoreStats, formatCurrency: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isExpanded && cardRef.current) {
            setTimeout(() => {
                cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 250);
        }
    }, [isExpanded]);

    return (
        <div ref={cardRef} className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden scroll-mt-6">
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
                    {store.commission.weeklyAmount > 0 && (
                        <>
                            <div className="text-sm font-black text-emerald-400">+{formatCurrency(store.commission.weeklyAmount)}</div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase">Weekly</div>
                        </>
                    )}
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
                        {/* Status & Trial Info */}
                        {store.status === 'trial' && store.trialEndsAt && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <div className="text-[11px] text-amber-100/80">
                                    Free Trial Ends: <span className="text-amber-400 font-bold">{new Date(store.trialEndsAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        )}

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
                                You earn commission on their weekly fee for up to 5 years.
                                <br />
                                <span className="text-emerald-400 font-bold">Commission Period Ends: {(() => {
                                    try {
                                        if (store.commission?.periodEnd) return new Date(store.commission.periodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                                        return new Date(new Date(store.referralDate).setFullYear(new Date(store.referralDate).getFullYear() + 5)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                                    } catch (e) {
                                        return '—';
                                    }
                                })()}</span>
                                {store.commission?.projected5YearTotal ? (
                                    <div className="text-[11px] text-slate-300 mt-2">Projected 5-year commission: <span className="font-black text-emerald-300">{formatCurrency(store.commission.projected5YearTotal)}</span></div>
                                ) : null}
                                {store.commission?.totalRemainingCommission ? (
                                    <div className="text-[11px] text-slate-300">Remaining expected: <span className="font-black text-emerald-300">{formatCurrency(store.commission.totalRemainingCommission)}</span></div>
                                ) : null}
                            </div>
                        </div>

                        {/* Store Links */}
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Links</div>
                            <StoreLink
                                label="Storefront"
                                url={`tinyurl.com/thelinkinmybio/${store.id}`}
                            />
                            <StoreLink
                                label="Admin Dashboard"
                                url={`tinyurl.com/thelinkinmybio/admin/${store.id}`}
                            />
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

function StoreLink({ label, url }: { label: string; url: string }) {
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-[10px] font-bold text-slate-300 truncate">{url}</span>
            </div>
            <button
                onClick={handleCopy}
                className="ml-2 p-1.5 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                title="Copy link"
            >
                {copySuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
            </button>
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

function RegistrationCard({ reg }: { reg: ReferralRegistration }) {
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

function NotificationCard({ notif }: { notif: any }) {
    const icons: any = {
        registration: Users,
        subscription: CreditCard,
        milestone: Zap
    };
    const Icon = icons[notif.type] || Info;

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${notif.type === 'registration' ? 'bg-blue-500/10 text-blue-400' :
                notif.type === 'subscription' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-amber-500/10 text-amber-400'
                }`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">{notif.title}</h4>
                    <span className="text-[9px] text-slate-500">{new Date(notif.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{notif.message}</p>
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
