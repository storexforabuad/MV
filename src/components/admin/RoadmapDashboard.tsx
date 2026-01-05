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
    ShieldCheck,
    Settings2,
    X,
    Plus,
    Minus,
    Info,
    Bell,
    BellOff,
    Smartphone,
    MessageSquare,
    MessageCircle,
    Coffee,
    Calendar,
    Clock,
    PhoneCall,
    BarChart3,
    PieChart,
    DollarSign,
    LineChart,
    Coins,
    Compass,
    Map,
    TrendingDown,
    Home
} from 'lucide-react';
import { Naira } from '@/components/common/Naira';
import { getFirestore, collection, onSnapshot, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';
import Link from 'next/link';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import NigeriaMap from '@/components/admin/NigeriaMap';

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
            { time: '13:00 - 16:00', task: 'Hiring & Team Sync', icon: Users },
            { time: '16:00 - 17:00', task: 'Partnership Outreach', icon: Globe }
        ]
    },
    national: {
        title: 'Phase 4: National Scale',
        tasks: [
            { time: '09:00 - 11:00', task: 'Field Agent Sync (5 Cities)', icon: Users },
            { time: '13:00 - 16:00', task: 'Strategy & Churn Analysis', icon: Target },
            { time: '16:00 - 17:00', task: 'Global Marketplace Ops', icon: Globe }
        ]
    }
};

