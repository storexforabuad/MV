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
    DollarSign
} from 'lucide-react';
import { Naira } from '@/components/common/Naira';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';

const WEEKLY_COSTS = 17_950_000;
const AVG_PLAN_PRICE = 5000; // avg across Lite/Pro/Max

const TIER_CONFIG: Record<string, { label: string; price: number; color: string; bg: string }> = {
    lite: { label: 'Lite', price: 2500, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    pro: { label: 'Pro', price: 5000, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    max: { label: 'Max', price: 10000, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    unknown: { label: 'Other', price: 5000, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900' },
};

export default function AnalyticsTab({ currentVendors, currentWeeklyRR }: { currentVendors: number; currentWeeklyRR: number }) {
    const [tierBreakdown, setTierBreakdown] = useState<Record<string, number>>({});
    const [churnCount, setChurnCount] = useState(0);
    const [trialCount, setTrialCount] = useState(0);
    const [totalStores, setTotalStores] = useState(0);

    useEffect(() => {
        const db = getFirestore(firebaseApp);
        getDocs(collection(db, 'stores')).then(snap => {
            const breakdown: Record<string, number> = {};
            let churned = 0, trials = 0;
            snap.forEach(doc => {
                const data = doc.data();
                const tier = (data.subscriptionTier || 'unknown').toLowerCase();
                breakdown[tier] = (breakdown[tier] || 0) + 1;
                if (data.subscriptionStatus === 'cancelled' || data.subscriptionStatus === 'expired') churned++;
                if (data.subscriptionStatus === 'trial') trials++;
            });
            setTierBreakdown(breakdown);
            setChurnCount(churned);
            setTrialCount(trials);
            setTotalStores(snap.size);
        }).catch(() => { });
    }, []);

    const targetWeeklyRR = 50_000_000;
    const progressPct = Math.min((currentWeeklyRR / targetWeeklyRR) * 100, 100);
    const vendorsToBreakEven = Math.ceil(WEEKLY_COSTS / AVG_PLAN_PRICE);
    const breakEvenGap = Math.max(0, vendorsToBreakEven - currentVendors);
    const retentionRate = totalStores > 0 ? (((totalStores - churnCount) / totalStores) * 100).toFixed(1) : '—';
    const trialConversion = trialCount > 0 ? ((currentVendors / (currentVendors + trialCount)) * 100).toFixed(1) : '—';

    return (
        <div className="space-y-8">
            {/* --- Live WeeklyRR Progress --- */}
            <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Live Progress</p>
                    <h2 className="text-xl font-black mb-1 flex items-center">
                        <Naira />{currentWeeklyRR.toLocaleString()}
                        <span className="text-sm font-medium text-indigo-200 ml-2">/ week</span>
                    </h2>
                    <p className="text-xs text-indigo-200 mb-5">Target: ₦50,000,000 WeeklyRR</p>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(1.5, progressPct)}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-indigo-200 mt-2">
                        <span>{progressPct.toFixed(3)}% of goal</span>
                        <span>{currentVendors.toLocaleString()} active vendors</span>
                    </div>
                </div>
            </section>

            {/* --- Profitability Analysis --- */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Profitability Analysis</h3>
                        <p className="text-xs text-slate-500">Revenue vs. Operational Costs (10k Goal)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Weekly Revenue (10k Goal)</p>
                        <p className="text-3xl font-black text-green-600 flex items-center"><Naira />50,000,000</p>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Net Weekly Profit</p>
                        <p className="text-3xl font-black text-indigo-600 flex items-center"><Naira />32,050,000</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Weekly Cost Breakdown</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: 'Marketing (CAC)', amount: '10,000,000', percent: '20%', icon: Rocket, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                            { label: 'Operations', amount: '5,000,000', percent: '10%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                            { label: 'Payment Fees', amount: '1,750,000', percent: '3.5%', icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
                            { label: 'Infrastructure', amount: '1,200,000', percent: '2.4%', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' }
                        ].map((cost, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${cost.bg} ${cost.color}`}>
                                        <cost.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cost.label}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black flex items-center justify-end"><Naira />{cost.amount}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{cost.percent}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">Profit Margin: 64.1%</p>
                    </div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        Exceptional SaaS margins. You only need ~3,600 vendors to cover all weekly costs. Reinvest profit into the Global Marketplace.
                    </p>
                </div>
            </section>

            {/* --- Unit Economics --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold px-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> Unit Economics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'CAC', sublabel: 'Customer Acquisition Cost', value: '₦5,000', detail: 'Per vendor acquired via DM outreach', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-100 dark:border-red-900/20', icon: Target },
                        { label: 'LTV', sublabel: 'Lifetime Value (avg 10wks)', value: '₦50,000+', detail: 'Based on ₦5,000/week avg plan', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-100 dark:border-green-900/20', icon: BadgeCheck },
                        { label: 'LTV:CAC', sublabel: 'Ratio', value: '10:1', detail: 'Anything above 3:1 is excellent', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-100 dark:border-indigo-900/20', icon: Percent },
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
                            <p className={`text-2xl font-black ${item.color} mb-1`}>{item.value}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.sublabel}</p>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.detail}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Break-even Calculator --- */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold">Break-Even Calculator</h3>
                        <p className="text-xs text-slate-500">How many vendors to cover all weekly costs</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Weekly Costs</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white flex items-center justify-center"><Naira />17.9M</p>
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

            {/* --- Revenue by Tier --- */}
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
                    {tierBreakdown['unknown'] > 0 && (
                        <div className="flex items-center justify-between px-5 py-4 gap-4">
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">Other</span>
                            <p className="text-sm font-black text-slate-500">{tierBreakdown['unknown']} vendors</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- Retention & Churn --- */}
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
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-5 rounded-3xl border ${item.border} ${item.bg}`}
                        >
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

            {/* --- Revenue Projections --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold px-2 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-blue-500" /> Revenue Projections
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] text-indigo-200 uppercase font-black tracking-widest mb-1">Conservative (10k Vendors)</p>
                        <p className="text-3xl font-black flex items-center"><Naira />50,000,000 <span className="text-xs font-normal ml-2 text-indigo-200">WRR</span></p>
                        <p className="text-sm text-indigo-100 mt-2 font-medium">₦2.6B Annual Revenue</p>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Rocket className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Aggressive (50k Vendors)</p>
                        <p className="text-3xl font-black flex items-center"><Naira />250,000,000 <span className="text-xs font-normal ml-2 text-slate-400">WRR</span></p>
                        <p className="text-sm text-slate-400 mt-2 font-medium">₦13B Annual Revenue</p>
                    </div>
                </div>
            </section>

            {/* --- Market Estimation --- */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-purple-500/5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Market Estimation</h3>
                        <p className="text-xs text-slate-500">Nigerian MSME Landscape</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Total MSMEs</p>
                        <p className="text-2xl font-black">39.7M</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Social Commerce</p>
                        <p className="text-2xl font-black">$2.04B</p>
                        <p className="text-[10px] text-slate-400 font-bold">2025 Projection</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">The "WhatsApp Economy"</p>
                    <div className="relative h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center px-6">
                        <div className="absolute top-0 left-0 h-full bg-green-500/10 w-[67%]" />
                        <div className="absolute top-0 left-0 h-1 bg-green-500 w-[67%]" />
                        <p className="relative z-10 text-sm font-medium">
                            <span className="font-black text-green-600 text-lg">67%</span> of Nigerian online purchases start on WhatsApp.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Fashion & Beauty', percent: '45%', color: 'bg-pink-100 text-pink-600' },
                            { label: 'General Retail', percent: '25%', color: 'bg-blue-100 text-blue-600' },
                            { label: 'Food & Restaurant', percent: '15%', color: 'bg-orange-100 text-orange-600' },
                            { label: 'Livestock & Ag', percent: '10%', color: 'bg-green-100 text-green-600' }
                        ].map((niche, i) => (
                            <div key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight ${niche.color}`}>
                                {niche.label} ({niche.percent})
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
