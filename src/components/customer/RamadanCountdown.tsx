'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, Star, Download } from 'lucide-react';
import Image from 'next/image';
import html2canvas from 'html2canvas';

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
const RAMADAN_END = new Date('2026-03-20T00:00:00'); // 30 days from Feb 18
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

export default function RamadanCountdown({ className, storeName }: { className?: string; storeName?: string }) {
    const [now, setNow] = useState<Date | null>(null);
    const ringSize = useRingSize();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
    const downloadPromptTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-dismiss download prompt
    useEffect(() => {
        if (showDownloadPrompt) {
            if (downloadPromptTimerRef.current) clearTimeout(downloadPromptTimerRef.current);
            downloadPromptTimerRef.current = setTimeout(() => {
                setShowDownloadPrompt(false);
            }, 5000);
        }
        return () => {
            if (downloadPromptTimerRef.current) clearTimeout(downloadPromptTimerRef.current);
        };
    }, [showDownloadPrompt]);

    const handleDownload = useCallback(async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!cardRef.current || isDownloading) return;

        setShowDownloadPrompt(false);
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#1e1b4b', // indigo-950
                scale: 3, // High-res for WhatsApp status
                useCORS: true,
                logging: false,
                borderRadius: '2.5rem',
            } as any);
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const day = now ? getCurrentDay(now) : 1;
                a.href = url;
                a.download = `ramadan-day-${day}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setTimeout(() => setIsDownloading(false), 1500);
        }
    }, [isDownloading, now]);

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
            <div className={className}>
                <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 border border-amber-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] h-full flex flex-col justify-center">
                    <div className="absolute inset-0">
                        <Image src="/images/events/ramadan_2026_new.png" alt="Ramadan Background" fill className="object-cover opacity-40 scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-indigo-950/40 to-indigo-950/90" />
                    </div>
                    {/* Store Name Overlay */}
                    {storeName && (
                        <div className="absolute top-3 left-3 z-20 max-w-[40%] sm:max-w-[45%]">
                            <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg">
                                <p className="text-white font-bold text-[9px] sm:text-[11px] truncate">
                                    {storeName}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* BizConnect Badge */}
                    <div className="absolute bottom-2 right-3 z-20">
                        <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg flex items-center gap-1">
                            <span className="text-[7px] sm:text-[9px] text-white/70 font-medium tracking-tight">Powered by</span>
                            <span className="text-[8px] sm:text-[10px] font-bold text-amber-400">BizConnect</span>
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
            <div className={className}>
                <div
                    ref={cardRef}
                    onClick={() => !showDownloadPrompt && !isDownloading && setShowDownloadPrompt(true)}
                    className={`relative overflow-hidden rounded-[2.5rem] bg-indigo-950 border border-amber-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] h-full flex flex-col justify-center transition-all duration-300 ${!showDownloadPrompt && !isDownloading ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                >
                    {/* Background */}
                    <div className="absolute inset-0">
                        <Image src="/images/events/ramadan_2026_new.png" alt="Ramadan Background" fill className="object-cover opacity-30 scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/95 via-indigo-950/70 to-purple-950/90" />
                    </div>
                    {/* Store Name Overlay */}
                    {storeName && (
                        <div className="absolute top-3 left-3 z-20 max-w-[40%] sm:max-w-[45%]">
                            <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg">
                                <p className="text-white font-bold text-[9px] sm:text-[11px] truncate">
                                    {storeName}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* BizConnect Badge */}
                    <div className="absolute bottom-2 right-3 z-20">
                        <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg flex items-center gap-1">
                            <span className="text-[7px] sm:text-[9px] text-white/70 font-medium tracking-tight">Powered by</span>
                            <span className="text-[8px] sm:text-[10px] font-bold text-amber-400">BizConnect</span>
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

                    {/* Download prompt overlay */}
                    <AnimatePresence>
                        {showDownloadPrompt && (
                            <motion.div
                                data-html2canvas-ignore="true"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center gap-4"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDownloadPrompt(false);
                                }}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 10 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <button
                                        onClick={handleDownload}
                                        className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20 active:scale-95 transition-transform"
                                    >
                                        <Download className="w-8 h-8 text-black" />
                                    </button>
                                    <div className="space-y-1">
                                        <p className="text-white font-black text-sm uppercase tracking-wider">
                                            WhatsApp Status
                                        </p>
                                        <p className="text-amber-200/60 text-[10px] font-medium">
                                            Tap to download
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Saving overlay */}
                    <AnimatePresence>
                        {isDownloading && (
                            <motion.div
                                data-html2canvas-ignore="true"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center"
                            >
                                <div className="flex items-center gap-2 bg-black/40 rounded-full px-4 py-2 border border-amber-400/20">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Download className="w-4 h-4 text-amber-400" />
                                    </motion.div>
                                    <span className="text-xs font-bold text-amber-400">Saving...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Shine animation */}
                    <motion.div
                        data-html2canvas-ignore="true"
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -skew-x-12"
                        animate={{ x: ['-150%', '250%'] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
                    />
                </div>
            </div>
        );
    }

    // ── Post-Ramadan: Eid Mubarak ──
    return (
        <div className={className}>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 border border-amber-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] h-full flex flex-col justify-center">
                <div className="absolute inset-0">
                    <Image src="/images/events/ramadan_2026_new.png" alt="Eid Background" fill className="object-cover opacity-25 scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/95 via-purple-950/80 to-indigo-950/95" />
                </div>
                {/* Store Name Overlay */}
                {storeName && (
                    <div className="absolute top-3 left-3 z-20 max-w-[40%] sm:max-w-[45%]">
                        <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg">
                            <p className="text-white font-bold text-[9px] sm:text-[11px] truncate">
                                {storeName}
                            </p>
                        </div>
                    </div>
                )}
                {/* BizConnect Badge */}
                <div className="absolute bottom-2 right-3 z-20">
                    <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg flex items-center gap-1">
                        <span className="text-[7px] sm:text-[9px] text-white/70 font-medium tracking-tight">Powered by</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-amber-400">BizConnect</span>
                    </div>
                </div>
                <div className="absolute top-4 left-6 opacity-30"><Moon className="w-12 h-12 text-amber-400 rotate-12" /></div>
                <div className="absolute bottom-4 right-6 opacity-20"><Sparkles className="w-16 h-16 text-amber-400" /></div>
                <div className="relative z-10 px-6 py-8 flex flex-col items-center text-center gap-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-5xl sm:text-6xl"
                    >
                        🎉
                    </motion.div>
                    <div className="space-y-1">
                        <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                            Eid <span className="text-amber-400">Mubarak!</span>
                        </h3>
                        <p className="text-[11px] sm:text-sm text-indigo-100/70 font-medium tracking-wide max-w-[280px] sm:max-w-md mx-auto">
                            May Allah accept our fasting, prayers, and good deeds. Ameen.
                        </p>
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
