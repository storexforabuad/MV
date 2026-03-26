import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, Star, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

type Phase = 'pre' | 'during' | 'post';

// Countdown targets moon sighting night, but day counting starts from first fasting day
const COUNTDOWN_TARGET = new Date('2026-02-17T00:00:00');
const RAMADAN_START = new Date('2026-02-18T00:00:00'); // First day of fasting
const RAMADAN_END = new Date('2026-03-19T00:00:00'); // Adjusted to show Eid earlier
const TOTAL_DAYS = 30;

// 30 daily Ramadan blessings/duas
const DAILY_MESSAGES = [
    "Begin with Bismillah — every good deed starts with His name.",
    "Patience is the key to Jannah. Stay steadfast today.",
    "Charity extinguishes sin like water extinguishes fire.",
    "The best among you are those who learn and teach the Quran.",
    "Whoever feeds a fasting person earns the same reward.",
    "Your Lord is forgiving and loves forgiveness — so forgive.",
    "Speak good or remain silent — guard your tongue today.",
    "A smile in the face of your brother is charity.",
    "Dua is the weapon of the believer. Ask Him today.",
    "Paradise lies at the feet of mothers — honor them.",
    "The strong person is one who controls their anger.",
    "Every hardship comes with ease — trust His plan.",
    "Give thanks and He will increase you in blessings.",
    "The night prayer is the honor of the believer.",
    "Kindness is a mark of faith — be kind today.",
    "Remember Allah often, for it polishes the heart.",
    "A good word is charity. Uplift someone today.",
    "Whoever believes in Allah, let them be generous to their neighbor.",
    "Seek knowledge from the cradle to the grave.",
    "The merciful are shown mercy by the Most Merciful.",
    "Tie your camel and trust in Allah — take action.",
    "Modesty is a branch of faith. Carry it with dignity.",
    "He who is not grateful for little will not be grateful for much.",
    "Purify your heart — Allah looks at your heart, not your appearance.",
    "Do not belittle any good deed, even meeting others with a cheerful face.",
    "The best of people are those most beneficial to others.",
    "Truthfulness leads to righteousness — be truthful always.",
    "Laylatul Qadr is near — seek it in these last nights.",
    "Increase your worship — the finish line is near.",
    "May Allah accept our fasting, prayers, and good deeds. Ameen.",
];

function getPhase(now: Date): Phase {
    if (now < RAMADAN_START) return 'pre';
    if (now < RAMADAN_END) return 'during';
    return 'post';
}

function getCurrentDay(now: Date): number {
    const diff = now.getTime() - RAMADAN_START.getTime();
    const day = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(TOTAL_DAYS, day));
}

function getCountdownTimeLeft(now: Date): TimeLeft | null {
    const difference = COUNTDOWN_TARGET.getTime() - now.getTime();
    if (difference <= 0) return null;
    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}

// Time-aware greeting based on hour of day
function getTimeGreeting(hour: number): { text: string; emoji: string } {
    if (hour >= 3 && hour < 6) return { text: 'Suhoor Time', emoji: '🌙' };
    if (hour >= 6 && hour < 12) return { text: 'Blessed Morning', emoji: '☀️' };
    if (hour >= 12 && hour < 16) return { text: 'Blessed Afternoon', emoji: '🌤️' };
    if (hour >= 16 && hour < 19) return { text: 'Iftar Is Near', emoji: '🍽️' };
    if (hour >= 19 && hour < 22) return { text: 'Iftar Mubarak', emoji: '🌅' };
    return { text: 'Tahajjud Time', emoji: '🤲' };
}

