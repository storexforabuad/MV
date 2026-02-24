'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart,
    TrendingUp,
    Target,
    Coins,
    Users,
    Globe,
    Rocket,
    LineChart,
    Zap,
    BadgeCheck,
    AlertTriangle,
    Percent,
    DollarSign,
    CalendarDays
} from 'lucide-react';
import { Naira } from '@/components/common/Naira';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';
import GrowthAnalysisModal from './modals/GrowthAnalysisModal';

// ─── Real Plan Prices (post-Ramadan-promo: base / 2) ────────────────────────
// Lite: ₦1000 base → ₦500/wk customer pays
// Pro:  ₦2000 base → ₦1000/wk customer pays
// Max:  ₦7000 base → ₦3500/wk customer pays
const TIER_CONFIG: Record<string, { label: string; price: number; color: string; bg: string }> = {
    lite: { label: 'Lite', price: 500, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    pro: { label: 'Pro', price: 1000, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    max: { label: 'Max', price: 3500, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    unknown: { label: 'Other', price: 750, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900' },
};

// ─── Model Assumptions ───────────────────────────────────────────────────────
// Mix: 40% Lite, 45% Pro, 15% Max → avg ₦1,175/wk
const AVG_PLAN_PRICE = 1175;
// Solo-phase weekly ops cost (infra only, no ads, no staff yet)
const WEEKLY_COSTS = 100_000; // ₦100,000/wk (Firebase Blaze + Vercel + Misc)

// ─── Feb → Dec 2026 Projections ─────────────────────────────────────────────
// Based on: DM outreach (phase 1-2), referral loop, then paid ads (phase 3+)
const monthlyProjections = [
    { month: 'Feb \'26', vendors: 0, weeklyRR: 0, note: 'Starting line (now)' },
    { month: 'Mar', vendors: 8, weeklyRR: 9400, note: 'DMs: food, fashion, beauty (Kano/Bauchi)' },
    { month: 'Apr', vendors: 22, weeklyRR: 25850, note: 'Referral loop kicks in' },
    { month: 'May', vendors: 45, weeklyRR: 52875, note: 'Influencer Trojan Horse effect' },
    { month: 'Jun', vendors: 80, weeklyRR: 94000, note: 'Kano 100 milestone reached' },
    { month: 'Jul', vendors: 130, weeklyRR: 152750, note: 'Phase 3 begins — light ads' },
    { month: 'Aug', vendors: 210, weeklyRR: 246750, note: 'Meta ads optimised' },
    { month: 'Sep', vendors: 320, weeklyRR: 376000, note: 'Field agents in 2 cities' },
    { month: 'Oct', vendors: 480, weeklyRR: 564000, note: 'Word-of-mouth compounding' },
    { month: 'Nov', vendors: 680, weeklyRR: 799000, note: 'Lagos/Abuja expansion' },
    { month: 'Dec', vendors: 950, weeklyRR: 1116250, note: '950 vendors by year end' },
];
const maxProjectionVendors = Math.max(...monthlyProjections.map(m => m.vendors), 1);

export default function AnalyticsTab({ currentVendors, currentWeeklyRR }: { currentVendors: number; currentWeeklyRR: number }) {
    const [tierBreakdown, setTierBreakdown] = useState<Record<string, number>>({});
    const [churnCount, setChurnCount] = useState(0);
    const [trialCount, setTrialCount] = useState(0);
    const [totalStores, setTotalStores] = useState(0);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

    useEffect(() => {
        const db = getFirestore(firebaseApp);
        getDocs(collection(db, 'stores')).then(snap => {
            const breakdown: Record<string, number> = {};
            let churned = 0, trials = 0;
            snap.forEach(doc => {
                const data = doc.data();
                if (data.isTestStore) return;
                const tier = (data.subscriptionTier || 'unknown').toLowerCase();
                breakdown[tier] = (breakdown[tier] || 0) + 1;
                if (data.subscriptionStatus === 'cancelled' || data.subscriptionStatus === 'expired') churned++;
                if (data.subscriptionStatus === 'trial') trials++;
            });
            setTierBreakdown({});
            setChurnCount(0);
            setTrialCount(0);
            setTotalStores(0);
        }).catch(() => { });
    }, []);

    const targetWeeklyRR = 11_750_000; // ₦11.75M = 10k vendors × ₦1,175 avg
    const progressPct = Math.min((currentWeeklyRR / targetWeeklyRR) * 100, 100);
    const vendorsToBreakEven = Math.ceil(WEEKLY_COSTS / AVG_PLAN_PRICE);
    const breakEvenGap = Math.max(0, vendorsToBreakEven - currentVendors);
    const retentionRate = totalStores > 0 ? (((totalStores - churnCount) / totalStores) * 100).toFixed(1) : '—';
    const trialConversion = trialCount > 0 ? ((currentVendors / (currentVendors + trialCount)) * 100).toFixed(1) : '—';

    return (
        <div className="space-y-8">

            {/* ─── Live WeeklyRR Progress ─────────────────────────────────────── */}
            <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Live Progress</p>
                    <h2 className="text-xl font-black mb-1 flex items-center">
                        <Naira />{currentWeeklyRR.toLocaleString()}
                        <span className="text-sm font-medium text-indigo-200 ml-2">/ week</span>
                    </h2>
                    <p className="text-xs text-indigo-200 mb-5">Target: ₦11,750,000 WeeklyRR (10k vendors × ₦1,175 avg)</p>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(1.5, progressPct)}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-indigo-200 mt-2">
                        <span>{progressPct.toFixed(4)}% of goal</span>
                        <span>{currentVendors.toLocaleString()} active vendors</span>
                    </div>
                </div>
            </section>

            {/* ─── Plan Prices Clarification ──────────────────────────────────── */}
            <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl px-4 py-3 flex items-start gap-3">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Ramadan Promo Active (ends Apr 1, 2026)</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Customers pay 50% off. Lite ₦500 · Pro ₦1,000 · Max ₦3,500 /wk. Post-promo: ₦1,000 · ₦2,000 · ₦7,000 /wk.</p>
                </div>
            </section>

            {/* ─── Profitability Analysis ─────────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Profitability Analysis</h3>
                        <p className="text-xs text-slate-500">At 10,000 vendors milestone</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">WeeklyRR (10k vendors)</p>
                        <p className="text-3xl font-black text-green-600 flex items-center"><Naira />11,750,000</p>
                        <p className="text-xs text-slate-400 mt-1">10,000 vendors × ₦1,175 avg</p>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Net Weekly Profit</p>
                        <p className="text-3xl font-black text-indigo-600 flex items-center"><Naira />5,750,000</p>
                        <p className="text-xs text-slate-400 mt-1">~49% net margin</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Weekly Cost Breakdown (10k scale)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: 'Marketing/Ads', amount: '2,000,000', percent: '17%', note: 'Meta/IG ads at scale', icon: Rocket, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                            { label: 'Ops & Team', amount: '2,500,000', percent: '21%', note: '3-5 staff at scale', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                            { label: 'Paystack Fees', amount: '850,000', percent: '7.2%', note: '1.5% + ₦100/txn', icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
                            { label: 'Infrastructure', amount: '650,000', percent: '5.5%', note: 'Firebase, Vercel, CDN', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' }
                        ].map((cost, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${cost.bg} ${cost.color}`}>
                                        <cost.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{cost.label}</span>
                                        <span className="text-[10px] text-slate-400">{cost.note}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black flex items-center justify-end"><Naira />{cost.amount}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{cost.percent} of WRR</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Now (Solo Phase) — Weekly Costs</p>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { label: 'Firebase Blaze', val: '₦60,000' },
                            { label: 'Vercel', val: '₦20,000' },
                            { label: 'Misc', val: '₦20,000' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                                {item.label}: <span className="font-black text-slate-800 dark:text-white ml-1">{item.val}/wk</span>
                            </div>
                        ))}
                        <div className="w-full mt-1 text-xs font-black text-green-600">Total: ₦100,000/wk → break-even at just {vendorsToBreakEven} vendors 🎯</div>
                    </div>
                </div>

                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">Annual Revenue at 10k Vendors: ₦611M</p>
                    </div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        At 10k vendors paying avg ₦1,175/wk × 52 weeks = ₦611M/year. Post-promo (full price): ₦1,223B/year. You only need {vendorsToBreakEven} vendors to cover all current weekly costs.
                    </p>
                </div>
            </section>

            {/* ─── Unit Economics ─────────────────────────────────────────────── */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold px-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> Unit Economics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { label: 'CAC (DM Phase)', sublabel: 'Cost to acquire via Instagram/WhatsApp DM', value: '₦0 cash', detail: 'Pure time cost (~2hrs per vendor). You just need to show up daily.', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-100 dark:border-green-900/20', icon: Target },
                        { label: 'CAC (Ads Phase)', sublabel: 'Phase 3+ paid acquisition', value: '₦2,000–₦8,000', detail: 'Conservative Meta/IG ad estimate. Optimised campaigns can hit ₦1,500/vendor', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-100 dark:border-orange-900/20', icon: Rocket },
                        { label: 'LTV (avg 10wks)', sublabel: 'Lifetime Value per vendor', value: '₦11,750', detail: '10 weeks × ₦1,175 avg plan. Vendors who succeed stay much longer.', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-100 dark:border-indigo-900/20', icon: BadgeCheck },
                        { label: 'LTV:CAC Ratio', sublabel: 'DM phase / Ads phase', value: '∞ / 5.9:1', detail: 'DM phase: infinite return (no cash cost). Ads phase: 5.9:1 — well above 3:1 healthy threshold.', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/10', border: 'border-purple-100 dark:border-purple-900/20', icon: Percent },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-5 rounded-3xl border ${item.border} ${item.bg}`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            </div>
                            <p className={`text-xl font-black ${item.color} mb-1`}>{item.value}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.sublabel}</p>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.detail}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── Break-even Calculator ──────────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold">Break-Even Calculator</h3>
                        <p className="text-xs text-slate-500">At avg ₦1,175/wk, you need {vendorsToBreakEven} vendors to cover ₦100k/wk costs</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Weekly Costs</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white"><Naira />100k</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Break-Even</p>
                        <p className="text-sm font-black text-amber-600">{vendorsToBreakEven} vendors</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Remaining</p>
                        <p className={`text-sm font-black ${breakEvenGap === 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {breakEvenGap === 0 ? '✓ Covered' : `${breakEvenGap} more`}
                        </p>
                    </div>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-amber-400 to-green-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (currentVendors / vendorsToBreakEven) * 100)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 text-right">
                    {currentVendors} / {vendorsToBreakEven} vendors to break-even
                </p>
            </section>

            {/* ─── Revenue by Plan ────────────────────────────────────────────── */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold px-2 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-500" /> Revenue by Plan
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.entries(TIER_CONFIG).filter(([key]) => key !== 'unknown').map(([tier, config]) => {
                        const count = tierBreakdown[tier] || 0;
                        const weeklyContribution = count * config.price;
                        const pct = totalStores > 0 ? ((count / totalStores) * 100).toFixed(0) : '0';
                        return (
                            <div key={tier} className="flex items-center justify-between px-5 py-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${config.bg} ${config.color}`}>{config.label}</span>
                                    <span className="text-sm text-slate-500 font-medium"><Naira />{config.price.toLocaleString()}/wk</span>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${config.color}`}>{count} vendors</p>
                                    <p className="text-[10px] text-slate-400 font-bold">
                                        <Naira />{weeklyContribution.toLocaleString()} ({pct}%)
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {(tierBreakdown['unknown'] || 0) > 0 && (
                        <div className="flex items-center justify-between px-5 py-4 gap-4">
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">Other/Legacy</span>
                            <p className="text-sm font-black text-slate-500">{tierBreakdown['unknown']} vendors</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Retention & Churn ──────────────────────────────────────────── */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold px-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Retention & Churn
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Retention Rate', value: `${retentionRate}%`, icon: BadgeCheck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-100 dark:border-green-900/20', desc: 'Vendors still active' },
                        { label: 'Trial → Paid', value: `${trialConversion}%`, icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-900/20', desc: 'Of trials converted' },
                        { label: 'Churned', value: churnCount.toString(), icon: AlertTriangle, color: churnCount > 0 ? 'text-red-600' : 'text-green-600', bg: churnCount > 0 ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10', border: churnCount > 0 ? 'border-red-100 dark:border-red-900/20' : 'border-green-100 dark:border-green-900/20', desc: 'Cancelled or expired' },
                    ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className={`p-5 rounded-3xl border ${item.border} ${item.bg}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <item.icon className={`w-4 h-4 ${item.color}`} />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            </div>
                            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── Feb–Dec 2026 Forecast ──────────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-pink-500" /> Feb–Dec 2026 Forecast
                    </h2>
                    <button
                        onClick={() => setIsAnalysisModalOpen(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                        View Detailed Roadmap
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Vendors by Dec', value: '~950', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
                        { label: 'WRR by Dec', value: '₦1.1M/wk', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
                        { label: '2026 Revenue', value: '~₦28M', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/10' },
                        { label: 'Break-Even', value: 'Jun 2026', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                    ].map((s, i) => (
                        <div key={i} className={`p-4 rounded-2xl ${s.bg} flex flex-col gap-1`}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Bar chart */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Vendors by Month (Projection)</p>
                    <div className="flex items-end gap-1.5 h-28">
                        {monthlyProjections.map((m, i) => {
                            const h = Math.max((m.vendors / maxProjectionVendors) * 100, m.vendors === 0 ? 2 : 4);
                            const isLast = i === monthlyProjections.length - 1;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: i * 0.06, duration: 0.6, ease: 'easeOut' }}
                                        className={`w-full rounded-md ${m.vendors === 0 ? 'bg-slate-200 dark:bg-slate-700' : isLast ? 'bg-gradient-to-t from-indigo-600 to-purple-500' : 'bg-indigo-400'}`}
                                        title={`${m.month}: ${m.vendors} vendors`}
                                    />
                                    <span className="text-[7px] font-bold text-slate-400 text-center leading-tight">{m.month}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Notes table */}
                    <div className="mt-5 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Growth Drivers</p>
                        {[
                            { period: 'Mar–May', driver: 'DM outreach (food, fashion, beauty) — Kano/Bauchi. 5–15 vendors/wk.' },
                            { period: 'Jun–Jul', driver: 'Influencer Trojan Horse + referral compounding. Kano 100 target hit.' },
                            { period: 'Aug–Sep', driver: 'Phase 3 begins: light Meta ads. Field agents in 2 cities.' },
                            { period: 'Oct–Dec', driver: 'Word-of-mouth established. Lagos/Abuja onboarding. 950 vendors year-end.' },
                        ].map((row, i) => (
                            <div key={i} className="flex gap-3 text-xs">
                                <span className="font-black text-indigo-500 w-16 flex-shrink-0">{row.period}</span>
                                <span className="text-slate-500">{row.driver}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Market Estimation ─────────────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-purple-500/5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Market Estimation</h3>
                        <p className="text-xs text-slate-500">Nigerian MSME — Fashion, Food & Beauty Focus</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Total MSMEs (NG)</p>
                        <p className="text-2xl font-black">39.7M</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Social Commerce</p>
                        <p className="text-2xl font-black">$2.04B</p>
                        <p className="text-[10px] text-slate-400 font-bold">2025 Projection</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Fashion & Thrift', percent: '45%', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20' },
                        { label: 'Beauty & Skincare', percent: '20%', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/20' },
                        { label: 'Food & Restaurant', percent: '15%', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' },
                        { label: 'General Retail', percent: '12%', color: 'bg-blue-100 text-blue-600 dark:bg-blue-100 text-blue-600 dark:bg-blue-900/20' },
                        { label: 'Livestock & Ag', percent: '8%', color: 'bg-green-100 text-green-600 dark:bg-green-900/20' },
                    ].map((niche, i) => (
                        <div key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight ${niche.color}`}>
                            {niche.label} ({niche.percent})
                        </div>
                    ))}
                </div>

                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Fashion & thrift is Nigeria's #1 social commerce niche. Beauty/skincare is the fastest-growing. Combined, fashion + beauty = 65% of your TAM and respond best to Instagram DM outreach. Food vendors have the highest conversion rate from DM because a demo store is instantly compelling.
                </p>
            </section>

            <GrowthAnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
            />
        </div>
    );
}
