'use client';

import { motion } from 'framer-motion';
import {
    Megaphone,
    Utensils,
    Instagram,
    MessageSquare,
    Home,
    MapPin,
    TrendingUp,
    Zap,
    Copy,
    Check
} from 'lucide-react';
import { useState } from 'react';

const marketingPlaybook = [
    {
        channel: 'Instagram "Hunt & DM"',
        tactic: 'Identify vendors with 1k-10k followers and offer a 14-day free trial.',
        impact: 'High Conversion',
        icon: Instagram
    },
    {
        channel: 'WhatsApp Viral Loop',
        tactic: 'Incentivize current vendors to refer others for a ₦1,000 bonus.',
        impact: 'Low Cost',
        icon: MessageSquare
    },
    {
        channel: 'Field Agents (Kano/Bauchi)',
        tactic: 'Physical visits to major markets (Kantin Kwari, Wunti, ATBU) for on-the-spot setup.',
        impact: 'High Trust',
        icon: MapPin
    }
];

export default function StrategyTab() {
    const [copied, setCopied] = useState(false);

    const copyTemplate = () => {
        const text = "Hi [Vendor Name]! 🥘 I'm a huge fan of your food. I actually took the liberty of setting up a demo digital menu for you with some of your best dishes: [Link]. It handles WhatsApp orders and payments automatically. If you like it, you can claim it and start using it today! What do you think?";
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            {/* --- Marketing Playbook --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <Megaphone className="w-5 h-5 text-pink-500" /> Marketing Playbook
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {marketingPlaybook.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-indigo-500/50 transition-all"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-500 transition-colors">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-sm">{item.channel}</h3>
                                </div>
                                <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-1 rounded-full font-bold">
                                    {item.impact}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {item.tactic}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Outreach Templates --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <Zap className="w-5 h-5 text-yellow-500" /> Outreach Templates
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-pink-500" /> Food Vendor DM (Pre-built Store)
                            </h3>
                            <button
                                onClick={copyTemplate}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-all"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied' : 'Copy Template'}
                            </button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                "Hi [Vendor Name]! 🥘 I'm a huge fan of your food. I actually took the liberty of setting up a **demo digital menu** for you with some of your best dishes: [Link]. It handles WhatsApp orders and payments automatically. If you like it, you can claim it and start using it today! What do you think?"
                            </p>
                            <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                                HIGH CONVERSION
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Bauchi Home Base Strategy --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <Home className="w-5 h-5 text-yellow-500" /> Bauchi Home Base
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-3xl p-5 border border-yellow-100 dark:border-yellow-900/20 shadow-sm">
                        <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                            <MapPin className="w-4 h-4" /> ATBU & Federal Poly Hub
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Use student areas as a "Physical Lab." Walk into snack shops and "Mama Puts" near campuses. Offer them a free digital menu in exchange for feedback.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-3xl p-5 border border-indigo-100 dark:border-indigo-900/20 shadow-sm">
                        <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                            <TrendingUp className="w-4 h-4" /> Yankari Tourism Pilot
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Target vendors serving tourists near Yankari Game Reserve. Digital menus solve the "price transparency" issue for visitors.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
