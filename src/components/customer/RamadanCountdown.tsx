'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function RamadanCountdown() {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    useEffect(() => {
        const targetDate = new Date('2026-02-17T00:00:00');

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!timeLeft) return null;

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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-4 mb-6"
        >
            <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 border border-amber-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] flex flex-col justify-center">
                {/* Background Image with Parallax-like effect */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/events/ramadan_2026.png"
                        alt="Ramadan Background"
                        fill
                        className="object-cover opacity-40 scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-indigo-950/40 to-indigo-950/90" />
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 left-6 opacity-30">
                    <Moon className="w-12 h-12 text-amber-400 rotate-12" />
                </div>
                <div className="absolute bottom-4 right-6 opacity-20">
                    <Sparkles className="w-16 h-16 text-amber-400" />
                </div>

                <div className="relative z-10 px-6 py-8 flex flex-col items-center text-center gap-6">
                    {/* Header Info */}
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

                    {/* Countdown Grid */}
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

                {/* Premium Shine Animation */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    animate={{
                        x: ['-150%', '250%'],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 3
                    }}
                />
            </div>
        </motion.div>
    );
}
