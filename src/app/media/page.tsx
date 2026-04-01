'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence, type Variants } from 'framer-motion';
import {
    Shield, Bell, Upload, Banknote, CheckCircle2, ChevronDown,
    Sparkles, ArrowRight, Lock, AlertCircle, Loader2, X, Check
} from 'lucide-react';
import Script from 'next/script';
import { saveMediaRegistration, validateDiscountCode, checkDuplicateEmail } from '@/app/actions/mediaRegistrationActions';

// ─── Nigerian Banks ────────────────────────────────────────────────────────────
const NIGERIAN_BANKS = [
    { name: 'Access Bank', code: '044' },
    { name: 'Citibank Nigeria', code: '023' },
    { name: 'Ecobank Nigeria', code: '050' },
    { name: 'Fidelity Bank', code: '070' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'First City Monument Bank', code: '214' },
    { name: 'Globus Bank', code: '00103' },
    { name: 'Guaranty Trust Bank', code: '058' },
    { name: 'Heritage Bank', code: '030' },
    { name: 'Keystone Bank', code: '082' },
    { name: 'Kuda Bank', code: '090267' },
    { name: 'Moniepoint Microfinance Bank', code: '090405' },
    { name: 'OPay', code: '999992' },
    { name: 'Paga', code: '100002' },
    { name: 'PalmPay', code: '999991' },
    { name: 'Polaris Bank', code: '076' },
    { name: 'Providus Bank', code: '101' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Standard Chartered Bank', code: '068' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'Suntrust Bank', code: '100' },
    { name: 'Titan Trust Bank', code: '102' },
    { name: 'Union Bank of Nigeria', code: '032' },
    { name: 'United Bank for Africa', code: '033' },
    { name: 'Unity Bank', code: '215' },
    { name: 'VFD Microfinance Bank', code: '090110' },
    { name: 'Wema Bank', code: '035' },
    { name: 'Zenith Bank', code: '057' },
];

// ─── Animation variants ────────────────────────────────────────────────────────
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const bubble: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Concentric Ring SVG ───────────────────────────────────────────────────────
function ConcentricRings({ className = '' }: { className?: string }) {
    return (
        <svg
            aria-hidden
            className={`pointer-events-none absolute ${className}`}
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {[60, 120, 180, 240, 300, 360, 420].map((r, i) => (
                <circle
                    key={r}
                    cx="300" cy="300" r={r}
                    stroke="currentColor"
                    strokeWidth="1"
                    style={{ opacity: 0.04 - i * 0.003 }}
                />
            ))}
        </svg>
    );
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const duration = 1600;
        const startTime = performance.now();
        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [inView, target]);

    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.section
            id={id}
            ref={ref}
            variants={stagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className={`relative overflow-hidden ${className}`}
        >
            {children}
        </motion.section>
    );
}

