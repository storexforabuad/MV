'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket,
    Target,
    Zap,
    Globe,
    CheckCircle2,
    Circle,
    ArrowUpRight,
    Map as MapIcon,
    ChevronRight,
    Clock,
    Smartphone,
    MessageSquare,
    MessageCircle,
    PhoneCall,
    Coffee,
    Calendar
} from 'lucide-react';
import NigeriaMap from '@/components/admin/NigeriaMap';

interface Milestone {
    id: string;
    title: string;
    description: string;
    targetDate: string;
    targetVendors: number;
    targetWeeklyRR: number;
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
        targetWeeklyRR: 50000,
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
        targetWeeklyRR: 500000,
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
        targetWeeklyRR: 5000000,
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
        targetWeeklyRR: 50000000,
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

const dailyRoutines: Record<string, { title: string; tasks: { time: string; task: string; icon: any }[] }> = {
    pilot: {
        title: 'Phase 1: Remote Pilot',
        tasks: [
            { time: '09:00 - 12:00', task: 'Digital Outreach (20 DMs)', icon: Smartphone },
            { time: '13:00 - 15:00', task: 'Remote Onboarding (WhatsApp)', icon: MessageSquare },
            { time: '16:00 - 18:00', task: 'UX Feedback & Iteration', icon: MessageCircle }
        ]
    },
    'kano-100': {
        title: 'Phase 2: The Kano 100',
        tasks: [
            { time: '09:00 - 12:00', task: 'Instagram/WhatsApp Outreach', icon: Smartphone },
            { time: '14:00 - 17:00', task: 'Referral Loop Calls', icon: PhoneCall },
            { time: '15:00 - 17:00', task: 'Content Creation (Success Stories)', icon: Rocket }
        ]
    },
    growth: {
        title: 'Phase 3: Growth Engine',
        tasks: [
            { time: '09:00 - 11:00', task: 'Ads Management (Meta/IG)', icon: Zap },
            { time: '13:00 - 16:00', task: 'Hiring & Team Sync', icon: Globe },
            { time: '16:00 - 17:00', task: 'Partnership Outreach', icon: Globe }
        ]
    },
    national: {
        title: 'Phase 4: National Scale',
        tasks: [
            { time: '09:00 - 11:00', task: 'Field Agent Sync (5 Cities)', icon: Globe },
            { time: '13:00 - 16:00', task: 'Strategy & Churn Analysis', icon: Target },
            { time: '16:00 - 17:00', task: 'Global Marketplace Ops', icon: Globe }
        ]
    }
};

export default function OverviewTab({ currentVendors }: { currentVendors: number }) {
    const [activeMilestone, setActiveMilestone] = useState<string>('pilot');

    return (
        <div className="space-y-8">
            {/* --- Daily Routine --- */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calendar className="w-24 h-24" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" /> Daily Scaling Habits
                        </h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {new Date().toLocaleDateString('en-NG', { weekday: 'long' })}
                        </span>
                    </div>

                    {new Date().getDay() === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600">
                                <Coffee className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Rest & Recharge</h3>
                                <p className="text-sm text-slate-500">Sunday is for family and rest. No scaling today!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-4">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                                    Current Focus: {dailyRoutines[activeMilestone]?.title || 'Scaling'}
                                </p>
                            </div>
                            {dailyRoutines[activeMilestone]?.tasks.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-500 transition-colors">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{item.time}</p>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{item.task}</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* --- Milestones Timeline --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold px-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" /> Scaling Milestones
                </h2>
                <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                        <motion.div
                            key={milestone.id}
                            layoutId={milestone.id}
                            onClick={() => setActiveMilestone(milestone.id)}
                            className={`relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer ${activeMilestone === milestone.id
                                ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-lg ring-1 ring-indigo-500/20'
                                : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${milestone.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
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
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Regional Expansion Heatmap --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold px-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-500" /> Regional Expansion
                </h2>
                <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                    <NigeriaMap />
                </div>
            </section>
        </div>
    );
}
