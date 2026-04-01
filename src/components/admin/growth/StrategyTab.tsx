'use client';

import { motion } from 'framer-motion';
import {
    Megaphone,
    Instagram,
    MessageSquare,
    Home,
    MapPin,
    TrendingUp,
    Zap,
    Copy,
    Check,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Share2,
    ShieldCheck,
    Target
} from 'lucide-react';
import { useState, useEffect } from 'react';

const marketingPlaybook = [
    {
        channel: 'Influencer "Free Forever"',
        tactic: 'Provide 100% discount to high-traffic influencers. Their storefront becomes the "Trojan Horse" for customer conversion.',
        impact: 'Viral Scale',
        impactColor: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
        icon: Zap
    },
    {
        channel: 'Instagram "Hunt & DM"',
        tactic: 'Identify vendors (Food, Fashion, Beauty) with 1k-10k followers and offer a 14-day free trial.',
        impact: 'High Conversion',
        impactColor: 'text-green-600 bg-green-100 dark:bg-green-900/30',
        icon: Instagram
    },
    {
        channel: 'WhatsApp Viral Loop',
        tactic: 'Incentivize current vendors to refer others for a ₦1,000 bonus.',
        impact: 'Low Cost',
        impactColor: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        icon: MessageSquare
    },
    {
        channel: 'Field Agents (Markets)',
        tactic: 'Physical visits to Kantin Kwari (Fashion), Wunti/ATBU (General), and beauty hubs for on-the-spot setup.',
        impact: 'High Trust',
        impactColor: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
        icon: MapPin
    }
];

