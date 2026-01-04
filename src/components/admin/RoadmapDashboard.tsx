'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Users,
    Target,
    Rocket,
    Zap,
    Globe,
    CheckCircle2,
    Circle,
    ChevronRight,
    ArrowUpRight,
    Award,
    ShieldCheck
} from 'lucide-react';
import { Naira } from '@/components/common/Naira';

interface Milestone {
    id: string;
    title: string;
    description: string;
    targetDate: string;
    targetVendors: number;
    targetMRR: number;
    status: 'completed' | 'current' | 'upcoming';
    icon: any;
    tasks: string[];
}

const milestones: Milestone[] = [
    {
        id: 'pilot',
        title: 'The Pilot Phase',
        description: 'Perfect the product with the first 10 vendors in Kano.',
        targetDate: 'Feb 2026',
        targetVendors: 10,
        targetMRR: 50000,
        status: 'current',
        icon: Rocket,
        tasks: [
            'Onboard 1st vendor (Kano Food)',
            'Fix initial UX bottlenecks',
            'Manual outreach in Kano markets',
            'Reach 10 active vendors'
        ]
    },
    {
        id: 'kano-100',
        title: 'The Kano 100',
        description: 'Prove the model works for a regional community.',
        targetDate: 'Apr 2026',
        targetVendors: 100,
        targetMRR: 500000,
        status: 'upcoming',
        icon: Target,
        tasks: [
            'Implement referral viral loop',
            'Small-scale Instagram DM outreach',
            'Optimize vendor onboarding flow',
            'Reach 100 active vendors'
        ]
    },
    {
        id: 'growth',
        title: 'The Growth Engine',
        description: 'Expand to Lagos & Abuja with paid acquisition.',
        targetDate: 'Jul 2026',
        targetVendors: 1000,
        targetMRR: 5000000,
        status: 'upcoming',
        icon: Zap,
        tasks: [
            'Launch Instagram/Meta ads',
            'Hire Customer Success Lead',
            'Hire Junior Developer',
            'Reach 1,000 active vendors'
        ]
    },
    {
        id: 'national',
        title: 'National Scale',
        description: 'Rapid acquisition across 5 major Nigerian cities.',
        targetDate: 'Dec 2026',
        targetVendors: 10000,
        targetMRR: 50000000,
        status: 'upcoming',
        icon: Globe,
        tasks: [
            'Deploy Field Agents in 5 cities',
            'Hire Growth & Ops Leads',
            'Launch Global Marketplace',
            'Reach 10,000 active vendors'
        ]
    }
];

export default function RoadmapDashboard() {
    const [activeMilestone, setActiveMilestone] = useState<string>('pilot');
    const [currentVendors] = useState(1); // Real data would come from Firestore
    const [currentMRR] = useState(5000);

    const totalTargetVendors = 10000;
    const progressPercentage = (currentVendors / totalTargetVendors) * 100;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* --- Header --- */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                            2026 Scaling Roadmap
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Path to 10,000 Vendors</p>
                    </div>
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
                {/* --- Global Progress --- */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-500" /> Overall Progress
                        </h2>
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                            {progressPercentage.toFixed(2)}% to Goal
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Current Vendors</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{currentVendors.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Current MRR</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white flex items-center justify-end">
                                <Naira />{currentMRR.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(2, progressPercentage)}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Launch</span>
                        <span>10k Target</span>
                    </div>
                </section>

                {/* --- Milestones Timeline --- */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold px-2">Milestones</h2>
                    <div className="space-y-4">
                        {milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.id}
                                layoutId={milestone.id}
                                onClick={() => setActiveMilestone(milestone.id)}
                                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${activeMilestone === milestone.id
                                        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-lg ring-1 ring-indigo-500/20'
                                        : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${milestone.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                                                    milestone.status === 'current' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' :
                                                        'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                }`}>
                                                <milestone.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{milestone.title}</h3>
                                                <p className="text-xs text-slate-500">{milestone.targetDate} • {milestone.targetVendors.toLocaleString()} Vendors</p>
                                            </div>
                                        </div>
                                        {milestone.status === 'completed' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : milestone.status === 'current' ? (
                                            <div className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                            </div>
                                        ) : null}
                                    </div>

                                    <AnimatePresence>
                                        {activeMilestone === milestone.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800"
                                            >
                                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                                    {milestone.description}
                                                </p>

                                                <div className="space-y-3">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key Tasks</p>
                                                    {milestone.tasks.map((task, i) => (
                                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                                                            <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                                            {task}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-8 grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Target MRR</p>
                                                        <p className="text-lg font-bold flex items-center"><Naira />{milestone.targetMRR.toLocaleString()}</p>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Target Vendors</p>
                                                        <p className="text-lg font-bold">{milestone.targetVendors.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* --- Hiring & Ops --- */}
                <section className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-400" /> Hiring Strategy
                        </h2>

                        <div className="space-y-4">
                            {[
                                { role: 'Customer Success', date: 'May 2026', trigger: '500 Vendors' },
                                { role: 'Junior Developer', date: 'July 2026', trigger: '1,000 Vendors' },
                                { role: 'Growth Lead', date: 'August 2026', trigger: 'Scalability' }
                            ].map((job, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div>
                                        <p className="font-bold text-sm">{job.role}</p>
                                        <p className="text-xs text-indigo-300">{job.trigger}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-white/60">{job.date}</p>
                                        <ChevronRight className="w-4 h-4 text-white/20 inline-block" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* --- Bottom Action Bar --- */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-40">
                <div className="max-w-5xl mx-auto">
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        Update Progress
                    </button>
                </div>
            </div>
        </div>
    );
}
