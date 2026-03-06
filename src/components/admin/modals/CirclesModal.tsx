'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Store,
    TrendingUp,
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
    Copy,
    Check,
    ExternalLink
} from 'lucide-react';
import { getReferralDashboardData, ReferralDashboardData, ReferralStoreStats, ReferralRegistration } from '@/app/actions/referralActions';
import Image from 'next/image';

interface CirclesModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
}

export default function CirclesModal({ isOpen, onClose, storeId }: CirclesModalProps) {
    const [data, setData] = useState<ReferralDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stores' | 'registrations' | 'notifications'>('stores');
    const [copySuccess, setCopySuccess] = useState(false);
    const [selectedModal, setSelectedModal] = useState<'tier' | 'referrals' | 'active' | 'earnings' | 'views' | null>(null);

    useEffect(() => {
        if (!isOpen || !storeId) return;

        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // We use the storeId as the referral code since that's what we save in registrations
                const dashboardData = await getReferralDashboardData(storeId);
                setData(dashboardData);
            } catch (error) {
                console.error("Failed to fetch referral dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [isOpen, storeId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const referralLink = `tinyurl.com/bizconnet/${storeId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const message = `Hey! I'm inviting you to get a business website with BizconNet™. Use my link to get a LIFETIME 50% discount on your subscription: ${referralLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
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
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full sm:max-w-2xl bg-white dark:bg-black border border-slate-200 dark:border-slate-800 sm:rounded-[40px] rounded-t-[40px] max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-white font-sans shadow-2xl"
            >
                {/* Header */}
                <header className="px-6 py-6 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight leading-tight">
                                    Your Circle
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Referral Network Dashboard</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {loading || !data ? (
                        <div className="p-8 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="pb-10 pt-4">
                            {/* Tier Progress */}
                            <div className="px-6 mb-6">
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedModal('tier')}
                                    className="bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 backdrop-blur-sm cursor-pointer hover:border-emerald-500/30 transition-colors group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px]" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tier Progress</div>
                                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                {data.tier.commissionPercentage}% Commission
                                                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${data.tier.progress}%` }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold">
                                            <span className={`px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase`}>
                                                {data.tier.name} Tier
                                            </span>
                                            {data.tier.nextTierThreshold && (
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    Add <span className="text-slate-900 dark:text-white font-black">{data.tier.nextTierThreshold - data.summary.activeStores}</span> more active stores to level up
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Share Section */}
                            <div className="px-6 mb-6">
                                <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-3xl p-5">
                                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                        <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        Share Your Store Link (Referral Code)
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopyLink}
                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            {copySuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copySuccess ? 'Copied!' : 'Copy Link'}
                                        </button>
                                        <button
                                            onClick={handleShareWhatsApp}
                                            className="flex-1 bg-emerald-600 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Stats Grid */}
                            <div className="px-6 grid grid-cols-2 gap-3 mb-6">
                                <SummaryCard
                                    label="Total Referrals"
                                    value={data.summary.totalRegistrations.toString()}
                                    icon={Users}
                                    color="blue"
                                    onClick={() => setSelectedModal('referrals')}
                                />
                                <SummaryCard
                                    label="Active Stores"
                                    value={data.summary.activeStores.toString()}
                                    icon={Store}
                                    color="emerald"
                                    onClick={() => setSelectedModal('active')}
                                />
                                <SummaryCard
                                    label="Weekly Earnings"
                                    value={formatCurrency(data.summary.totalWeeklyCommission)}
                                    icon={CreditCard}
                                    color="amber"
                                    subLabel={`${data.tier.commissionPercentage}% Commission`}
                                    onClick={() => setSelectedModal('earnings')}
                                />
                                <SummaryCard
                                    label="Weekly Views"
                                    value={data.summary.totalViews.toLocaleString()}
                                    icon={TrendingUp}
                                    color="purple"
                                    onClick={() => setSelectedModal('views')}
                                />
                            </div>

                            {/* Tabs */}
                            <div className="px-6 mb-4">
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 select-none">
                                    <button
                                        onClick={() => setActiveTab('stores')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'stores' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        Stores
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('registrations')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'registrations' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        Pending
                                    </button>
                                </div>
                            </div>

                            {/* Network Lists */}
                            <div className="px-6 space-y-3">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'stores' ? (
                                        <motion.div
                                            key="stores"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-3"
                                        >
                                            {data.stores.length === 0 ? (
                                                <EmptyState message="No active stores yet. Share your link to start earning!" />
                                            ) : (
                                                data.stores.map((store) => (
                                                    <StoreCard key={store.id} store={store} formatCurrency={formatCurrency} />
                                                ))
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="registrations"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-3"
                                        >
                                            {data.registrations.length === 0 ? (
                                                <EmptyState message="No registrations found." />
                                            ) : (
                                                data.registrations.map((reg) => (
                                                    <RegistrationCard key={reg.id} reg={reg} />
                                                ))
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Nested Detail Modals from gamification */}
            <AnimatePresence>
                {selectedModal && data && (
                    <DashboardModal
                        type={selectedModal}
                        initialData={data}
                        onClose={() => setSelectedModal(null)}
                        formatCurrency={formatCurrency}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Subcomponents mostly mirrored from ReferralDashboardClient but adapted to have exact local props

function SummaryCard({ label, value, icon: Icon, color, subLabel, onClick }: any) {
    const colors: any = {
        emerald: 'bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20',
        blue: 'bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20',
        amber: 'bg-amber-50/50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20',
        purple: 'bg-purple-50/50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20',
    };

    return (
        <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`p-4 rounded-3xl border ${colors[color]} bg-white dark:bg-slate-900/40 backdrop-blur-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors group px-4`}
        >
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            </div>
            <div className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">{label}</div>
            {subLabel && <div className="text-[9px] mt-1 opacity-40 font-medium">{subLabel}</div>}
        </motion.div>
    );
}

function StoreCard({ store, formatCurrency }: { store: ReferralStoreStats, formatCurrency: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 relative overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                    {store.logo ? (
                        <Image src={store.logo || '/placeholder.png'} alt={store.name} fill className="object-cover" />
                    ) : (
                        <Store className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">{store.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${store.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10'}`}>
                            {store.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium capitalize">{store.subscriptionTier}</span>
                    </div>
                </div>
                <div className="text-right">
                    {store.commission.weeklyAmount > 0 ? (
                        <>
                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">+{formatCurrency(store.commission.weeklyAmount)}</div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Weekly</div>
                        </>
                    ) : (
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">No Comm.</div>
                    )}
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 dark:text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-slate-800/50 pt-4 space-y-4"
                    >
                        {store.status === 'trial' && store.trialEndsAt && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <div className="text-[11px] text-amber-100/80">
                                    Trial Ends: <span className="text-amber-400 font-bold">{store.trialEndsAt ? new Date(store.trialEndsAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Views</div>
                                <div className="text-lg font-black text-slate-900 dark:text-white">{store.weeklyPerformance.views.current.toLocaleString()}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Orders</div>
                                <div className="text-lg font-black text-slate-900 dark:text-white">{store.weeklyPerformance.orders.current.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Links</div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-300 truncate">tinyurl.com/bizconnet/{store.id}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`tinyurl.com/bizconnet/${store.id}`);
                                    }}
                                    className="ml-2 p-1.5 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => window.open(`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`, '_blank')}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Chat with Owner
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function RegistrationCard({ reg }: { reg: ReferralRegistration }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">{reg.businessName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium capitalize">{reg.storeType}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{new Date(reg.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${reg.status === 'completed' || reg.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'}`}>
                {reg.status === 'active' || reg.status === 'completed' ? 'Live' : 'Pending'}
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 max-w-[200px] mx-auto leading-relaxed">{message}</p>
        </div>
    );
}


// --- Modal Details --- 

function DashboardModal({ type, initialData, onClose, formatCurrency }: any) {
    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 sm:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
                <div className="p-6 pb-4 flex items-center justify-between flex-shrink-0 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                            {type === 'tier' ? <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> :
                                type === 'referrals' ? <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> :
                                    type === 'active' ? <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> :
                                        type === 'earnings' ? <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" /> :
                                            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {type === 'tier' ? 'Tier Roadmap' :
                                    type === 'referrals' ? 'Referral Stats' :
                                        type === 'active' ? 'Active Stores' :
                                            type === 'earnings' ? 'Earnings Breakdown' :
                                                'Traffic Insights'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                    {type === 'tier' && (
                        <div className="space-y-3">
                            {[{ name: 'Novice', commission: 10, range: '0-2 Stores' },
                            { name: 'Pro', commission: 20, range: '3-10 Stores' },
                            { name: 'Elite', commission: 30, range: '11+ Stores' }].map((t) => {
                                const isCurrent = initialData.tier.name === t.name;
                                return (
                                    <div key={t.name} className={`p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`text-sm font-black uppercase tracking-tight ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{t.name}</h3>
                                            {isCurrent && <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Current</span>}
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="text-xl font-black text-slate-900 dark:text-white">{t.commission}%</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-500 dark:text-slate-300">{t.range}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {type === 'referrals' && (
                        <div className="grid grid-cols-2 gap-3">
                            <StatBox label="Live" value={initialData.registrations.filter((r: any) => r.status === 'completed' || r.status === 'active').length} icon={CheckCircle2} color="emerald" />
                            <StatBox label="Pending" value={initialData.registrations.filter((r: any) => r.status !== 'completed' && r.status !== 'active').length} icon={Clock} color="blue" />
                        </div>
                    )}
                    {type === 'active' && (
                        <div className="grid grid-cols-2 gap-3">
                            <StatBox label="Paid Subs" value={initialData.stores.filter((s: any) => s.status !== 'trial').length} icon={CreditCard} color="emerald" />
                            <StatBox label="On Trial" value={initialData.stores.filter((s: any) => s.status === 'trial').length} icon={Zap} color="amber" />
                        </div>
                    )}
                    {type === 'earnings' && (
                        <div className="space-y-3">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
                                <div className="text-2xl font-black text-emerald-400 mb-1">{formatCurrency(initialData.summary.totalWeeklyCommission)}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Weekly Income</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <StatBox label="Monthly (Est)" value={formatCurrency(initialData.summary.totalWeeklyCommission * 4)} icon={TrendingUp} color="blue" />
                                <StatBox label="Yearly (Est)" value={formatCurrency(initialData.summary.totalWeeklyCommission * 52)} icon={TrendingUp} color="amber" />
                            </div>
                        </div>
                    )}
                    {type === 'views' && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 text-center">
                            <div className="text-3xl font-black text-purple-400 mb-1">{initialData.summary.totalViews.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Weekly Traffic</div>
                        </div>
                    )}
                </div>
            </motion.div>
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
        <div className={`p-4 rounded-3xl border ${colors[color]} bg-white dark:bg-slate-900/40`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 opacity-60" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{value}</div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1 block">{label}</span>
        </div>
    );
}
