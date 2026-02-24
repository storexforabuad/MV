'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    TrendingUp,
    Target,
    Zap,
    Users,
    Globe,
    Rocket,
    ShieldCheck,
    BadgeCheck,
    Coins,
    BarChart3,
    Gem,
    Stars
} from 'lucide-react';
import { Naira } from '@/components/common/Naira';

interface GrowthAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TIER_DATA = [
    { label: 'Lite', price: 500, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pro', price: 1000, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Max', price: 3500, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
];

const PROJECTIONS = [
    { month: 'Feb', vendors: 0, rr: 0, active: true },
    { month: 'Mar', vendors: 12, rr: 14100 },
    { month: 'Apr', vendors: 30, rr: 35250 },
    { month: 'May', vendors: 60, rr: 70500, highlight: 'Break-even' },
    { month: 'Jun', vendors: 110, rr: 129250 },
    { month: 'Jul', vendors: 180, rr: 211500 },
    { month: 'Aug', vendors: 300, rr: 352500 },
    { month: 'Sep', vendors: 450, rr: 528750 },
    { month: 'Oct', vendors: 650, rr: 763750 },
    { month: 'Nov', vendors: 800, rr: 940000 },
    { month: 'Dec', vendors: 950, rr: 1116250 },
];

export default function GrowthAnalysisModal({ isOpen, onClose }: GrowthAnalysisModalProps) {
    const modalVariants = {
        hidden: { opacity: 0, y: '100%' },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={modalVariants}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                >
                    {/* --- Header --- */}
                    <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                Growth Roadmap
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Analysis & Forecast: Feb – Dec 2026</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </header>

                    {/* --- Main Scrollable Content --- */}
                    <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 space-y-12 scrollbar-hide pb-32">

                        {/* --- Section 1: Unit Economics --- */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">1. Unit Economics Recalibrated</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {TIER_DATA.map((tier) => (
                                    <div key={tier.label} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${tier.bg} ${tier.color} mb-3`}>
                                            {tier.label}
                                        </span>
                                        <p className="text-2xl font-black dark:text-white mb-1"><Naira />{tier.price.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Per Week</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
                                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">The Metric that Matters</p>
                                        <h4 className="text-3xl font-black leading-tight">₦1,175 Average Weekly Plan</h4>
                                        <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
                                            Based on a weighted mix of 40% Lite, 45% Pro, and 15% Max subscribers.
                                            This creates a high-velocity recurring engine.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                                            <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Ops Cost</p>
                                            <p className="text-xl font-black">₦100k/wk</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                                            <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Break-even</p>
                                            <p className="text-xl font-black">86 Vendors</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* --- Section 2: Market Strategy --- */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-6 bg-purple-500 rounded-full" />
                                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">2. Market Segmentation (The Big 3)</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {[
                                    { label: 'Fashion & Thrift', pct: '45%', desc: 'Top social commerce niche. High volume, visually driven.', icon: Gem, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
                                    { label: 'Beauty & Skincare', pct: '20%', desc: 'Strong repurchasing. Influencer-heavy community.', icon: Stars, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                                    { label: 'Food & Restaurant', pct: '15%', desc: 'Highest DM conversion due to instant demo utility.', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
                                ].map((niche) => (
                                    <div key={niche.label} className="group p-6 rounded-3xl bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm">
                                        <div className={`w-12 h-12 rounded-2xl ${niche.bg} ${niche.color} flex items-center justify-center mb-4`}>
                                            <niche.icon size={24} />
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-black dark:text-white text-sm">{niche.label}</h5>
                                            <span className="text-xs font-black text-slate-400 group-hover:text-indigo-500">{niche.pct}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{niche.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* --- Section 3: Monthly Projection --- */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full" />
                                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">3. Feb – Dec 2026 Forecast</h3>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-x-auto no-scrollbar shadow-inner">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Month</th>
                                            <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendors</th>
                                            <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">WeeklyRR</th>
                                            <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {PROJECTIONS.map((p) => (
                                            <tr key={p.month} className={`${p.highlight ? 'bg-indigo-500/5' : ''}`}>
                                                <td className="py-4 text-xs font-black dark:text-white">{p.month}</td>
                                                <td className="py-4 text-xs font-bold text-slate-500">{p.vendors.toLocaleString()}</td>
                                                <td className="py-4 text-right text-xs font-black dark:text-white"><Naira />{p.rr.toLocaleString()}</td>
                                                <td className="py-4 text-right">
                                                    {p.active ? (
                                                        <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Current</span>
                                                    ) : p.highlight ? (
                                                        <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">Target</span>
                                                    ) : (
                                                        <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-400/10 px-2 py-1 rounded-full">Coming</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* --- Section 4: Operational Strategy --- */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-6 bg-green-500 rounded-full" />
                                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">4. Phase-based Execution</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { phase: 'Phase 1: Solo Grind (Now-Jun)', desc: 'Zero ad burn. 20 DMs/day. High-touch onboarding in Kano/Bauchi.', icon: Users },
                                    { phase: 'Phase 2: Optimize (Jun-Sep)', desc: 'Infra paid by revenue. Onboard Customer Success Lead. Compound referrals.', icon: Rocket },
                                    { phase: 'Phase 3: Scale (Sep-Dec)', desc: 'Deploy Meta Ads (Fashion & Beauty). CAC covered by 2 weeks sub.', icon: Globe }
                                ].map((row, i) => (
                                    <div key={i} className="flex gap-4 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 items-start shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                            <row.icon size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <h6 className="text-sm font-black dark:text-white">{row.phase}</h6>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{row.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </main>

                    {/* --- Footer --- */}
                    <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-800">
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
                        <div className="relative max-w-5xl mx-auto">
                            <motion.button
                                onClick={onClose}
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.98] uppercase tracking-widest text-sm"
                                whileTap={{ scale: 0.98 }}
                            >
                                Done
                            </motion.button>
                        </div>
                    </footer>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
