'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Unlock, DollarSign, Store, Clock, CheckCircle,
    RefreshCw, ChevronRight, AlertCircle, Star, Users, UserPlus, BadgeCheck, Tag
} from 'lucide-react';
import Link from 'next/link';
import { getMediaDashboardStats, MediaStoreStats } from '@/app/actions/mediaDashboardActions';
import { getMediaRegistrations, MediaRegistrationData } from '@/app/actions/mediaRegistrationActions';
import { bulkReleaseAgedEscrows } from '@/app/actions/orderActions';
import toast from 'react-hot-toast';

const fmt = (n: number) =>
    n >= 1_000_000
        ? `₦${(n / 1_000_000).toFixed(1)}M`
        : n >= 1_000
            ? `₦${(n / 1000).toFixed(1)}K`
            : `₦${n.toLocaleString()}`;

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricChip({
    label, value, sub, icon, color,
}: {
    label: string; value: string; sub?: string; icon: React.ReactNode; color: string;
}) {
    const colors: Record<string, string> = {
        green: 'from-green-500 to-teal-500 shadow-green-200/50',
        purple: 'from-violet-500 to-purple-600 shadow-purple-200/50',
        blue: 'from-blue-500 to-cyan-500 shadow-blue-200/50',
        amber: 'from-amber-400 to-orange-500 shadow-amber-200/50',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${colors[color]} rounded-3xl p-5 text-white shadow-lg`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">{label}</span>
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">{icon}</div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{value}</p>
            {sub && <p className="text-xs opacity-70 mt-1 font-medium">{sub}</p>}
        </motion.div>
    );
}

// ─── Store Row Card ────────────────────────────────────────────────────────────
function StoreCard({ store, index, onRefresh }: { store: MediaStoreStats; index: number; onRefresh: () => void }) {
    const [open, setOpen] = useState(false);
    const [isReleasing, setIsReleasing] = useState(false);

    const handleBulkRelease = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to release all ${store.agedOrdersCount} aged escrows for ${store.storeName}?`)) return;

        setIsReleasing(true);
        try {
            const result = await bulkReleaseAgedEscrows(store.storeId, store.agedOrderIds);
            if (result.success) {
                toast.success(`Successfully released ${result.count} aged orders!`);
                onRefresh();
            } else {
                toast.error(result.error || 'Failed to release orders');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsReleasing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden"
        >
            {/* Top Row */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-purple-200/50 dark:shadow-none">
                        {store.storeName[0]}
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">{store.storeName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{store.ownerName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {store.disputedOrdersCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase animate-pulse">
                            <AlertCircle size={10} />
                            {store.disputedOrdersCount} Dispute
                        </span>
                    )}
                    {store.pendingReviewOrders > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase">
                            <Clock size={10} />
                            {store.pendingReviewOrders} Pending
                        </span>
                    )}
                    <div className="text-right">
                        <p className="text-sm font-extrabold text-green-600 dark:text-green-400">{fmt(store.totalPlatformRevenue)}</p>
                        <p className="text-[10px] text-gray-400">Compass cut</p>
                    </div>
                    <ChevronRight
                        size={16}
                        className={`text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
                    />
                </div>
            </button>

            {/* Expanded Detail */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-gray-100 dark:border-slate-800"
                    >
                        <div className="p-5 grid grid-cols-2 gap-3">
                            {/* Revenue Breakdown */}
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Revenue Breakdown</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Service GMV', value: fmt(store.serviceGMV), color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' },
                                        { label: 'Physical GMV', value: fmt(store.physicalGMV), color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                                        { label: 'Booking Fees', value: fmt(store.bookingFeeRevenue), color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className={`rounded-2xl p-3 ${color}`}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
                                            <p className="text-base font-extrabold mt-0.5">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* BizConNet Cuts */}
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Compass Platform Cuts</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-2xl p-3 bg-green-50 dark:bg-green-900/20">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 opacity-70">20% Booking</p>
                                        <p className="text-base font-extrabold text-green-700 dark:text-green-300 mt-0.5">{fmt(store.platformBookingCut)}</p>
                                    </div>
                                    <div className="rounded-2xl p-3 bg-teal-50 dark:bg-teal-900/20">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 opacity-70">10% Services</p>
                                        <p className="text-base font-extrabold text-teal-700 dark:text-teal-300 mt-0.5">{fmt(store.platformEscrowCut)}</p>
                                    </div>
                                    <div className="rounded-2xl p-3 bg-blue-50 dark:bg-blue-900/20">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 opacity-70">5% Physical</p>
                                        <p className="text-base font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{fmt(store.platformPhysicalCut)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Escrow Health */}
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Escrow Health</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-2xl p-3 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-3">
                                        <Unlock size={18} className="text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">In Escrow</p>
                                            <p className="text-base font-extrabold text-blue-700 dark:text-blue-300">{fmt(store.escrowHeldBalance)}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl p-3 bg-green-50 dark:bg-green-900/20 flex items-center gap-3">
                                        <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Released</p>
                                            <p className="text-base font-extrabold text-green-700 dark:text-green-300">{fmt(store.escrowReleasedTotal)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Stats */}
                            <div className="col-span-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-2xl px-4 py-3">
                                <span>{store.totalOrders} total orders</span>
                                <div>
                                    {store.disputedOrdersCount > 0 && <span className="text-red-500 font-bold mr-3">{store.disputedOrdersCount} disputed</span>}
                                    <span>{store.serviceOrders} service</span>
                                </div>
                                {store.pendingReviewOrders > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">{store.pendingReviewOrders} awaiting approval</span>
                                )}
                            </div>

                            {/* Manual Action for Aged Escrow */}
                            {store.agedOrdersCount > 0 && (
                                <button
                                    onClick={handleBulkRelease}
                                    disabled={isReleasing}
                                    className="col-span-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {isReleasing ? <RefreshCw size={14} className="animate-spin" /> : <Unlock size={14} />}
                                    Approve & Release {store.agedOrdersCount} Aged Escrows
                                </button>
                            )}

                            {/* CTA */}
                            <Link
                                href={`/admin/${store.storeId}`}
                                className="col-span-2 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold text-center hover:opacity-90 transition-opacity"
                            >
                                Open Store Admin →
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Registration Card ─────────────────────────────────────────────────────────
function RegistrationCard({ reg, index }: { reg: MediaRegistrationData; index: number }) {
    const ts = reg.registeredAt as any;
    const date = ts?.toDate ? ts.toDate() : new Date(ts || Date.now());
    const fmtDate = date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    const fmtTime = date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4"
        >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-purple-200/50 dark:shadow-none flex-shrink-0">
                {reg.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{reg.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reg.email}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{reg.bankName} · ···{reg.accountNumber.slice(-4)}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${reg.paymentType === 'paid'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                    {reg.paymentType === 'paid' ? <><BadgeCheck size={10} /> Paid</> : <><Tag size={10} /> Free</>}
                </span>
                <p className="text-[10px] text-gray-400">{fmtDate} · {fmtTime}</p>
            </div>
        </motion.div>
    );
}

// ─── New Registrations Section ─────────────────────────────────────────────────
function NewRegistrationsSection() {
    const [registrations, setRegistrations] = useState<MediaRegistrationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'paid' | 'free'>('all');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getMediaRegistrations();
            setRegistrations(data);
            setLoading(false);
        })();
    }, []);

    const filtered = filter === 'all' ? registrations : registrations.filter(r => r.paymentType === filter);
    const paidCount = registrations.filter(r => r.paymentType === 'paid').length;
    const freeCount = registrations.filter(r => r.paymentType === 'free').length;

    return (
        <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserPlus size={16} className="text-violet-500" />
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        New Registrations ({registrations.length})
                    </h2>
                </div>
                <Link href="/media" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">View Landing Page ↗</Link>
            </div>

            {/* Metric chips */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total', value: registrations.length, color: 'from-violet-500 to-purple-600 shadow-purple-200/50' },
                    { label: 'Paid (₦10k)', value: paidCount, color: 'from-green-500 to-teal-500 shadow-green-200/50' },
                    { label: 'Free (Code)', value: freeCount, color: 'from-blue-500 to-cyan-500 shadow-blue-200/50' },
                ].map(chip => (
                    <motion.div
                        key={chip.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-gradient-to-br ${chip.color} rounded-3xl p-4 text-white shadow-lg`}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{chip.label}</p>
                        <p className="text-3xl font-extrabold tracking-tight mt-1">{chip.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {(['all', 'paid', 'free'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${filter === f
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[76px] bg-gray-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                        <UserPlus size={24} className="text-violet-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {filter === 'all' ? 'No registrations yet. Share the /media page!' : `No ${filter} registrations yet.`}
                    </p>
                </div>
            )}

            {/* Registration cards */}
            {!loading && (
                <div className="space-y-3">
                    {filtered.map((reg, i) => (
                        <RegistrationCard key={reg.id} reg={reg} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MediaDashboardPage() {
    const [stores, setStores] = useState<MediaStoreStats[]>([]);
    const [totals, setTotals] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchData = useCallback(async () => {
        setLoading(true);
        const result = await getMediaDashboardStats();
        if (result.success) {
            setStores(result.stores);
            setTotals(result.totals);
        }
        setLastRefresh(new Date());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60_000); // auto-refresh every 60s
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 px-5 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Star size={16} className="text-white" />
                            </div>
                            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Media Dashboard</h1>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-10">
                            Influencer stores · Compass 🧭 platform analytics
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 hidden sm:block">
                            Updated {lastRefresh.toLocaleTimeString()}
                        </span>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center hover:bg-violet-100 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
                {/* Platform Totals */}
                {totals && (
                    <div className="grid grid-cols-2 gap-3">
                        <MetricChip
                            label="Total Platform Revenue"
                            value={fmt(totals.totalPlatformRevenue)}
                            sub="20% booking + 10% escrow + 5% product"
                            icon={<DollarSign size={17} />}
                            color="green"
                        />
                        <MetricChip
                            label="Escrow Liability"
                            value={fmt(totals.totalEscrowHeld)}
                            sub="Funds awaiting brand approval"
                            icon={<Unlock size={17} />}
                            color="blue"
                        />
                        <MetricChip
                            label="Booking Fee Cuts (20%)"
                            value={fmt(totals.totalBookingCuts)}
                            sub="From 1-time brand registrations"
                            icon={<Users size={17} />}
                            color="amber"
                        />
                        <MetricChip
                            label="Product Cuts (5%)"
                            value={fmt(totals.totalPhysicalCuts)}
                            sub={`Across ${totals.storeCount} influencer stores`}
                            icon={<TrendingUp size={17} />}
                            color="purple"
                        />
                    </div>
                )}

                {/* Store List Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Store size={16} className="text-gray-400" />
                        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Influencer Stores ({stores.length})
                        </h2>
                    </div>
                    <Link
                        href="/superadmin"
                        className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                    >
                        ← Superadmin
                    </Link>
                </div>

                {/* Loading Skeleton */}
                {loading && stores.length === 0 && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* No Data */}
                {!loading && stores.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-violet-400" />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">No Influencer Stores Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs mx-auto">
                            Media-influencer stores will appear here once they are registered and start generating orders.
                        </p>
                    </div>
                )}

                {/* Store Cards */}
                <div className="space-y-3">
                    {stores.map((store, i) => (
                        <StoreCard key={store.storeId} store={store} index={i} onRefresh={fetchData} />
                    ))}
                </div>

                {/* ── New Registrations Section ─────────────────────── */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800">
                    <NewRegistrationsSection />
                </div>
            </div>
        </div>
    );
}
