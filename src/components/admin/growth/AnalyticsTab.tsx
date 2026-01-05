'use client';

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
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { Naira } from '@/components/common/Naira';

export default function AnalyticsTab({ currentVendors, currentMRR }: { currentVendors: number, currentMRR: number }) {
    return (
        <div className="space-y-8">
            {/* --- Profitability Analysis --- */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Profitability Analysis</h3>
                        <p className="text-xs text-slate-500">Revenue vs. Operational Costs</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Monthly Revenue (10k Goal)</p>
                        <p className="text-3xl font-black text-green-600 flex items-center"><Naira />50,000,000</p>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Net Monthly Profit</p>
                        <p className="text-3xl font-black text-indigo-600 flex items-center"><Naira />32,050,000</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Monthly Cost Breakdown</p>
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

                <div className="mt-8 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">Profit Margin: 64.1%</p>
                    </div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        Exceptional SaaS margins. You only need ~3,600 vendors to cover all monthly costs. Reinvest profit into the Global Marketplace.
                    </p>
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
                        <p className="text-3xl font-black flex items-center"><Naira />50,000,000 <span className="text-xs font-normal ml-2 text-indigo-200">MRR</span></p>
                        <p className="text-sm text-indigo-100 mt-2 font-medium">₦600M Annual Revenue</p>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Rocket className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Aggressive (50k Vendors)</p>
                        <p className="text-3xl font-black flex items-center"><Naira />250,000,000 <span className="text-xs font-normal ml-2 text-slate-400">MRR</span></p>
                        <p className="text-sm text-slate-400 mt-2 font-medium">₦3B Annual Revenue</p>
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