export default function RoadmapDashboard() {
    const [activeMilestone, setActiveMilestone] = useState<string>('pilot');
    const [currentVendors, setCurrentVendors] = useState(0);
    const [currentMRR, setCurrentMRR] = useState(0);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [manualBoost, setManualBoost] = useState(0);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [activeAnalysisTab, setActiveAnalysisTab] = useState<'profitability' | 'launch' | 'revenue' | 'market'>('profitability');
    const { isInstallAvailable, handleInstall } = useInstallPrompt();

    const db = getFirestore(firebaseApp);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }

        const storesRef = collection(db, 'stores');
        const payingQuery = query(storesRef, where('subscriptionStatus', '==', 'active'));

        const unsubscribe = onSnapshot(payingQuery, (snapshot) => {
            const realPayingCount = snapshot.size;

            const configRef = doc(db, 'admin', 'roadmap');
            getDoc(configRef).then((docSnap) => {
                const boost = docSnap.exists() ? (docSnap.data().manualBoost || 0) : 0;
                setManualBoost(boost);
                setCurrentVendors(realPayingCount + boost);
                setCurrentMRR((realPayingCount + boost) * 5000);
                setLoading(false);
            });
        });

        return () => unsubscribe();
    }, [db]);

    const requestNotificationPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            alert('This browser does not support desktop notification');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setNotificationsEnabled(true);
            alert('Notifications enabled! You will receive alerts for major milestones.');
        }
    };

    const sendTestNotification = async () => {
        if (!notificationsEnabled) {
            alert('Please enable notifications first.');
            return;
        }

        if (typeof window !== 'undefined' && 'Notification' in window) {
            new Notification('2026 Roadmap', {
                body: 'Test notification successful! You are on your way to 10,000 vendors.',
                icon: '/icon-192x192.png'
            });
        }
    };

    const handleUpdateBoost = async (newBoost: number) => {
        try {
            const configRef = doc(db, 'admin', 'roadmap');
            await setDoc(configRef, { manualBoost: newBoost }, { merge: true });
            setManualBoost(newBoost);
            setIsUpdateModalOpen(false);
        } catch (error) {
            console.error("Error updating boost:", error);
            alert("Failed to update progress.");
        }
    };

    const totalTargetVendors = 10000;
    const progressPercentage = (currentVendors / totalTargetVendors) * 100;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* --- Header --- */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent truncate">
                            2026 Scaling Roadmap
                        </h1>
                        <p className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Path to 10,000 Vendors</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={notificationsEnabled ? sendTestNotification : requestNotificationPermission}
                                className={`p-2 rounded-xl transition-all active:scale-95 ${notificationsEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                title={notificationsEnabled ? "Send Test Notification" : "Enable Milestone Alerts"}
                            >
                                {notificationsEnabled ? <Bell className="w-5 h-5 sm:w-6 h-6" /> : <BellOff className="w-5 h-5 sm:w-6 h-6" />}
                            </button>
                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 hidden sm:block">Alerts</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Link href="/devteam/roadmap/strategy" className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95">
                                <Settings2 className="w-5 h-5 sm:w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </Link>
                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 hidden sm:block">Strategy</span>
                        </div>
                        {isInstallAvailable && (
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={handleInstall}
                                    className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all active:scale-95 border border-purple-200 dark:border-purple-800"
                                >
                                    <Smartphone className="w-5 h-5 sm:w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </button>
                                <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 hidden sm:block">Install</span>
                            </div>
                        )}
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
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Paying Vendors</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{currentVendors.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Paying MRR</p>
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

                {/* --- Regional Expansion Heatmap --- */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold px-2 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-500" /> Regional Expansion
                    </h2>
                    <NigeriaMap />
                </section>

                {/* --- Strategic Analysis --- */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold">Strategic Analysis</h2>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                            {[
                                { id: 'profitability', icon: PieChart },
                                { id: 'launch', icon: Rocket },
                                { id: 'revenue', icon: TrendingUp },
                                { id: 'market', icon: Target }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveAnalysisTab(tab.id as any)}
                                    className={`p-2 rounded-lg transition-all ${activeAnalysisTab === tab.id
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeAnalysisTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800"
                        >
                            {activeAnalysisTab === 'profitability' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                            <PieChart className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Profitability Analysis</h3>
                                            <p className="text-xs text-slate-500">Revenue vs. Operational Costs</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Monthly Revenue (10k Vendors)</p>
                                            <p className="text-2xl font-black text-green-600 flex items-center"><Naira />50,000,000</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Net Monthly Profit</p>
                                            <p className="text-2xl font-black text-indigo-600 flex items-center"><Naira />32,050,000</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Cost Breakdown</p>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Marketing (CAC)', amount: '10,000,000', percent: '20%', icon: Rocket, color: 'text-orange-500' },
                                                { label: 'Operations', amount: '5,000,000', percent: '10%', icon: Users, color: 'text-blue-500' },
                                                { label: 'Payment Fees', amount: '1,750,000', percent: '3.5%', icon: Coins, color: 'text-yellow-500' },
                                                { label: 'Infrastructure', amount: '1,200,000', percent: '2.4%', icon: Globe, color: 'text-purple-500' }
                                            ].map((cost, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-3">
                                                        <cost.icon className={`w-4 h-4 ${cost.color}`} />
                                                        <span className="text-sm font-medium">{cost.label}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold flex items-center justify-end"><Naira />{cost.amount}</p>
                                                        <p className="text-[10px] text-slate-400">{cost.percent} of revenue</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Profit Margin: 64.1%</p>
                                        </div>
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                            Exceptional SaaS margins. You only need ~3,600 vendors to cover all monthly costs. Reinvest profit into the Global Marketplace.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeAnalysisTab === 'launch' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                            <Rocket className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">"Zero Naira" Launch Strategy</h3>
                                            <p className="text-xs text-slate-500">Lean Operations & Manual Outreach</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                                <Compass className="w-4 h-4 text-indigo-500" /> The "Hunt & DM" Tactic
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">1</div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300">Search hashtags like #KanoFoodies or #LagosFashion on Instagram.</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">2</div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300">Find vendors with 500-5k followers (big enough for orders, small enough for manual DMs).</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">3</div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300">Pitch the "WhatsApp Order Manager" to solve their DM chaos.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                                            <h4 className="text-sm font-bold mb-2 text-orange-700 dark:text-orange-400">The "Claim Your Store" Hook</h4>
                                            <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                                                Pre-build a demo store with 3 of their products. Send it between 10:00 AM - 11:30 AM (before the lunch rush). "Claiming" is easier than "Signing up".
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                                                <p className="text-[10px] text-yellow-600 dark:text-yellow-400 uppercase font-bold mb-1 flex items-center gap-1">
                                                    <Home className="w-3 h-3" /> Home Base
                                                </p>
                                                <p className="text-xs font-bold">Bauchi City</p>
                                                <p className="text-[10px] text-slate-500">Physical Lab @ ATBU</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Remote Pilot</p>
                                                <p className="text-xs font-bold">Kano State</p>
                                                <p className="text-[10px] text-slate-500">Sabon Gari / Hotoro</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeAnalysisTab === 'revenue' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                            <LineChart className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Revenue Projections</h3>
                                            <p className="text-xs text-slate-500">₦5,000/mo Subscription Model</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                                            <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1">Conservative (10k Vendors)</p>
                                            <p className="text-2xl font-black flex items-center"><Naira />50,000,000 <span className="text-xs font-normal ml-2 text-indigo-200">MRR</span></p>
                                            <p className="text-xs text-indigo-100 mt-1">₦600M Annual Revenue</p>
                                        </div>
                                        <div className="p-4 bg-slate-800 rounded-2xl text-white shadow-lg shadow-slate-500/20">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Aggressive (50k Vendors)</p>
                                            <p className="text-2xl font-black flex items-center"><Naira />250,000,000 <span className="text-xs font-normal ml-2 text-slate-400">MRR</span></p>
                                            <p className="text-xs text-slate-400 mt-1">₦3B Annual Revenue</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">City-Level MRR (10k Target)</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {[
                                                { city: 'Lagos', vendors: '2,700', mrr: '13.5M' },
                                                { city: 'Port Harcourt', vendors: '2,500', mrr: '12.5M' },
                                                { city: 'Kano', vendors: '2,300', mrr: '11.5M' },
                                                { city: 'Abuja', vendors: '1,400', mrr: '7.0M' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div>
                                                        <p className="text-sm font-bold">{item.city}</p>
                                                        <p className="text-[10px] text-slate-400">{item.vendors} vendors</p>
                                                    </div>
                                                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">₦{item.mrr}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Upsell Potential</h4>
                                        <div className="flex justify-between text-xs">
                                            <span>Transaction Fees (₦200/order)</span>
                                            <span className="font-bold">+₦10M MRR</span>
                                        </div>
                                        <div className="flex justify-between text-xs mt-1">
                                            <span>Premium Tiers (₦15k/mo)</span>
                                            <span className="font-bold">+₦20M MRR</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeAnalysisTab === 'market' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                            <Target className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Market Estimation</h3>
                                            <p className="text-xs text-slate-500">Nigerian MSME Landscape</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total MSMEs</p>
                                            <p className="text-2xl font-black">39.7M</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Social Commerce</p>
                                            <p className="text-2xl font-black">$2.04B</p>
                                            <p className="text-[10px] text-slate-400">2025 Projection</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">The "WhatsApp Economy"</p>
                                        <div className="relative h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center px-4">
                                            <div className="absolute top-0 left-0 h-full bg-green-500/20 w-[67%]" />
                                            <p className="relative z-10 text-xs font-medium">
                                                <span className="font-black text-green-600">67%</span> of Nigerian online purchases start on WhatsApp.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Niches</p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: 'Fashion & Beauty', percent: '45%', color: 'bg-pink-100 text-pink-600' },
                                                { label: 'General Retail', percent: '25%', color: 'bg-blue-100 text-blue-600' },
                                                { label: 'Food & Restaurant', percent: '15%', color: 'bg-orange-100 text-orange-600' },
                                                { label: 'Livestock & Ag', percent: '10%', color: 'bg-green-100 text-green-600' }
                                            ].map((niche, i) => (
                                                <div key={i} className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${niche.color}`}>
                                                    {niche.label} ({niche.percent})
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                        <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                                            <strong>Kano & Kaduna</strong> are goldmines for Livestock and Textile niches, which are underserved by Western e-commerce but thrive on WhatsApp.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
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
                    <button
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        Update Progress
                    </button>
                </div>
            </div>

            {/* --- Update Progress Modal --- */}
            <AnimatePresence>
                {isUpdateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUpdateModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Update Progress</h3>
                                <button onClick={() => setIsUpdateModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-indigo-500 mt-0.5" />
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                            Use "Manual Boost" to include paying vendors who are currently onboarding offline or via WhatsApp but not yet registered on the platform.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Manual Vendor Boost</label>
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => setManualBoost(Math.max(0, manualBoost - 1))}
                                            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <span className="text-2xl font-black">{manualBoost}</span>
                                        <button
                                            onClick={() => setManualBoost(manualBoost + 1)}
                                            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => handleUpdateBoost(manualBoost)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