const contentCalendar = [
    { day: 'Mon', platform: 'Instagram', type: 'DM Outreach', action: 'Send 20 DMs to Food vendors', color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' },
    { day: 'Tue', platform: 'WhatsApp', type: 'Referral Call', action: 'Update referral status for Influencers', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { day: 'Wed', platform: 'Instagram', type: 'DM Outreach', action: 'Send 20 DMs to Fashion/Thrift vendors', color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' },
    { day: 'Thu', platform: 'WhatsApp', type: 'Follow-up', action: 'Follow up on all unanswered DMs', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { day: 'Fri', platform: 'Instagram', type: 'DM Outreach', action: 'Send 20 DMs to Beauty/Skincare vendors', color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' },
    { day: 'Sat', platform: 'WhatsApp', type: 'Content', action: 'Share "Fashion Saturday" vendor win on status', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { day: 'Sun', platform: 'Rest', type: 'Recharge', action: 'Identify next week\'s targets (Food & Fashion)', color: 'text-slate-500 bg-slate-50 dark:bg-slate-800/50' },
];

const objections = [
    {
        objection: '"I already use WhatsApp to take orders."',
        reply: 'That\'s exactly why you\'ll love this! Compass ?? works WITH WhatsApp — it organizes your orders into a professional catalogue, so customers can browse and order directly. You still receive all orders via WhatsApp. It just makes you look 10x more professional.'
    },
    {
        objection: '"It\'s too expensive."',
        reply: 'You pay less than ₦500/day — that\'s the cost of one cup of tea. Most vendors recover the cost with their very first order through the platform. And we have a 14-day free trial, no card needed.'
    },
    {
        objection: '"I\'m not tech-savvy."',
        reply: 'You don\'t need to be! We set it all up for you in under 10 minutes. All you do is share your link. I can even set it up right now while we\'re speaking.'
    },
    {
        objection: '"I don\'t have time for this."',
        reply: 'I understand — that\'s why we do all the setup. Once it\'s live, it actually saves you time by handling inquiries automatically. The first setup takes less time than posting a WhatsApp status.'
    },
    {
        objection: '"Let me think about it."',
        reply: 'Absolutely! I\'ll send you the demo link right now so you can see exactly how it would look for your business. If you love it, I can activate it in 10 minutes. Fair?'
    }
];

const FUNNEL_KEY = 'biz_funnel_tracker';

export default function StrategyTab() {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [openObjection, setOpenObjection] = useState<number | null>(null);
    const [funnel, setFunnel] = useState({ dms: 0, replies: 0, signups: 0 });
    const [storyTemplateCopied, setStoryTemplateCopied] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(FUNNEL_KEY);
        if (saved) setFunnel(JSON.parse(saved));
    }, []);

    const updateFunnel = (key: keyof typeof funnel, value: number) => {
        const next = { ...funnel, [key]: Math.max(0, value) };
        setFunnel(next);
        localStorage.setItem(FUNNEL_KEY, JSON.stringify(next));
    };

    const copyTemplate = (key: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const copyStory = () => {
        const story = `🎉 Exciting news!\n\n[Vendor Name]'s store just received its FIRST online order through Compass 🧭!\n\nCustomers can now browse their full catalogue and order directly via WhatsApp 👇\n🔗 [Store Link]\n\nIf you run a business and want a professional storefront like this, DM me — I'll set it up for you for FREE for 14 days!\n\n#NigerianBusiness #MSME #Kano #Nigeria`;
        navigator.clipboard.writeText(story);
        setStoryTemplateCopied(true);
        setTimeout(() => setStoryTemplateCopied(false), 2000);
    };

    const replyRate = funnel.dms > 0 ? ((funnel.replies / funnel.dms) * 100).toFixed(0) : '0';
    const conversionRate = funnel.replies > 0 ? ((funnel.signups / funnel.replies) * 100).toFixed(0) : '0';

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
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.impactColor}`}>
                                    {item.impact}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.tactic}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Content Calendar --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <CalendarDays className="w-5 h-5 text-indigo-500" /> Weekly Content Calendar
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {contentCalendar.map((day, i) => (
                        <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-black text-slate-500 uppercase">{day.day}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${day.color}`}>{day.platform}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{day.type}</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-snug">{day.action}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Objection Handlers --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <ShieldCheck className="w-5 h-5 text-green-500" /> Objection Handlers
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {objections.map((item, i) => (
                        <div key={i}>
                            <button
                                onClick={() => setOpenObjection(openObjection === i ? null : i)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors gap-3"
                            >
                                <p className="text-sm font-bold text-slate-800 dark:text-white italic">{item.objection}</p>
                                {openObjection === i ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                )}
                            </button>
                            {openObjection === i && (
                                <div className="px-5 pb-5">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">✓ Your Reply</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">"{item.reply}"</p>
                                        <button
                                            onClick={() => copyTemplate(`obj-${i}`, `"${item.reply}"`)}
                                            className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600 hover:text-green-700 transition-colors"
                                        >
                                            {copiedKey === `obj-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copiedKey === `obj-${i}` ? 'Copied!' : 'Copy Reply'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Outreach Templates --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <Zap className="w-5 h-5 text-yellow-500" /> Outreach Templates
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                    {/* Standard DM */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-pink-500" /> Standard DM (Pre-built Store)
                            </h3>
                            <button
                                onClick={() => copyTemplate('dm', "Hi [Vendor Name]! 🥘 I'm a huge fan of your food. I actually took the liberty of setting up a demo digital menu for you with some of your best dishes: [Link]. It handles WhatsApp orders and payments automatically. If you like it, you can claim it and start using it today! What do you think?")}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-all"
                            >
                                {copiedKey === 'dm' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedKey === 'dm' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                "Hi [Vendor Name]! 🥘 I'm a huge fan of your food. I actually took the liberty of setting up a **demo digital menu** for you with some of your best dishes: [Link]. It handles WhatsApp orders and payments automatically. If you like it, you can claim it and start using it today! What do you think?"
                            </p>
                        </div>
                    </div>

                    {/* Influencer Pitch */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" /> Influencer "Free Forever" Pitch
                            </h3>
                            <button
                                onClick={() => copyTemplate('influencer', "Hey [Name]! 🌟 I love your content. We've built a professional storefront platform called Compass 🧭 and we'd love to set you up with a Free Forever Max Account for your merch/products. It looks premium, handles all orders on WhatsApp, and your followers will love the experience. Check out this demo we made for you: [Link]. No strings attached – would you be interested?")}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-all"
                            >
                                {copiedKey === 'influencer' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedKey === 'influencer' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="relative bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                "Hey [Name]! 🌟 I love your content. We've built a professional storefront platform called Compass 🧭 and we'd love to set you up with a **Free Forever Max Account** for your merch/products. It looks premium, handles all orders on WhatsApp, and your followers will love the experience. Check out this demo we made for you: [Link]. No strings attached – would you be interested?"
                            </p>
                            <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                                VIRAL SCALE
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Success Story Template --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <Share2 className="w-5 h-5 text-blue-500" /> Success Story Template
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs text-slate-500 mb-4">Copy & paste when a vendor gets their first order. Share as an Instagram story or WhatsApp status for social proof.</p>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-4 font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {`🎉 Exciting news!

[Vendor Name]'s store just received its FIRST online order through Compass 🧭!

Customers can now browse their full catalogue and order directly via WhatsApp 👇
🔗 [Store Link]

If you run a business and want a professional storefront like this, DM me — I'll set it up for you for FREE for 14 days!

#Compass ?? #NigerianBusiness #MSME #Kano #Nigeria`}
                    </div>
                    <button
                        onClick={copyStory}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-2 rounded-lg transition-all"
                    >
                        {storyTemplateCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {storyTemplateCopied ? 'Copied!' : 'Copy Template'}
                    </button>
                </div>
            </section>

            {/* --- Conversion Funnel Tracker --- */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 px-2">
                    <Target className="w-5 h-5 text-red-500" /> Conversion Funnel Tracker
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs text-slate-500 mb-5">Track your outreach manually. Saved locally on this device.</p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {([
                            { key: 'dms', label: 'DMs Sent', color: 'text-indigo-600 border-indigo-200 dark:border-indigo-900/30' },
                            { key: 'replies', label: 'Replies', color: 'text-blue-600 border-blue-200 dark:border-blue-900/30' },
                            { key: 'signups', label: 'Sign-Ups', color: 'text-green-600 border-green-200 dark:border-green-900/30' },
                        ] as const).map(({ key, label, color }) => (
                            <div key={key} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border ${color} bg-slate-50 dark:bg-slate-800/50`}>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{label}</p>
                                <p className={`text-2xl font-black ${color.split(' ')[0]}`}>{funnel[key]}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateFunnel(key, funnel[key] - 1)}
                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 font-black text-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                                    >−</button>
                                    <button
                                        onClick={() => updateFunnel(key, funnel[key] + 1)}
                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 font-black text-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                                    >+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Reply Rate</p>
                            <p className="text-xl font-black text-blue-600">{replyRate}%</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Conversion</p>
                            <p className="text-xl font-black text-green-600">{conversionRate}%</p>
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
