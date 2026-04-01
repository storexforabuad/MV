'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence, type Variants } from 'framer-motion';
import {
    Shield, Bell, Upload, Banknote, CheckCircle2, ChevronDown,
    Sparkles, ArrowRight, Lock, AlertCircle, Loader2, X, Check,
    Compass as CompassIcon, Coins, Users, ShoppingBag, Zap, Laptop,
    Camera, Heart, Share2, MessageCircle
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

    // Update count when target changes (important for the calculator)
    useEffect(() => {
        setCount(target);
    }, [target]);

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
            className="min-h-[100svh] flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center bg-white dark:bg-black"
        >
            {/* Background mesh gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(139,92,246,0.08),_transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,_rgba(139,92,246,0.15),_transparent_70%)]" />

            <ConcentricRings className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] max-w-[1000px] text-violet-500 dark:text-violet-400 opacity-70 animate-pulse-slow" />
            <ConcentricRings className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110vw] max-w-[800px] text-violet-400 dark:text-violet-300 opacity-40 rotate-[15deg]" />

            <motion.div variants={fadeUp} className="mb-5">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold tracking-wide uppercase border border-violet-200 dark:border-violet-700/50">
                    <CompassIcon size={12} className="animate-spin-slow" />
                    Compass 🧭: Start Your Creator Journey
                </span>
            </motion.div>

            <motion.h1
                variants={fadeUp}
                className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white max-w-2xl leading-[1.08]"
            >
                Stop Posting for{' '}
                <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                    Likes
                </span>.
                <br />Start Building a Business.
            </motion.h1>

            <motion.p
                variants={fadeUp}
                className="mt-5 text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-xl"
            >
                You're posting for free while brands are looking for creators like you.
                Compass 🧭 gives you the direct path to turn your followers into a professional revenue stream.
            </motion.p>

            <motion.a
                variants={fadeUp}
                href="#calculator"
                className="mt-8 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-[0.97] text-white font-bold px-8 py-4 rounded-full text-base shadow-lg shadow-violet-500/30 transition-all"
            >
                Calculate My Worth
                <ArrowRight size={18} />
            </motion.a>

            <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col items-center gap-1 text-gray-400 dark:text-gray-600"
            >
                <span className="text-xs">Monetize your profile in 60 seconds</span>
                <ChevronDown size={16} className="animate-bounce" />
            </motion.div>
        </Section>
    );
}

// ─── 2. EARNINGS CALCULATOR ────────────────────────────────────────────────────
function EarningsCalculator() {
    const [followers, setFollowers] = useState(5000);
    const [engagement, setEngagement] = useState<number>(2); // 1: Low, 2: Mid, 3: High

    // Simple estimation logic
    const baseRate = 2; // ₦2 per follower base
    const engagementMult = engagement === 1 ? 0.6 : engagement === 2 ? 1 : 1.8;
    const monthlyEstimate = Math.round(followers * baseRate * engagementMult);

    return (
        <Section id="calculator" className="py-24 px-6 bg-slate-50 dark:bg-zinc-950 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.03),_transparent_40%)]" />
            <div className="max-w-xl mx-auto relative">
                <motion.div variants={fadeUp} className="text-center mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3 block">Estimation Tool</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        What's Your Influence{' '}
                        <span className="text-violet-600 dark:text-violet-400">Worth?</span>
                    </h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400">
                        Use our calculator to estimate your potential monthly earnings through Compass 🧭.
                    </p>
                </motion.div>

                <motion.div
                    variants={fadeUp}
                    className="glassmorphic rounded-[2.5rem] p-8 border border-white/60 dark:border-white/5 shadow-2xl shadow-violet-500/10 space-y-10"
                >
                    {/* Follower Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Users size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">Followers</span>
                            </div>
                            <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                                {followers.toLocaleString()}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="50000"
                            step="500"
                            value={followers}
                            onChange={(e) => setFollowers(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
                            <span>500</span>
                            <span>50K+</span>
                        </div>
                    </div>

                    {/* Engagement Toggle */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 px-1">
                            <Zap size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Engagement Level</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-zinc-900 p-1.5 rounded-2xl">
                            {[
                                { id: 1, label: 'Low', color: 'text-gray-500' },
                                { id: 2, label: 'Mid', color: 'text-blue-500' },
                                { id: 3, label: 'High', color: 'text-orange-500' }
                            ].map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => setEngagement(level.id)}
                                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${engagement === level.id
                                        ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Output */}
                    <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                        <div className="bg-violet-600 dark:bg-violet-900/40 rounded-3xl p-6 text-center text-white relative overflow-hidden group">
                            <Sparkles size={100} className="absolute -top-10 -right-10 text-white/10 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Estimated Monthly Earnings</p>
                            <p className="text-5xl font-black mb-1">
                                <AnimatedCounter target={monthlyEstimate} prefix="₦" />
                            </p>
                            <p className="text-xs opacity-60">Based on Compass 🧭 marketplace averages</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} className="mt-8 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic max-w-xs mx-auto">
                        "Your audience is an asset. Don't let it wait. Compass 🧭 handles the logistics, you handle the creation."
                    </p>
                </motion.div>
            </div>
        </Section>
    );
}