// Circular progress ring component with pulsing glow
function ProgressRing({ progress, size = 120, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
    // Subtract extra padding to account for the glow stroke which is wider (strokeWidth + 4)
    const padding = 6; // Increased padding slightly for safety
    const radius = (size - strokeWidth - padding) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            {/* Background ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(251, 191, 36, 0.15)"
                strokeWidth={strokeWidth}
                fill="none"
            />
            {/* Glow layer (behind the main arc) */}
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#fbbf24"
                strokeWidth={strokeWidth + 4}
                fill="none"
                strokeLinecap="round"
                filter="url(#glowFilter)"
                initial={{ strokeDashoffset: circumference, opacity: 0 }}
                animate={{ strokeDashoffset, opacity: [0.3, 0.6, 0.3] }}
                transition={{
                    strokeDashoffset: { duration: 1.5, ease: "easeOut" },
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{ strokeDasharray: circumference }}
            />
            {/* Progress ring */}
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#progressGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ strokeDasharray: circumference }}
            />
        </svg>
    );
}

// Hook to get responsive ring size
function useRingSize() {
    const [size, setSize] = useState(110);
    useEffect(() => {
        const update = () => setSize(window.innerWidth < 360 ? 85 : 110);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    return size;
}

export default function RamadanCountdown({ className, storeName, onNeedAWebsiteClick, onRefresh }: { className?: string; storeName?: string; onNeedAWebsiteClick?: () => void; onRefresh?: () => void }) {
    const [now, setNow] = useState<Date | null>(null);
    const ringSize = useRingSize();

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!now) return null;

    const phase = getPhase(now);

    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center min-w-[45px] sm:min-w-[60px]">
            <span className="text-2xl sm:text-4xl font-black text-amber-400 tabular-nums leading-none tracking-tighter">
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[11px] uppercase font-bold text-amber-200/50 tracking-widest mt-1">
                {label}
            </span>
        </div>
    );

    // ── Pre-Ramadan: Countdown ──
    if (phase === 'pre') {
        const timeLeft = getCountdownTimeLeft(now);
        if (!timeLeft) return null;

        return (
            <div className={`cursor-pointer ${className || ''}`} onClick={() => onNeedAWebsiteClick?.()}>
                <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 border border-amber-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] h-full flex flex-col justify-center">
                    <div className="absolute inset-0">
                        <Image src="/images/events/ramadan_2026_new.png" alt="Ramadan Background" fill priority className="object-cover opacity-40 scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-indigo-950/40 to-indigo-950/90" />
                    </div>
                    {/* Store Name Overlay */}
                    {storeName && (
                        <div className="absolute top-4 sm:top-5 left-4 sm:left-5 z-20 max-w-[40%] sm:max-w-[45%]">
                            <div className="bg-black/30 backdrop-blur-md rounded-[1rem] sm:rounded-2xl border border-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg">
                                <p className="text-white font-bold text-[9px] sm:text-[11px] truncate">
                                    {storeName}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* BizConnect Badge */}
                    <div className="absolute bottom-3 right-4 z-20">
                        <div className="bg-black/30 backdrop-blur-md rounded-xl sm:rounded-[1rem] border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg flex items-center gap-1">
                            <span className="text-[7px] sm:text-[9px] text-white/70 font-medium tracking-tight">Powered by</span>
                            <span className="text-[8px] sm:text-[10px] font-bold text-amber-400">BizConNet&trade;</span>
                        </div>
                    </div>
                    <div className="absolute top-4 left-6 opacity-30"><Moon className="w-12 h-12 text-amber-400 rotate-12" /></div>
                    <div className="absolute bottom-4 right-6 opacity-20"><Sparkles className="w-16 h-16 text-amber-400" /></div>
                    <div className="relative z-10 px-6 py-8 flex flex-col items-center text-center gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <div className="h-[1px] w-8 bg-amber-400/30" />
                                <span className="text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-[0.3em]">The Holy Month</span>
                                <div className="h-[1px] w-8 bg-amber-400/30" />
                            </div>
                            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                RAMADAN  <span className="text-amber-400">2026.</span>
                            </h3>
                            <p className="text-[11px] sm:text-sm text-indigo-100/70 font-medium tracking-wide max-w-[280px] sm:max-w-md mx-auto">
                                A Month of Blessing, Reflection, and Community
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-6 bg-black/20 backdrop-blur-xl rounded-[2rem] px-6 py-4 border border-white/5 shadow-inner">
                            <TimeBlock value={timeLeft.days} label="Days" />
                            <div className="w-[1px] h-8 sm:h-12 bg-amber-400/20" />
                            <TimeBlock value={timeLeft.hours} label="Hours" />
                            <div className="w-[1px] h-8 sm:h-12 bg-amber-400/20" />
                            <TimeBlock value={timeLeft.minutes} label="Mins" />
                            <div className="w-[1px] h-8 sm:h-12 bg-amber-400/20" />
                            <TimeBlock value={timeLeft.seconds} label="Secs" />
                        </div>
                    </div>
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                        animate={{ x: ['-150%', '250%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
                    />
                </div>
            </div>
        );
    }

    // ── During Ramadan: Day Tracker ──
    if (phase === 'during') {
        const currentDay = getCurrentDay(now);
        const progress = (currentDay / TOTAL_DAYS) * 100;
        const dailyMessage = DAILY_MESSAGES[currentDay - 1] || DAILY_MESSAGES[0];
        const greeting = getTimeGreeting(now.getHours());

        return (
            <div className={`cursor-pointer ${className || ''}`} onClick={() => onNeedAWebsiteClick?.()}>
                <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 border border-amber-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] h-full flex flex-col justify-center transition-all duration-300">
                    {/* Background */}
                    <div className="absolute inset-0">
                        <Image src="/images/events/ramadan_2026_new.png" alt="Ramadan Background" fill priority className="object-cover opacity-30 scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/95 via-indigo-950/70 to-purple-950/90" />
                    </div>
                    {/* Store Name Overlay */}
                    {storeName && (
                        <div className="absolute top-4 sm:top-5 left-4 sm:left-5 z-20 max-w-[40%] sm:max-w-[45%]">
                            <div className="bg-black/30 backdrop-blur-md rounded-[1rem] sm:rounded-2xl border border-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg">
                                <p className="text-white font-bold text-[9px] sm:text-[11px] truncate">
                                    {storeName}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* BizConnect Badge */}
                    <div className="absolute bottom-3 right-4 z-20">
                        <div className="bg-black/30 backdrop-blur-md rounded-xl sm:rounded-[1rem] border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg flex items-center gap-1">
                            <span className="text-[7px] sm:text-[9px] text-white/70 font-medium tracking-tight">Powered by</span>
                            <span className="text-[8px] sm:text-[10px] font-bold text-amber-400">BizConNet&trade;</span>
                        </div>
                    </div>

                    {/* Floating decorative stars */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-amber-400/20"
                            style={{
                                top: `${15 + i * 16}%`,
                                left: `${5 + i * 20}%`,
                            }}
                            animate={{
                                y: [0, -8, 0],
                                opacity: [0.15, 0.35, 0.15],
                                scale: [0.8, 1, 0.8],
                            }}
                            transition={{
                                duration: 3 + i * 0.5,
                                repeat: Infinity,
                                delay: i * 0.7,
                                ease: "easeInOut",
                            }}
                        >
                            <Star className="w-3 h-3 fill-current" />
                        </motion.div>
                    ))}

                    <div className="relative z-10 px-4 sm:px-8 py-5 sm:py-8 flex items-center gap-4 sm:gap-8 h-full">
                        {/* Left: Progress Ring with Day Number */}
                        <div className="relative flex-shrink-0">
                            <ProgressRing progress={progress} size={ringSize} strokeWidth={5} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-400/60 tracking-widest">Day</span>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={currentDay}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="text-2xl sm:text-4xl font-black text-amber-400 leading-none tabular-nums"
                                    >
                                        {currentDay}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="flex flex-col gap-2.5 min-w-0 flex-1">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-[1px] w-5 bg-amber-400/30" />
                                    <span className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-[0.25em]">Ramadan 2026</span>
                                </div>
                                <h3 className="text-sm min-[360px]:text-base min-[390px]:text-lg sm:text-2xl font-black text-white tracking-tight leading-tight whitespace-nowrap flex items-center gap-1.5">
                                    {greeting.text} <span className="text-amber-400">{greeting.emoji}</span>
                                </h3>
                            </div>

                            {/* Daily message */}
                            <div className="bg-black/20 backdrop-blur-sm rounded-2xl px-3.5 py-2.5 border border-white/5">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={currentDay}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-[10px] sm:text-xs text-indigo-100/80 font-medium leading-relaxed italic"
                                    >
                                        &ldquo;{dailyMessage}&rdquo;
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            {/* Mini progress bar */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                    />
                                </div>
                                <span className="text-[9px] font-bold text-amber-400/60 tabular-nums whitespace-nowrap">
                                    {currentDay}/{TOTAL_DAYS}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Shine animation */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -skew-x-12"
                        animate={{ x: ['-150%', '250%'] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={className || ''}>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onRefresh?.();
                }}
                className="relative overflow-hidden rounded-[2.5rem] bg-emerald-950 border border-amber-400/40 shadow-2xl min-h-[180px] sm:min-h-[220px] h-full flex flex-col justify-center group cursor-pointer active:scale-[0.98] transition-all duration-200"
            >
                <div className="absolute inset-0">
                    {/* Background Texture */}
                    <Image src="/images/events/ramadan_2026_new.png" alt="Eid Background" fill priority className="object-cover opacity-[0.15] mix-blend-overlay scale-110 group-hover:scale-105 transition-transform duration-1000" />
                    {/* New Emerald/Teal Gradient for Eid */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-teal-950/85 to-emerald-900/95" />
                </div>
                {/* Store Name Overlay */}
                {storeName && (
                    <div className="absolute top-4 sm:top-5 left-4 sm:left-5 z-20 max-w-[40%] sm:max-w-[45%]">
                        <div className="bg-black/20 backdrop-blur-md rounded-[1rem] sm:rounded-2xl border border-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg">
                            <p className="text-white font-bold text-[9px] sm:text-[11px] truncate">
                                {storeName}
                            </p>
                        </div>
                    </div>
                )}
                {/* BizConnect Badge */}
                <div className="absolute bottom-3 right-4 z-20">
                    <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-[1rem] border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg flex items-center gap-1">
                        <span className="text-[7px] sm:text-[9px] text-white/70 font-medium tracking-tight">Powered by</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-amber-400">BizConNet&trade;</span>
                    </div>
                </div>

                {/* Floating Elements (Stars & Lantern effects) */}
                <div className="absolute top-4 left-6 opacity-40">
                    <motion.div animate={{ rotate: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                        <Moon className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300" />
                    </motion.div>
                </div>
                <div className="absolute bottom-5 right-6 opacity-30">
                    <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6], rotate: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                        <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-amber-300" />
                    </motion.div>
                </div>

                {/* Random Floating Stars */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={`eid-star-${i}`}
                        className="absolute text-amber-300/40"
                        style={{ top: `${15 + i * 15}%`, left: `${8 + i * 16}%` }}
                        animate={{ y: [0, -12, 0], opacity: [0.1, 0.7, 0.1], scale: [0.7, 1.2, 0.7] }}
                        transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                    >
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    </motion.div>
                ))}

                <div className="relative z-10 px-6 py-8 flex flex-col items-center text-center gap-3 sm:gap-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut", type: "spring", bounce: 0.4 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full" />
                        <span className="text-3xl sm:text-5xl relative z-10 drop-shadow-xl block mb-1">✨</span>
                    </motion.div>

                    <div className="space-y-1.5 sm:space-y-2 pb-5 sm:pb-0">
                        <h3 className="text-[26px] min-[390px]:text-[30px] sm:text-5xl font-black text-white tracking-tight leading-tight flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                            Eid <span className="text-amber-400 relative">
                                Mubarak!
                                <motion.div
                                    className="absolute -inset-2 bg-amber-400/20 blur-xl rounded-full -z-10"
                                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </span>
                        </h3>

                        <div className="flex items-center justify-center gap-2 sm:gap-3 py-1 sm:py-1.5 opacity-80">
                            <div className="h-[1px] w-8 sm:w-12 bg-amber-400/40" />
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-current" />
                            <div className="h-[1px] w-8 sm:w-12 bg-amber-400/40" />
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] min-[360px]:text-[11px] sm:text-[15px] text-emerald-50/90 font-bold tracking-wider max-w-[200px] min-[360px]:max-w-[240px] sm:max-w-md mx-auto italic drop-shadow-md">
                                TaqabbalAllahu Minna Wa Minkum
                            </p>
                            <div className="bg-emerald-800/40 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 group-hover:bg-emerald-700/60 transition-colors">
                                <RefreshCw className="w-3 h-3 text-amber-400 animate-none group-active:animate-spin" />
                                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tighter">Check for Updates</span>
                            </div>
                        </div>
                        <p className="text-[8px] min-[360px]:text-[9px] sm:text-[11px] text-emerald-100/60 font-black tracking-widest max-w-[180px] min-[360px]:max-w-[220px] sm:max-w-sm mx-auto uppercase leading-tight mt-1">
                            May Allah accept from us and from you.
                        </p>
                    </div>
                </div>

                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    animate={{ x: ['-200%', '300%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
                />
            </div>
        </div>
    );
}
