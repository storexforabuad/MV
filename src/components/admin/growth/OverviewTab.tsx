'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket,
    Target,
    Zap,
    Globe,
    CheckCircle2,
    Circle,
    ArrowUpRight,
    ChevronRight,
    Clock,
    Smartphone,
    MessageSquare,
    MessageCircle,
    PhoneCall,
    Coffee,
    Calendar,
    TrendingUp,
    AlertTriangle,
    X,
    Flame,
    Users,
    BadgeCheck
} from 'lucide-react';
import NigeriaMap from '@/components/admin/NigeriaMap';
import { Naira } from '@/components/common/Naira';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';

interface Milestone {
    id: string;
    title: string;
    description: string;
    targetDate: string;
    targetVendors: number;
    targetWeeklyRR: number;
    targetDateObj: Date;
    status: 'completed' | 'current' | 'upcoming';
    icon: any;
    tasks: string[];
    doThisNow: string;
}

const milestones: Milestone[] = [
    {
        id: 'pilot',
        title: 'The Pilot Phase',
        description: 'Perfect the product with the first 10 vendors in Kano.',
        targetDate: 'Feb 2026',
        targetDateObj: new Date('2026-02-28'),
        targetVendors: 10,
        targetWeeklyRR: 11750,
        status: 'current',
        icon: Rocket,
        tasks: [
            'Onboard 1st vendor (Food/Fashion)',
            'Fix initial UX bottlenecks',
            'Manual outreach in Kano markets',
            'Reach 10 active vendors'
        ],
        doThisNow: 'Send 20 DMs to Food and Fashion vendors in Kano via Instagram today.'
    },
    {
        id: 'kano-100',
        title: 'The Kano 100',
        description: 'Prove the model works for a regional community.',
        targetDate: 'Apr 2026',
        targetDateObj: new Date('2026-04-30'),
        targetVendors: 100,
        targetWeeklyRR: 117500,
        status: 'upcoming',
        icon: Target,
        tasks: [
            'Implement referral viral loop',
            'Expand focus to Beauty & Beauty hubs',
            'Optimize vendor onboarding flow',
            'Reach 100 active vendors'
        ],
        doThisNow: 'Call your top 3 current vendors (Food/Fashion) and ask for 2 referrals each.'
    },
    {
        id: 'growth',
        title: 'The Growth Engine',
        description: 'Expand to Lagos & Abuja with paid acquisition.',
        targetDate: 'Jul 2026',
        targetDateObj: new Date('2026-07-31'),
        targetVendors: 1000,
        targetWeeklyRR: 1175000,
        status: 'upcoming',
        icon: Zap,
        tasks: [
            'Launch Instagram/Meta ads',
            'Hire Customer Success Lead',
            'Hire Junior Developer',
            'Reach 1,000 active vendors'
        ],
        doThisNow: 'Review ad creative performance and increase budget on the best-performing ad by 20%.'
    },
    {
        id: 'national',
        title: 'National Scale',
        description: 'Rapid acquisition across 5 major Nigerian cities.',
        targetDate: 'Dec 2026',
        targetDateObj: new Date('2026-12-31'),
        targetVendors: 10000,
        targetWeeklyRR: 50000000,
        status: 'upcoming',
        icon: Globe,
        tasks: [
            'Deploy Field Agents in 5 cities',
            'Hire Growth & Ops Leads',
            'Launch Global Marketplace',
            'Reach 10,000 active vendors'
        ],
        doThisNow: 'Sync with all 5 city field agents and review weekly acquisition numbers.'
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

// Real vendor acquisition data — update manually each week
// Excludes test stores and free-for-life accounts (mum-mupeeder, mum-akhi)
const weeklyMomentum = [
    { week: 'W1 Jan', vendors: 0 },
    { week: 'W2 Jan', vendors: 0 },
    { week: 'W3 Jan', vendors: 0 },
    { week: 'W4 Jan', vendors: 0 },
    { week: 'W1 Feb', vendors: 0 },
    { week: 'W2 Feb', vendors: 0 },
    { week: 'W3 Feb', vendors: 1 }, // supermom-ng signed up
    { week: 'W4 Feb', vendors: 0 },
];
const maxVendors = Math.max(...weeklyMomentum.map(w => w.vendors), 1);

export default function OverviewTab({ currentVendors, currentWeeklyRR }: { currentVendors: number; currentWeeklyRR: number }) {
    const [activeMilestone, setActiveMilestone] = useState<string>('pilot');
    const [churnCount, setChurnCount] = useState(0);
    const [showChurnAlert, setShowChurnAlert] = useState(false);

    // Fetch churn data
    useEffect(() => {
        // RESET: Force 0 for clean start
        setChurnCount(0);
        setShowChurnAlert(false);
    }, []);

    const activeMilestoneData = milestones.find(m => m.id === activeMilestone);
    const nextMilestone = milestones.find(m => m.status === 'current') || milestones[0];
    const vendorGap = nextMilestone.targetVendors - currentVendors;
    const daysToTarget = Math.max(0, Math.ceil((nextMilestone.targetDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const kpiCards = [
        { label: 'Active Vendors', value: currentVendors.toLocaleString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-900/30' },
        { label: 'Current WeeklyRR', value: null, naira: currentWeeklyRR, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-900/30' },
        { label: 'Gap to Milestone', value: `${vendorGap} vendors`, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-900/30' },
        { label: 'Days to Target', value: `${daysToTarget}d`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-900/30' },
    ];

    return (
        <div className="space-y-8">
            {/* --- Churn Alert Banner --- */}
            <AnimatePresence>
                {showChurnAlert && churnCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-2xl px-4 py-3"
                    >
                        <div className="flex items-center gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-red-700 dark:text-red-300">
                                {churnCount} vendor{churnCount > 1 ? 's' : ''} churned — follow up now to win them back.
                            </p>
                        </div>
                        <button onClick={() => setShowChurnAlert(false)} className="text-red-400 hover:text-red-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- KPI Summary Cards --- */}
            <section className="grid grid-cols-2 gap-3">
                {kpiCards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`p-4 rounded-2xl border ${card.border} ${card.bg} flex flex-col gap-2`}
                    >
                        <div className={`w-8 h-8 rounded-xl bg-white dark:bg-slate-800/60 flex items-center justify-center ${card.color} shadow-sm`}>
                            <card.icon className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{card.label}</p>
                        {card.naira !== undefined ? (
                            <p className={`text-lg font-black ${card.color} flex items-center leading-none`}>
                                <Naira />{card.naira.toLocaleString()}
                            </p>
                        ) : (
                            <p className={`text-lg font-black ${card.color} leading-none`}>{card.value}</p>
                        )}
                    </motion.div>
                ))}
            </section>

            {/* --- Weekly Momentum Tracker --- */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-base font-bold flex items-center gap-2 mb-5">
                    <Flame className="w-5 h-5 text-orange-500" /> Weekly Momentum
                </h2>
                <div className="flex items-end gap-2 h-24">
                    {weeklyMomentum.map((w, i) => {
                        const height = Math.max((w.vendors / maxVendors) * 100, 4);
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{w.vendors}</span>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                                    className={`w-full rounded-lg ${i === weeklyMomentum.length - 1 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                />
                                <span className="text-[8px] font-bold text-slate-400 text-center leading-tight">{w.week}</span>
                            </div>
                        );
                    })}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">New vendors per week</p>
            </section>

            {/* --- Daily Routine --- */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calendar className="w-24 h-24" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" /> Daily Scaling Habits
                        </h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {new Date().toLocaleDateString('en-NG', { weekday: 'long' })}
                        </span>
                    </div>

                    {/* "Do This Now" Action Card */}
                    {activeMilestoneData && new Date().getDay() !== 0 && (
                        <div className="mb-5 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white flex items-start gap-3 shadow-lg shadow-indigo-500/20">
                            <BadgeCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">🎯 Do This Now</p>
                                <p className="text-sm font-semibold leading-snug">{activeMilestoneData.doThisNow}</p>
                            </div>
                        </div>
                    )}

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
                        <div className="space-y-3">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
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
                    {milestones.map((milestone) => (
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
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                                                {milestone.description}
                                            </p>

                                            <div className="grid grid-cols-2 gap-3 mb-5">
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target WRR</p>
                                                    <p className="text-sm font-black text-indigo-600 flex items-center mt-0.5"><Naira />{milestone.targetWeeklyRR.toLocaleString()}</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target Date</p>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{milestone.targetDate}</p>
                                                </div>
                                            </div>

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
