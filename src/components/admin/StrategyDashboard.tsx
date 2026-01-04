'use client';

import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Briefcase,
    Megaphone,
    ShieldAlert,
    ArrowRight,
    Users,
    DollarSign,
    TrendingUp,
    MapPin,
    Utensils,
    Instagram,
    MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { Naira } from '@/components/common/Naira';

const hiringPlan = [
    {
        role: 'Customer Success Lead',
        milestone: '500 Vendors',
        salary: '₦150,000 - ₦250,000',
        description: 'Manage vendor onboarding, support, and retention. Must be fluent in Hausa & English.',
        tasks: ['Onboarding guidance', 'Issue resolution', 'Vendor feedback loop']
    },
    {
        role: 'Junior Full-Stack Developer',
        milestone: '1,000 Vendors',
        salary: '₦200,000 - ₦350,000',
        description: 'Assist with feature development, bug fixes, and platform maintenance.',
        tasks: ['Feature implementation', 'Bug squashing', 'API integrations']
    },
    {
        role: 'Growth & Marketing Lead',
        milestone: '2,500 Vendors',
        salary: '₦300,000 - ₦500,000 + Bonus',
        description: 'Drive national acquisition through paid ads and strategic partnerships.',
        tasks: ['Ad campaign management', 'Influencer partnerships', 'Regional expansion']
    }
];

const marketingPlaybook = [
    {
        channel: 'Instagram "Hunt & DM"',
        tactic: 'Identify vendors with 1k-10k followers and offer a 14-day free trial.',
        impact: 'High Conversion'
    },
    {
        channel: 'WhatsApp Viral Loop',
        tactic: 'Incentivize current vendors to refer others for a ₦1,000 bonus.',
        impact: 'Low Cost'
    },
    {
        channel: 'Field Agents (Kano/Bauchi)',
        tactic: 'Physical visits to major markets (Kantin Kwari, Wunti) for on-the-spot setup.',
        impact: 'High Trust'
    }
];

export default function StrategyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
            {/* --- Header --- */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <Link href="/devteam/roadmap" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Strategy & Hiring</h1>
                        <p className="text-xs text-slate-500">The Scaling Playbook</p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
                {/* --- Hiring Roadmap --- */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                        <Briefcase className="w-5 h-5 text-indigo-500" /> Hiring Roadmap
                    </h2>
                    <div className="space-y-4">
                        {hiringPlan.map((job, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{job.role}</h3>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Trigger: {job.milestone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{job.salary}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Monthly Est.</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                    {job.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {job.tasks.map((task, j) => (
                                        <span key={j} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md font-medium">
                                            {task}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* --- Marketing Playbook --- */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                        <Megaphone className="w-5 h-5 text-pink-500" /> Marketing Playbook
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {marketingPlaybook.map((item, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-sm">{item.channel}</h3>
                                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-1 rounded-full font-bold">
                                        {item.impact}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {item.tactic}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- Food & Restaurant Playbook --- */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                        <Utensils className="w-5 h-5 text-orange-500" /> Food & Restaurant Playbook
                    </h2>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-pink-500" /> Instagram Outreach Template (Pre-built Store)
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                    "Hi [Vendor Name]! 🥘 I'm a huge fan of your food. I actually took the liberty of setting up a **demo digital menu** for you with some of your best dishes: [Link]. It handles WhatsApp orders and payments automatically. If you like it, you can claim it and start using it today! What do you think?"
                                </p>
                                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                                    HIGH CONVERSION
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20">
                                <p className="font-bold text-xs text-purple-700 dark:text-purple-400 mb-1 uppercase">The "Claim Your Store" Tactic</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Instead of asking for permission, show them the result. Spend 5 mins adding 3 of their top products. It makes the value immediate and undeniable.</p>
                            </div>
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                                <p className="font-bold text-xs text-orange-700 dark:text-orange-400 mb-1 uppercase">The "Lunch Hour" Tactic</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Send DMs between 10:00 AM - 11:30 AM when vendors are preparing for the lunch rush and feeling the "DM stress."</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Risk Management --- */}
                <section className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/20">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-700 dark:text-red-400">
                        <ShieldAlert className="w-5 h-5" /> Risk Management
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1 h-auto bg-red-200 dark:bg-red-800 rounded-full" />
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">Vendor Churn</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Mitigate by offering "Success Calls" for vendors with 0 sales in their first 14 days.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1 h-auto bg-red-200 dark:bg-red-800 rounded-full" />
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">Payment Failures</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Automate WhatsApp reminders 3 days before subscription expiry to ensure card funding.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