// ─── 1. HERO SECTION ──────────────────────────────────────────────────────────
function HeroSection() {
    return (
        <Section
            id="hero"
            className="min-h-[100svh] flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center bg-white dark:bg-black"
        >
            {/* Background rings */}
            <ConcentricRings className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110vw] max-w-[800px] text-violet-500 dark:text-violet-400 opacity-70" />

            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-5">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold tracking-wide uppercase border border-violet-200 dark:border-violet-700/50">
                    <Sparkles size={12} className="animate-pulse" />
                    Escrow-Protected Creator Commerce
                </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
                variants={fadeUp}
                className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white max-w-2xl leading-[1.08]"
            >
                Stop Getting{' '}
                <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                    Ghosted
                </span>{' '}
                After the Work is Done.
            </motion.h1>

            <motion.p
                variants={fadeUp}
                className="mt-5 text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-xl"
            >
                You spent 5 hours editing that video, only for the brand to disappear.
                We hold the brand's payment in{' '}
                <span className="text-violet-600 dark:text-violet-400 font-semibold">Escrow</span>{' '}
                before you even press{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">Record</span>.
            </motion.p>

            {/* Hero placeholder (swap with Nano Banana asset 1) */}
            <motion.div
                variants={fadeUp}
                className="mt-10 w-full max-w-sm mx-auto rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-violet-500/20 dark:shadow-violet-500/10 border border-gray-100 dark:border-white/5"
            >
                <div className="relative bg-gray-950 min-h-[300px] sm:h-[340px] flex flex-col items-center justify-center gap-5 p-6 sm:p-8">
                    {/* Sent message */}
                    <div className="self-end bg-blue-500 text-white text-sm px-4 py-2.5 rounded-[1.6rem] rounded-br-md max-w-[75%] shadow-lg">
                        <p className="font-medium">Video delivered ✓✓</p>
                        <p className="text-[10px] text-blue-200 mt-0.5">Read · 14 days ago</p>
                    </div>
                    {/* No reply */}
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <div className="h-px flex-1 bg-gray-800" />
                        No reply for 14 days
                        <div className="h-px flex-1 bg-gray-800" />
                    </div>
                    {/* Balance card */}
                    <div className="self-start bg-gray-900 border border-gray-800 rounded-2xl p-4 w-[70%] shadow-lg">
                        <p className="text-gray-500 text-[10px] uppercase tracking-widest">Available Balance</p>
                        <p className="text-red-400 text-3xl font-extrabold mt-1">₦0.00</p>
                        <p className="text-gray-600 text-[10px] mt-1">Payment pending since Mar 15</p>
                    </div>
                </div>
            </motion.div>

            <motion.a
                variants={fadeUp}
                href="#register"
                className="mt-8 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-[0.97] text-white font-bold px-8 py-4 rounded-full text-base shadow-lg shadow-violet-500/30 transition-all"
            >
                Secure My Next Deal
                <ArrowRight size={18} />
            </motion.a>

            {/* Scroll cue */}
            <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col items-center gap-1 text-gray-400 dark:text-gray-600"
            >
                <span className="text-xs">Scroll to see how it works</span>
                <ChevronDown size={16} className="animate-bounce" />
            </motion.div>
        </Section>
    );
}

// ─── 2. DM LOOP SECTION ──────────────────────────────────────────────────────
const chatMessages = [
    { from: 'brand', text: 'What\'s your rate for one IG Story?' },
    { from: 'creator', text: '₦15,000 per story 📊' },
    { from: 'brand', text: 'Can we get 3 posts for ₦30,000?' },
    { from: 'creator', text: 'That\'s below my rate card, sorry.' },
    { from: 'brand', text: 'Send your media kit first?' },
    { from: 'brand', text: 'Wait, let me ask my manager...' },
    { from: 'brand', text: 'Just checking in 👋' },
    { from: 'creator', text: '...Still interested?' },
];