// ─── 3. WHAT CAN YOU SELL SECTION ──────────────────────────────────────────────
const creatorServices = [
    {
        title: 'Digital Services',
        icon: Camera,
        color: 'from-blue-400 to-indigo-500',
        items: ['Shoutouts (24hr Story)', 'Product Unboxings', 'Account Audit', 'Custom Collabs']
    },
    {
        title: 'Brand Growth',
        icon: Heart,
        color: 'from-pink-400 to-violet-500',
        items: ['Sponsored Posts', 'Lifestyle Feature', 'Reels Collaboration', 'Brand Ambassadorship']
    },
    {
        title: 'Physical Products',
        icon: ShoppingBag,
        color: 'from-amber-400 to-orange-500',
        items: ['Custom Merch', 'Curated Goodie Boxes', 'Signed Posters', 'Limited Editions']
    }
];

function WhatCanYouSell() {
    return (
        <Section className="py-24 px-6 bg-white dark:bg-black relative">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(139,92,246,0.02)_0%,_transparent_100%)]" />
            <ConcentricRings className="top-0 right-0 w-[80vw] max-w-[600px] text-violet-400 opacity-40" />
            <div className="max-w-4xl mx-auto relative">
                <motion.div variants={fadeUp} className="text-center mb-16">
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3 block">Your Catalog</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        Turn Your Passion into <br />
                        <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">One Link.</span>
                    </h2>
                    <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Compass 🧭 helps you package your influence into professional products that brands (and fans) can buy instantly.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {creatorServices.map((service, i) => (
                        <motion.div
                            key={service.title}
                            variants={fadeUp}
                            className="bg-gray-50 dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-zinc-800 shadow-md group hover:shadow-xl transition-all"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                                <service.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{service.title}</h3>
                            <ul className="space-y-3">
                                {service.items.map(item => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </Section>
    );
}

// ─── Shared Helper for Icons ──────────────────────────────────────────────────
function SharedWeightlessIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
    return <Heart size={size} className={className} />;
}

// ─── 4. THE STOREFRONT SECTION ──────────────────────────────────────────────
function StorefrontSection() {
    return (
        <Section className="py-24 px-6 bg-gray-50 dark:bg-zinc-950">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <motion.div variants={fadeUp}>
                        <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3 block">Instant Infrastructure</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            No Website? <br />
                            <span className="text-violet-600 dark:text-violet-400">No Problem.</span>
                        </h2>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-sm mx-auto md:mx-0">
                            Get a beautiful, professional link-in-bio storefront that handles booking, physical inventory, and payments automatically.
                        </p>
                    </motion.div>

                    <motion.div variants={stagger} className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Escrow Secure', icon: Lock },
                            { label: 'Auto-Tax', icon: Zap },
                            { label: 'Instant Pay', icon: Banknote },
                            { label: 'Mobile First', icon: Laptop }
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
                                <item.icon size={16} className="text-violet-500" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Mock Phone Visual (Asset 4 replacement) */}
                <motion.div
                    variants={fadeUp}
                    className="flex-1 w-full max-w-[320px] relative"
                >
                    <div className="bg-gray-100 dark:bg-zinc-800 rounded-[3rem] p-3 shadow-2xl border border-white/20">
                        <div className="bg-white dark:bg-black rounded-[2.5rem] overflow-hidden aspect-[9/19] relative flex flex-col pt-12">
                            <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-violet-600/10 to-transparent" />
                            {/* Mock Header */}
                            <div className="px-6 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">🤳</div>
                                <h3 className="mt-4 text-sm font-black text-gray-900 dark:text-white">@YourName</h3>
                                <p className="text-[10px] text-gray-400">Creator Hub powered by Compass 🧭</p>
                            </div>
                            {/* Mock List */}
                            <div className="px-4 mt-8 space-y-3">
                                {[
                                    { t: 'Collab with me', p: '₦20k', e: '🤝' },
                                    { t: 'Product Review', p: '₦50k', e: '📦' },
                                    { t: 'Buy my Preset', p: '₦5k', e: '✨' }
                                ].map(s => (
                                    <div key={s.t} className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-black shadow-sm flex items-center justify-center text-lg">{s.e}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate">{s.t}</p>
                                            <p className="text-[10px] text-violet-500 font-black">{s.p}</p>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full bg-violet-600 text-white text-[8px] font-black uppercase">Book</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Floating badge */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -bottom-6 -right-6 glassmorphic p-4 rounded-3xl border border-white/40 shadow-xl"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">✓</div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-900 dark:text-white">Deal Secured</p>
                                <p className="text-[8px] text-gray-400">₦75,000 in Escrow</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </Section>
    );
}

// ─── 5. REGISTRATION SECTION ──────────────────────────────────────────────────
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
    const [registrationCount, setRegistrationCount] = useState(124); // Start higher for new flair

    const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleDiscountChange = useCallback(async (code: string) => {
        setForm(prev => ({ ...prev, discountCode: code }));
        if (!code.trim()) { setDiscountValid(null); setPrice(10000); return; }
        const valid = await validateDiscountCode(code);
        setDiscountValid(valid);
        setPrice(valid ? 0 : 10000);
    }, []);

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
                if (data.account_name) setForm(prev => ({ ...prev, accountName: data.account_name }));
                else setBankError(data.error || 'Check details.');
            } catch {
                setBankError('Network error.');
            } finally { setIsResolvingBank(false); }
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
            `New Influencer Registration (NEW MEDIA) ✅\nName: ${form.name}\nEmail: ${form.email}\nBank: ${form.bankName}\nAccount No: ${form.accountNumber}\nAccount Name: ${form.accountName}\nPayment: ${paymentLine}\nDirection: Compass 🧭 New Creator`
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
            source: 'newmedia', // Tracking source
        });

        if (!result.success) {
            setFormState('error');
            setFormError(result.error || 'Something went wrong.');
            return;
        }

        setFormState('success');
        setRegistrationCount(c => c + 1);
        const wa = `https://wa.me/2347032905036?text=${buildWhatsAppMessage(paystackRef)}`;
        setTimeout(() => { window.open(wa, '_blank'); }, 800);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.name.trim()) return setFormError('Name required.');
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return setFormError('Invalid email.');
        if (!form.bankCode) return setFormError('Select bank.');
        if (form.accountNumber.length !== 10) return setFormError('10-digit account no.');
        if (!form.accountName) return setFormError('Wait for verification.');

        const isDuplicate = await checkDuplicateEmail(form.email);
        if (isDuplicate) return setFormError('Already registered.');

        if (price === 0) await completeRegistration();
        else {
            if (!window.PaystackPop) return setFormError('Loading...');
            const ref = `CMP_NM_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
            const handler = window.PaystackPop.setup({
                key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
                email: form.email,
                amount: 1000000,
                currency: 'NGN',
                ref,
                metadata: { source: 'newmedia', name: form.name },
                onClose: () => { setFormError('Cancelled.'); },
                callback: (r) => completeRegistration(r.reference),
            });
            handler.openIframe();
        }
    };

    const inputClass = "w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm";

    return (
        <Section id="register" className="py-24 px-6 bg-white dark:bg-black">
            <ConcentricRings className="bottom-0 left-1/2 -translate-x-1/2 w-[120vw] max-w-[800px] text-violet-400 opacity-60" />
            <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

            <div className="max-w-2xl mx-auto">
                <motion.div variants={fadeUp} className="text-center mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3 block">Join Compass 🧭</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Launch Your Creator Hub
                    </h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        One link. Infinite opportunities. Join the platform built to help you navigate the creator economy.
                    </p>

                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 text-green-700 dark:text-green-300 text-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <AnimatedCounter target={registrationCount} suffix=" creators starting today" />
                    </div>
                </motion.div>

                {formState === 'success' ? (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} className="text-green-500" /></div>
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Welcome to Compass 🧭</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Opening WhatsApp to finalize your setup...</p>
                    </motion.div>
                ) : (
                    <motion.form variants={fadeUp} onSubmit={handleSubmit} className="glassmorphic rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white/60 dark:border-white/5 shadow-2xl shadow-violet-500/10 space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Full Name</label>
                            <input type="text" placeholder="Enter your full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Email</label>
                            <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} required />
                        </div>
                        <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 p-4 space-y-3 bg-white/50 dark:bg-zinc-900/50">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Payout Details</p>
                            <select value={form.bankCode} onChange={handleBankChange} className={inputClass} required>
                                <option value="">Select bank</option>
                                {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                            </select>
                            <input type="tel" placeholder="10-digit account number" value={form.accountNumber} maxLength={10} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, ''), accountName: '' }))} className={inputClass} required />
                            <div className="relative">
                                <input type="text" placeholder="Account name" value={form.accountName} className={inputClass} readOnly={!!form.accountName && !bankError} />
                                {isResolvingBank && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-500 animate-spin" />}
                                {form.accountName && !isResolvingBank && <Check size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Discount Code</label>
                            <div className="relative">
                                <input type="text" placeholder="Enter code" value={form.discountCode} onChange={e => handleDiscountChange(e.target.value)} className={`${inputClass} pr-10`} />
                                {discountValid === true && <Check size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                            </div>
                            <p className="mt-2 text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                                Hint: Try <span className="text-violet-500 font-bold">MGL10</span> for 100% off Early Access 🚀
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={formState === 'submitting'}
                            className="w-full py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-violet-600 to-purple-700 shadow-xl shadow-violet-500/40 hover:shadow-violet-600/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {formState === 'submitting' ? <Loader2 size={18} className="animate-spin" /> : price === 0 ? "Join Compass 🧭 Free" : "Secure My Spot — ₦10,000"}
                        </button>
                    </motion.form>
                )}
            </div>
        </Section>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function NewMediaLandingPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
            {/* Sticky nav pill */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                <div className="glassmorphic rounded-full px-6 py-3.5 flex items-center gap-5 border border-white/60 dark:border-white/10 shadow-xl shadow-black/10 min-w-[240px] justify-between backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <CompassIcon size={18} className="text-violet-600 dark:text-violet-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-800 dark:text-gray-100 italic">Compass 🧭</span>
                    </div>
                    <a href="#register" className="text-xs font-black text-violet-600 dark:text-violet-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40">
                        Join →
                    </a>
                </div>
            </div>

            <HeroSection />
            <EarningsCalculator />
            <WhatCanYouSell />
            <StorefrontSection />
            <RegistrationSection />

            <footer className="py-10 px-6 text-center bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                    © {new Date().getFullYear()} Compass 🧭. Your direction in the creator economy. Powered by Paystack.
                </p>
            </footer>
        </main>
    );
}
