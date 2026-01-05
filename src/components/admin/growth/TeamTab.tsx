'use client';

import { motion } from 'framer-motion';
import {
    Briefcase,
    Users,
    DollarSign,
    TrendingUp,
    ChevronRight,
    CheckCircle2,
    Clock
} from 'lucide-react';

const hiringPlan = [
    {
        role: 'Customer Success Lead',
        milestone: '500 Vendors',
        salary: '₦150,000 - ₦250,000',
        description: 'Manage vendor onboarding, support, and retention. Must be fluent in Hausa & English.',
        tasks: ['Onboarding guidance', 'Issue resolution', 'Vendor feedback loop'],
        status: 'upcoming'
    },
    {
        role: 'Junior Full-Stack Developer',
        milestone: '1,000 Vendors',
        salary: '₦200,000 - ₦350,000',
        description: 'Assist with feature development, bug fixes, and platform maintenance.',
        tasks: ['Feature implementation', 'Bug squashing', 'API integrations'],
        status: 'upcoming'
    },
    {
        role: 'Growth & Marketing Lead',
        milestone: '2,500 Vendors',
        salary: '₦300,000 - ₦500,000 + Bonus',
        description: 'Drive national acquisition through paid ads and strategic partnerships.',
        tasks: ['Ad campaign management', 'Influencer partnerships', 'Regional expansion'],
        status: 'upcoming'
    }
];

export default function TeamTab() {
    return (
        <div className="space-y-8">
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
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Users className="w-24 h-24" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{job.role}</h3>
                                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">
                                                {job.milestone}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Triggered at {job.milestone}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Monthly Est.</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{job.salary}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed max-w-2xl">
                                    {job.description}
                                </p>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Responsibilities</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.tasks.map((task, j) => (
                                            <span key={j} className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-medium text-slate-600 dark:text-slate-300">
                                                <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                                                {task}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Culture & Ops --- */}
            <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6" /> Scaling the Team
                    </h2>
                    <p className="text-indigo-100 text-sm leading-relaxed mb-6 max-w-xl">
                        Our hiring strategy is strictly milestone-based. We only hire when the revenue from current vendors covers the new role's salary 3x over. This ensures sustainable, profitable growth.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                            <p className="text-[10px] font-bold uppercase text-indigo-200 mb-1">Hausa Fluency</p>
                            <p className="text-xs">Required for all CS roles to serve the Northern market effectively.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                            <p className="text-[10px] font-bold uppercase text-indigo-200 mb-1">Remote-First</p>
                            <p className="text-xs">All roles are remote, with physical syncs in Bauchi/Kano quarterly.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                            <p className="text-[10px] font-bold uppercase text-indigo-200 mb-1">Equity Pool</p>
                            <p className="text-xs">0.5% - 1% equity pool for first 5 key hires to ensure alignment.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