function DMLLoopSection() {
    return (
        <Section className="py-24 px-6 bg-gray-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto">
                <motion.div variants={fadeUp} className="text-center mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-pink-500 dark:text-pink-400 mb-3 block">The Problem</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Death by 1,000 <span className="text-pink-500">"How much?"</span> DMs.
                    </h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        The annoying back-and-forth every influencer hates — chatting for 3 days just to get a "No."
                    </p>
                </motion.div>

                {/* Chat bubbles */}
                <motion.div variants={stagger} className="space-y-3 mb-8">
                    {chatMessages.map((msg, i) => (
                        <motion.div
                            key={i}
                            variants={bubble}
                            className={`flex ${msg.from === 'creator' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-[1.6rem] text-sm font-medium shadow-sm ${msg.from === 'creator'
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-zinc-700 rounded-bl-md'
                                }`}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Solution callout */}
                <motion.div
                    variants={fadeUp}
                    className="rounded-3xl bg-white dark:bg-zinc-900 border border-violet-100 dark:border-violet-900/50 p-6 shadow-lg shadow-violet-500/5"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={20} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">The Compass 🧭 Fix</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                One link for your Bio. Brands see your fixed rates, check your availability, and{' '}
                                <strong className="text-violet-600 dark:text-violet-400">pay upfront</strong>.
                                No more chatting for 3 days just to get a "No."
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </Section>
    );
}

// ─── 3. ESCROW FLOW SECTION ───────────────────────────────────────────────────
const escrowSteps = [
    { icon: Lock, color: 'from-green-400 to-teal-500', label: 'Booked', desc: 'Brand selects a service and pays 100% into Escrow. Secured.', glow: 'shadow-green-500/20' },
    { icon: Bell, color: 'from-blue-400 to-violet-500', label: 'Notified', desc: 'You get a push notification: "₦50,000 Secured. Start Creating." — straight to your phone.', glow: 'shadow-blue-500/20' },
    { icon: Upload, color: 'from-violet-500 to-purple-600', label: 'Submitted', desc: 'You submit the draft or link through the platform. No email chains.', glow: 'shadow-purple-500/20' },
    { icon: Banknote, color: 'from-amber-400 to-orange-500', label: 'Paid', desc: 'Once approved, the funds hit your bank instantly. No chasing. No begging.', glow: 'shadow-amber-500/20' },
];

function EscrowFlowSection() {
    return (
        <Section className="py-24 px-6 bg-white dark:bg-black">
            <ConcentricRings className="top-0 right-0 w-[80vw] max-w-[600px] text-violet-400 opacity-50" />
            <div className="max-w-2xl mx-auto">
                <motion.div variants={fadeUp} className="text-center mb-14">
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3 block">The Solution</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Escrow. From Start to{' '}
                        <span className="bg-gradient-to-r from-green-500 to-teal-400 bg-clip-text text-transparent">Paid.</span>
                    </h2>
                </motion.div>

                <div className="relative">
                    {/* Vertical connector */}
                    <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-green-400 via-violet-500 to-amber-400 opacity-30" />

                    <motion.div variants={stagger} className="space-y-5">
                        {escrowSteps.map((step, i) => (
                            <motion.div
                                key={step.label}
                                variants={fadeUp}
                                className={`relative flex items-start gap-5 bg-gray-50 dark:bg-zinc-900 rounded-3xl p-5 border border-gray-100 dark:border-zinc-800 shadow-md ${step.glow}`}
                            >
                                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                                    <step.icon size={22} className="text-white" />
                                </div>
                                <div className="pt-0.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Step {i + 1}</span>
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white">{step.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </Section>
    );
}

// ─── 4. PORTFOLIO PREVIEW SECTION ────────────────────────────────────────────
const services = [
    { title: 'Shoutout (24hr)', price: '₦20,000', color: 'from-violet-500 to-purple-600', emoji: '📣' },
    { title: 'Product Review', price: '₦50,000', color: 'from-blue-500 to-indigo-600', emoji: '🎬' },
    { title: 'Event Appearance', price: '₦120,000', color: 'from-amber-400 to-orange-500', emoji: '🎤' },
];

function PortfolioPreviewSection() {
    return (
        <Section className="py-24 px-6 bg-gray-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto">
                <motion.div variants={fadeUp} className="text-center mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 block">Your Profile</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Your Influence,{' '}
                        <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                            Professionalised.
                        </span>
                    </h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Host your services on a platform built for creators. Brands book and pay upfront — like an app store for influence.
                    </p>
                </motion.div>

                {/* Mock profile card */}
                <motion.div
                    variants={fadeUp}
                    className="mx-auto max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-violet-500/10"
                >
                    {/* Profile header */}
                    <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-6 pt-8 pb-16 relative">
                        <ConcentricRings className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-white" />
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-2xl font-extrabold text-white">
                                ✨
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="font-extrabold text-white text-lg">@YourName</p>
                                    <CheckCircle2 size={16} className="text-blue-300" />
                                </div>
                                <p className="text-white/70 text-sm">245K followers · Content Creator</p>
                            </div>
                        </div>
                    </div>

                    {/* Services list */}
                    <div className="-mt-8 px-4 pb-6 space-y-3">
                        {services.map((s) => (
                            <div
                                key={s.title}
                                className="flex items-center gap-4 bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-zinc-700"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-md`}>
                                    {s.emoji}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{s.title}</p>
                                    <p className="text-violet-600 dark:text-violet-400 font-extrabold">{s.price}</p>
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold">
                                    Book
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.p variants={fadeUp} className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6 italic">
                    "Your influence is a professional service. Host it on a professional platform."
                </motion.p>
            </div>
        </Section>
    );
}

// ─── 5. COMMISSION SECTION ────────────────────────────────────────────────────
function CommissionSection() {
    const benefits = ['Contracts Handled', 'Escrow Included', 'Disputes Resolved'];
    return (
        <Section className="py-24 px-6 bg-white dark:bg-black">
            <div className="max-w-2xl mx-auto text-center">
                <motion.div variants={fadeUp}>
                    <span className="text-xs font-bold uppercase tracking-widest text-green-500 mb-3 block">Transparent Pricing</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        We only get paid{' '}
                        <span className="bg-gradient-to-r from-green-500 to-teal-400 bg-clip-text text-transparent">
                            when you get paid.
                        </span>
                    </h2>
                </motion.div>

                {/* 10% ring badge */}
                <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-100 dark:text-zinc-800" />
                            <circle
                                cx="50" cy="50" r="42"
                                stroke="url(#grad)"
                                strokeWidth="6"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 42 * 0.10} ${2 * Math.PI * 42 * 0.90}`}
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#8B5CF6" />
                                    <stop offset="100%" stopColor="#34D399" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div>
                            <p className="text-5xl font-extrabold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">10%</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 font-medium">Commission</p>
                        </div>
                    </div>
                </motion.div>

                <motion.p variants={fadeUp} className="mt-6 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    We take a flat <strong className="text-gray-900 dark:text-white">10%</strong>. In exchange, we handle the
                    contracts, the escrow, the payment processing, and the dispute resolution.{' '}
                    <strong className="text-violet-600 dark:text-violet-400">You just create.</strong>
                </motion.p>

                <motion.div variants={stagger} className="mt-8 flex flex-wrap justify-center gap-3">
                    {benefits.map(benefit => (
                        <motion.div
                            key={benefit}
                            variants={bubble}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-semibold border border-green-100 dark:border-green-800/50"
                        >
                            <Check size={14} />
                            {benefit}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </Section>
    );
}

// ─── 6. ANTI-HUSTLE HOOK ─────────────────────────────────────────────────────
function AntiHustleSection() {
    return (
        <Section className="py-24 px-6 bg-gray-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto text-center">
                <motion.div variants={fadeUp}>
                    <span className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-3 block">Final Word</span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        Stop being a <span className="text-pink-500">customer service rep.</span>
                        <br />Go back to being a creator.
                    </h2>
                    <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                        Compass 🧭 gives you the infrastructure of a full business — without the admin. Launch your booking page in minutes.
                    </p>
                </motion.div>

                {/* Split visual placeholder */}
                <motion.div variants={fadeUp} className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3 max-w-sm sm:max-w-md mx-auto">
                    <div className="rounded-3xl bg-gray-200 dark:bg-zinc-800 p-5 text-left opacity-60">
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3">Before</p>
                        <div className="space-y-2">
                            {['Follow up with brand 😩', 'Send invoice again', 'Chase payment...', '14 days no reply'].map(t => (
                                <div key={t} className="text-xs text-gray-500 dark:text-gray-500 flex items-start gap-1.5">
                                    <span className="mt-0.5 w-3 h-3 rounded-sm border border-gray-400 flex-shrink-0" />
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-teal-500 p-5 text-left">
                        <p className="text-xs font-bold text-violet-100 mb-3">After ✨</p>
                        <div className="space-y-2">
                            {['₦50,000 Released 🎉', 'Escrow Protected ✓', 'Brand Approved ✓', 'Creating Content 🎬'].map(t => (
                                <div key={t} className="text-xs text-white flex items-start gap-1.5">
                                    <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" />
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.a variants={fadeUp} href="#register" className="mt-10 inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-8 py-4 rounded-full text-base shadow-lg shadow-violet-500/30 hover:opacity-90 active:scale-[0.97] transition-all">
                    Launch My Booking Page
                    <ArrowRight size={18} />
                </motion.a>
            </div>
        </Section>
    );
}

// ─── 7. REGISTRATION SECTION ──────────────────────────────────────────────────
declare global {
    interface Window {
        PaystackPop: {
            setup: (options: {
                key: string;
                email: string;
                amount: number;
                currency: string;
                ref: string;
                metadata?: object;
                onClose: () => void;
                callback: (response: { reference: string }) => void;
            }) => { openIframe: () => void };
        };
    }
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
    name: string;
    email: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    discountCode: string;
}

function RegistrationSection() {
    const [form, setForm] = useState<FormData>({
        name: '', email: '', bankName: '', bankCode: '', accountNumber: '', accountName: '', discountCode: '',
    });
    const [price, setPrice] = useState(10000);
    const [discountValid, setDiscountValid] = useState<boolean | null>(null);
    const [isResolvingBank, setIsResolvingBank] = useState(false);
    const [bankError, setBankError] = useState('');
    const [formState, setFormState] = useState<FormState>('idle');
    const [formError, setFormError] = useState('');
    const [registrationCount, setRegistrationCount] = useState(12); // Placeholder count

    const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Validate discount code
    const handleDiscountChange = useCallback(async (code: string) => {
        setForm(prev => ({ ...prev, discountCode: code }));
        if (!code.trim()) { setDiscountValid(null); setPrice(10000); return; }
        const valid = await validateDiscountCode(code);
        setDiscountValid(valid);
        setPrice(valid ? 0 : 10000);
    }, []);

    // Auto-resolve bank account name
    useEffect(() => {
        if (form.accountNumber.length !== 10 || !form.bankCode) return;
        if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = setTimeout(async () => {
            setIsResolvingBank(true);
            setBankError('');
            setForm(prev => ({ ...prev, accountName: '' }));
            try {
                const res = await fetch(`/api/resolve-bank?accountNumber=${form.accountNumber}&bankCode=${form.bankCode}`);
                const data = await res.json();
                if (data.account_name) {
                    setForm(prev => ({ ...prev, accountName: data.account_name }));
                } else {
                    setBankError(data.error || 'Could not verify account. Please check the details.');
                }
            } catch {
                setBankError('Network error. You can enter the account name manually.');
            } finally {
                setIsResolvingBank(false);
            }
        }, 800);
        return () => { if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current); };
    }, [form.accountNumber, form.bankCode]);

    const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = NIGERIAN_BANKS.find(b => b.code === e.target.value);
        setForm(prev => ({ ...prev, bankName: selected?.name || '', bankCode: e.target.value, accountName: '' }));
        setBankError('');
    };

    const buildWhatsAppMessage = (ref?: string) => {
        const paymentLine = price === 0
            ? `FREE via discount code: ${form.discountCode}`
            : `PAID ₦10,000 | Ref: ${ref}`;
        return encodeURIComponent(
            `New Influencer Registration ✅\nName: ${form.name}\nEmail: ${form.email}\nBank: ${form.bankName}\nAccount No: ${form.accountNumber}\nAccount Name: ${form.accountName}\nPayment: ${paymentLine}`
        );
    };

    const completeRegistration = async (paystackRef?: string) => {
        setFormState('submitting');
        const result = await saveMediaRegistration({
            name: form.name,
            email: form.email,
            bankName: form.bankName,
            accountNumber: form.accountNumber,
            accountName: form.accountName,
            paymentType: price === 0 ? 'free' : 'paid',
            discountCode: price === 0 ? form.discountCode : null,
            paystackRef: paystackRef || null,
        });

        if (!result.success) {
            setFormState('error');
            setFormError(result.error || 'Something went wrong. Please try again.');
            return;
        }

        setFormState('success');
        setRegistrationCount(c => c + 1);
        // Open WhatsApp
        const wa = `https://wa.me/2347032905036?text=${buildWhatsAppMessage(paystackRef)}`;
        setTimeout(() => { window.open(wa, '_blank'); }, 800);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // Basic validation
        if (!form.name.trim()) return setFormError('Please enter your full name.');
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return setFormError('Please enter a valid email address.');
        if (!form.bankCode) return setFormError('Please select your bank.');
        if (form.accountNumber.length !== 10) return setFormError('Account number must be 10 digits.');
        if (!form.accountName) return setFormError('Please wait for account name verification or enter it manually.');

        // Duplicate email check
        const isDuplicate = await checkDuplicateEmail(form.email);
        if (isDuplicate) return setFormError('This email is already registered.');

        if (price === 0) {
            // Free path — skip Paystack
            await completeRegistration();
        } else {
            // Paystack path
            if (!window.PaystackPop) {
                setFormError('Payment widget is loading. Please try again in a moment.');
                return;
            }
            const ref = `BCN_MED_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
            const handler = window.PaystackPop.setup({
                key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
                email: form.email,
                amount: 1000000, // ₦10,000 in kobo
                currency: 'NGN',
                ref,
                metadata: { name: form.name, custom_fields: [{ display_name: 'Influencer Name', variable_name: 'influencer_name', value: form.name }] },
                onClose: () => { setFormError('Payment cancelled. Please try again.'); },
                callback: async (response) => {
                    await completeRegistration(response.reference);
                },
            });
            handler.openIframe();
        }
    };

    const inputClass = "w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm";

    return (
        <Section id="register" className="py-24 px-6 bg-white dark:bg-black">
            <ConcentricRings className="bottom-0 left-1/2 -translate-x-1/2 w-[120vw] max-w-[800px] text-violet-400 opacity-60" />

            <Script
                src="https://js.paystack.co/v1/inline.js"
                strategy="lazyOnload"
            />

            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div variants={fadeUp} className="text-center mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3 block">Register</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Launch Your Booking Page
                    </h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        One-time registration fee of{' '}
                        <span className="font-bold text-gray-900 dark:text-white">₦10,000</span>.
                        Gets you your own escrow-protected creator storefront.
                    </p>

                    {/* Live counter */}
                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 text-green-700 dark:text-green-300 text-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <AnimatedCounter target={registrationCount} suffix=" creators already registered" />
                    </div>
                </motion.div>

                {/* Success State */}
                <AnimatePresence>
                    {formState === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-8 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">You're In! 🎉</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                                Your registration is confirmed. WhatsApp is opening to notify our team.
                                We'll set up your creator profile within 24 hours.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {formState !== 'success' && (
                    <motion.form
                        variants={fadeUp}
                        onSubmit={handleSubmit}
                        className="glassmorphic rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white/60 dark:border-white/5 shadow-2xl shadow-violet-500/10 space-y-5"
                    >
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Email Address</label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Bank Details */}
                        <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 p-4 space-y-3 bg-white/50 dark:bg-zinc-900/50">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Bank Account Details</p>

                            {/* Bank Select */}
                            <select
                                value={form.bankCode}
                                onChange={handleBankChange}
                                className={inputClass}
                                required
                            >
                                <option value="">Select your bank</option>
                                {NIGERIAN_BANKS.map(bank => (
                                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                                ))}
                            </select>

                            {/* Account Number */}
                            <input
                                type="tel"
                                placeholder="10-digit account number"
                                value={form.accountNumber}
                                maxLength={10}
                                onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, ''), accountName: '' }))}
                                className={inputClass}
                                required
                            />

                            {/* Account Name (auto-resolved) */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Account name (auto-verified)"
                                    value={form.accountName}
                                    onChange={e => setForm(p => ({ ...p, accountName: e.target.value }))}
                                    className={`${inputClass} pr-10`}
                                    readOnly={!!form.accountName && !bankError}
                                />
                                {isResolvingBank && (
                                    <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-500 animate-spin" />
                                )}
                                {form.accountName && !isResolvingBank && (
                                    <Check size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                                )}
                            </div>
                            {bankError && (
                                <p className="text-red-500 text-xs flex items-center gap-1.5">
                                    <AlertCircle size={12} />{bankError}
                                </p>
                            )}
                        </div>

                        {/* Discount Code */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                Discount Code <span className="text-gray-400 font-normal normal-case">(optional)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter discount code"
                                    value={form.discountCode}
                                    onChange={e => handleDiscountChange(e.target.value)}
                                    className={`${inputClass} pr-10 ${discountValid === true ? 'border-green-400 dark:border-green-500' : discountValid === false ? 'border-red-400 dark:border-red-500' : ''}`}
                                />
                                {discountValid === true && <Check size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                                {discountValid === false && <X size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />}
                            </div>
                            {discountValid === true && (
                                <motion.p
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-green-600 dark:text-green-400 text-xs font-semibold mt-2 flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={12} /> Code applied! Registration is now FREE 🎉
                                </motion.p>
                            )}
                        </div>

                        {/* Price display */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={price}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
                            >
                                <span className="text-sm text-gray-500 dark:text-gray-400">Registration Fee</span>
                                <div className="flex items-center gap-2">
                                    {price === 0 && (
                                        <span className="text-gray-400 line-through text-sm">₦10,000</span>
                                    )}
                                    <span className={`text-lg font-extrabold ${price === 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                                        {price === 0 ? 'FREE' : '₦10,000'}
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Error message */}
                        {formError && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl px-4 py-3"
                            >
                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                {formError}
                            </motion.div>
                        )}

                        {/* CTA Button */}
                        <button
                            type="submit"
                            disabled={formState === 'submitting'}
                            className="w-full py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-violet-600 to-purple-700 shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-purple-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {formState === 'submitting' ? (
                                <><Loader2 size={18} className="animate-spin" /> Processing...</>
                            ) : price === 0 ? (
                                <>Join Free 🎉 <ArrowRight size={18} /></>
                            ) : (
                                <>Secure My Spot — ₦10,000 <Lock size={16} /></>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                            <Shield size={11} className="inline mr-1" />
                            Payments secured by Paystack · Registration confirmed via WhatsApp
                        </p>
                    </motion.form>
                )}
            </div>
        </Section>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function MediaLandingPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
            {/* Sticky nav pill */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
                <div className="glassmorphic rounded-full px-5 py-2.5 flex items-center gap-3 border border-white/60 dark:border-white/10 shadow-lg shadow-black/10">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Sparkles size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Compass 🧭 creators</span>
                    <a
                        href="#register"
                        className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                    >
                        Join →
                    </a>
                </div>
            </div>

            <HeroSection />
            <DMLLoopSection />
            <EscrowFlowSection />
            <PortfolioPreviewSection />
            <CommissionSection />
            <AntiHustleSection />
            <RegistrationSection />

            {/* Footer */}
            <footer className="py-10 px-6 text-center bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                    © {new Date().getFullYear()} Compass 🧭. All rights reserved. · Powered by Paystack Escrow.
                </p>
            </footer>
        </main>
    );
}
