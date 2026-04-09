'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import RamadanCountdown from './RamadanCountdown';
import Image from 'next/image';
import { StoreMeta } from '@/types/store';
import { BusinessCardModal } from '../products/BusinessCardModal';
import { ChevronRight, ChevronLeft, BadgeCheck, Sparkles, Users } from 'lucide-react';

interface HeroCarouselProps {
    storeMeta?: StoreMeta;
    onNeedAWebsiteClick?: () => void;
    onRefresh?: () => void;
}

const variants = {
    enter: (direction: number) => {
        return {
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        };
    },
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => {
        return {
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        };
    }
};

const swipeConfidenceThreshold = 500;
const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
};

export default function HeroCarousel({ storeMeta, onNeedAWebsiteClick, onRefresh }: HeroCarouselProps) {
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isBusinessCardOpen, setIsBusinessCardOpen] = useState(false);

    const is420Hub = storeMeta?.id === '420-Hub' || storeMeta?.name === '420-Hub' || storeMeta?.name === '420 Hub';
    const isStunnerStores = storeMeta?.id?.toLowerCase().includes('stunner') || storeMeta?.name?.toLowerCase().includes('stunner');
    const isMediaInfluencer = storeMeta?.storeType === 'media-influencer';
    const isEscrowStore = storeMeta?.paymentFlow === 'paystack_escrow';
    const isInfluencerOrEscrow = isMediaInfluencer || isEscrowStore;
    const isSolarStore = storeMeta?.storeType === 'solar';
    const isFashion = storeMeta?.storeType === 'fashion';

    const showWelcomeSlide = false;
    const slideCount = isStunnerStores ? 2 : 1;

    const paginate = (newDirection: number) => {
        if (slideCount <= 1) return;
        setPage(page + newDirection);
        setDirection(newDirection);
    };

    const pageIndex = Math.abs(page % slideCount);

    useEffect(() => {
        if (slideCount <= 1) return;
        const timer = setInterval(() => {
            paginate(1);
        }, 8000);
        return () => clearInterval(timer);
    }, [page, slideCount]);

    const CustomSmokeShopCard = () => {
        return (
            <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-emerald-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] flex flex-col justify-center w-full h-full">
                <div className="absolute inset-0 bg-black">
                    <Image src="/images/smoke-shop-bg.png" fill priority className="object-cover opacity-50" alt="Smoke Shop Background" />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-black/80 to-black" />
                </div>

                <div className="relative z-10 px-6 sm:px-8 py-6 sm:py-8 flex flex-col justify-center h-full items-start text-left gap-4">
                    <div className="space-y-2 w-full">
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                    Premium Smoke Shop
                                </span>
                            </div>
                        </div>

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none break-words">
                            Welcome to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-600">
                                {storeMeta?.name || '420-Hub'}
                            </span>
                        </h3>

                        <p className="text-sm text-gray-300 max-w-xs sm:max-w-sm font-medium leading-relaxed line-clamp-3">
                            Discover the finest collection of premium accessories and essentials. Quality you can trust.
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-4 right-6 z-20">
                    <span className="text-[10px] sm:text-xs font-semibold text-white/40 tracking-wider">
                        Powered by <span className="text-emerald-500/80">Compass 🧭</span>
                    </span>
                </div>

                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
            </div>
        );
    };

    const CustomStunnerCard = () => {
        return (
            <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-violet-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] flex flex-col justify-center w-full h-full">
                <div className="absolute inset-0 bg-black">
                    <Image src="/images/stunner-bg.png" fill priority className="object-cover opacity-40 mix-blend-luminosity" alt="Stunner Stores Background" />
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-black/80 to-black" />
                </div>

                <div className="relative z-10 px-6 sm:px-8 py-6 sm:py-8 flex flex-col justify-center h-full items-start text-left gap-4">
                    <div className="space-y-2 w-full">
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                                    Premium Lifestyle
                                </span>
                            </div>
                        </div>

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none break-words">
                            Welcome to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                                {storeMeta?.name || 'Stunner Stores'}
                            </span>
                        </h3>

                        <p className="text-sm text-gray-300 max-w-xs sm:max-w-sm font-medium leading-relaxed line-clamp-3">
                            Elevate your everyday with our curated collection of premium lifestyle accessories and more.
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-4 right-6 z-20">
                    <span className="text-[10px] sm:text-xs font-semibold text-white/40 tracking-wider">
                        Powered by <span className="text-violet-500/80">Compass 🧭</span>
                    </span>
                </div>

                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />
            </div>
        );
    };

    const CustomStunnerGlamCard = () => {
        return (
            <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-violet-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] flex flex-col justify-center w-full h-full">
                <div className="absolute inset-0 bg-black">
                    <Image src="/images/stunner-unisex-glam-bg.png" fill priority className="object-cover opacity-40 mix-blend-luminosity" alt="Stunner Unisex Hair and Glam Background" />
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-black/80 to-black" />
                </div>

                <div className="relative z-10 px-6 sm:px-8 py-6 sm:py-8 flex flex-col justify-center h-full items-start text-left gap-4">
                    <div className="space-y-2 w-full">
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                                    Unisex Hair & Glam
                                </span>
                            </div>
                        </div>

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none break-words">
                            Welcome to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                                {storeMeta?.name || 'Stunner Stores'}
                            </span>
                        </h3>

                        <p className="text-sm text-gray-300 max-w-xs sm:max-w-sm font-medium leading-relaxed line-clamp-3">
                            Discover premium salon services, luxury grooming tools, and essential haircare for everyone.
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-4 right-6 z-20">
                    <span className="text-[10px] sm:text-xs font-semibold text-white/40 tracking-wider">
                        Powered by <span className="text-violet-500/80">Compass 🧭</span>
                    </span>
                </div>

                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-violet-500/10 blur-[60px] rounded-full pointer-events-none" />
            </div>
        );
    };

    const WelcomeCard = () => {
        const isFashion = storeMeta?.storeType === 'fashion';
        const welcomeImage = isFashion ? '/images/fashion-welcome.png' : '/images/store-welcome.png';
        const badgeText = isFashion ? 'RTW Fashion' : 'Premium Dining';
        const welcomeTitle = isFashion ? 'Welcome to' : 'Welcome to';
        const welcomeSubtitle = isFashion ? (storeMeta?.name || 'Our Atelier') : (storeMeta?.name || 'Our Restaurant');
        const description = isFashion
            ? 'Discover trusted Ready-to-Wear fashion and household essentials from a brand you can rely on. Quality, style, and value combined.'
            : 'Experience the finest culinary delights, crafted with passion and tradition.';

        return (
            <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 border border-amber-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] flex flex-col justify-center w-full h-full">
                <div className="absolute inset-0 bg-slate-900">
                    <Image
                        src={welcomeImage}
                        fill
                        priority
                        className="object-cover opacity-60"
                        alt={badgeText}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 px-6 sm:px-8 py-6 sm:py-8 flex flex-col justify-center h-full items-start text-left gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                    {badgeText}
                                </span>
                            </div>
                            {isFashion && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                        Household Items
                                    </span>
                                </div>
                            )}
                        </div>

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none break-words">
                            {welcomeTitle} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                                {welcomeSubtitle}
                            </span>
                        </h3>

                        <p className="text-sm text-gray-300 max-w-xs sm:max-w-sm font-medium leading-relaxed line-clamp-3">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none" />
            </div>
        );
    };

    const CustomSolarCard = () => {
        const isEscrow = storeMeta?.paymentFlow === 'paystack_escrow';
        return (
            <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-amber-500/20 shadow-2xl min-h-[180px] sm:min-h-[220px] flex flex-col justify-center w-full h-full">
                {/* Animated glow blobs */}
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-12 -right-12 w-56 h-56 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute -bottom-16 -left-8 w-48 h-48 bg-orange-600/20 blur-[80px] rounded-full pointer-events-none"
                />

                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(251,191,36,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.5) 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }}
                />

                <div className="relative z-10 px-6 sm:px-8 py-6 sm:py-8 flex flex-col justify-center h-full items-start text-left gap-3">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Clean Energy Solutions</span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500">
                            Power Your World.
                        </span>
                    </h3>

                    {/* Sub-text */}
                    <p className="text-sm text-gray-400 max-w-xs font-medium leading-relaxed">
                        Certified solar panels, inverters &amp; batteries — trusted energy for home &amp; business.
                    </p>

                </div>

                {/* Powered by Compass watermark — non-escrow only */}
                {!isEscrow && (
                    <div className="absolute bottom-4 right-6 z-20">
                        <span className="text-[10px] sm:text-xs font-semibold text-white/30 tracking-wider">
                            Powered by <span className="text-amber-500/70">Compass 🧭</span>
                        </span>
                    </div>
                )}
            </div>
        );
    };

    const CustomInfluencerCard = () => {
        return (
            <motion.div
                onClick={() => setIsBusinessCardOpen(true)}
                className={`relative overflow-hidden rounded-[2.75rem] ${isFashion ? 'luxury-fashion-bg' : 'influencer-live-bg'} border border-white/20 shadow-2xl min-h-[180px] sm:min-h-[220px] flex flex-col w-full h-full group cursor-pointer`}
                animate={{ boxShadow: ['0 0 0px rgba(192,38,211,0)', '0 0 40px rgba(192,38,211,0.4)', '0 0 0px rgba(192,38,211,0)'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Primary Animated Mesh Blobs — organic breathing rhythm */}
                    <motion.div
                        animate={{
                            x: [0, 90, -20, 0],
                            y: [0, 40, 70, 0],
                            scale: [1, 1.25, 1.05, 1],
                            opacity: [0.25, 0.55, 0.35, 0.25]
                        }}
                        transition={{
                            duration: isFashion ? 25 : 18,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className={`absolute -top-[10%] -left-[10%] w-[70%] h-[70%] ${isFashion ? 'bg-amber-600/30' : 'bg-rose-500/40'} blur-[110px] rounded-full mix-blend-screen`}
                    />
                    <motion.div
                        animate={{
                            x: [0, -70, 20, 0],
                            y: [0, 90, 40, 0],
                            scale: [1, 1.15, 0.95, 1],
                            opacity: [0.2, 0.5, 0.3, 0.2]
                        }}
                        transition={{
                            duration: isFashion ? 30 : 22,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 3
                        }}
                        className={`absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] ${isFashion ? 'bg-orange-950/40' : 'bg-indigo-600/40'} blur-[110px] rounded-full mix-blend-screen`}
                    />
                    <motion.div
                        animate={{
                            x: [0, 40, -30, 0],
                            y: [0, -60, 20, 0],
                            scale: [1, 1.35, 0.9, 1],
                            opacity: [0.12, 0.38, 0.2, 0.12]
                        }}
                        transition={{
                            duration: isFashion ? 35 : 28,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 7
                        }}
                        className={`absolute top-1/4 left-1/3 w-[40%] h-[40%] ${isFashion ? 'bg-yellow-500/10' : 'bg-amber-400/25'} blur-[90px] rounded-full mix-blend-screen`}
                    />

                    {/* Shimmer sweep — glassy liquid surface */}
                    <motion.div
                        animate={{ y: ['-110%', '210%'] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }}
                        className="absolute inset-x-0 h-[35%] bg-gradient-to-b from-white/0 via-white/[0.06] to-white/0 pointer-events-none"
                    />

                    {/* Subtle Premium Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.4] mix-blend-overlay pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255, 255, 255, 0.15) 1.5px, transparent 0)',
                            backgroundSize: '28px 28px'
                        }}
                    />

                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                    <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
                </div>

                <div className="relative z-10 px-6 sm:px-8 py-6 sm:py-8 flex flex-col justify-center h-full items-start text-left gap-4">
                    <div className="space-y-2 w-full">
                        <div className="flex flex-nowrap gap-1.5 items-center w-full overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-md shadow-lg flex-shrink-0"
                            >
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">
                                    {isMediaInfluencer ? 'Premium Influencer' : 'Premium Store'}
                                </span>
                            </motion.div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 backdrop-blur-md flex-shrink-0">
                                <BadgeCheck className="w-3 h-3 text-blue-300" />
                                <span className="text-[9px] font-bold text-blue-100 uppercase tracking-wider whitespace-nowrap">
                                    {isMediaInfluencer ? 'Verified Media Kit' : 'Verified Merchant'}
                                </span>
                            </div>
                        </div>

                        <motion.h3
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none whitespace-nowrap"
                        >
                            Official Business Page
                        </motion.h3>

                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-sm sm:text-base md:text-lg font-bold text-white/90 uppercase tracking-widest">
                                {isMediaInfluencer ? 'For' : 'Led by'} <span className="text-amber-400"> {storeMeta?.ceoName || storeMeta?.name || 'Aisha Ibrahem'}</span>
                            </span>
                            <div className="h-px w-8 bg-gradient-to-r from-amber-400/50 to-transparent" />
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xs sm:text-sm text-white/90 max-w-[280px] sm:max-w-sm font-medium leading-tight mt-1"
                        >
                            {isMediaInfluencer
                                ? 'Elite PR services & premium products, safely secured by Compass🧭 Escrow.'
                                : storeMeta?.storeType === 'fashion'
                                    ? 'Professionally crafted leather goods. Payments secured by Compass Escrow.'
                                    : 'Professional store services, secured by Compass🧭 Escrow.'}
                        </motion.p>


                    </div>
                </div>

                {/* Powered by Paystack */}
                <div className="absolute bottom-6 sm:bottom-8 right-8 z-20 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-white/60 tracking-widest uppercase">
                        Powered by <span className="text-white">Paystack</span>
                    </span>
                </div>
            </motion.div>
        );
    };

    const InfluencerStatsCard = () => {
        const stats = storeMeta?.socialStats || {
            instagramFollowers: 45000,
            tiktokFollowers: 125000,
            youtubeSubscribers: 8500,
            twitterFollowers: 12000
        };

        const formatNumber = (num: number) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num.toString();
        };

        return (
            <div className="relative overflow-hidden rounded-[2.75rem] bg-zinc-950 border border-rose-500/30 shadow-2xl min-h-[180px] sm:min-h-[220px] flex flex-col w-full h-full">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-zinc-950 to-rose-950 opacity-90" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(244,63,94,0.15),transparent)]" />
                </div>

                <div className="relative z-10 px-8 pt-4 pb-12 flex flex-col justify-between h-full w-full overflow-hidden">
                    <div className="flex flex-row items-center gap-2 overflow-hidden">
                        <div className="flex items-center gap-1 shrink-0">
                            <Users className="w-2.5 h-2.5 text-rose-400" />
                            <h3 className="text-[8px] font-black text-rose-400 uppercase tracking-widest whitespace-nowrap">Global Reach</h3>
                        </div>
                        <span className="text-white/20 text-[10px]">•</span>
                        <p className="text-xs sm:text-sm font-black text-white leading-none whitespace-nowrap uppercase tracking-tighter">Social Media Stats</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                        {[
                            { label: 'Instagram', value: stats.instagramFollowers || 0, color: 'text-pink-400', icon: '📸' },
                            { label: 'TikTok', value: stats.tiktokFollowers || 0, color: 'text-cyan-400', icon: '🎵' },
                            { label: 'YouTube', value: stats.youtubeSubscribers || 0, color: 'text-red-500', icon: '📺' },
                            { label: 'Twitter/X', value: stats.twitterFollowers || 0, color: 'text-blue-400', icon: '🐦' }
                        ].map((item, idx) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/5 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all min-h-[60px]"
                            >
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-sm">{item.icon}</span>
                                    <span className={`text-base font-black ${item.color} leading-none tracking-tighter`}>{formatNumber(item.value)}</span>
                                </div>
                                <span className="text-[7px] font-bold text-white/40 uppercase tracking-tighter">{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative mx-4 mb-6 h-[220px] overflow-hidden rounded-[2.5rem]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={pageIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    drag={slideCount > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }: PanInfo) => {
                        const swipe = swipePower(offset.x, velocity.x);

                        if (swipe < -swipeConfidenceThreshold) {
                            paginate(1);
                        } else if (swipe > swipeConfidenceThreshold) {
                            paginate(-1);
                        }
                    }}
                    className="absolute w-full h-full cursor-pointer"
                >
                    {is420Hub ? (
                        <CustomSmokeShopCard />
                    ) : isStunnerStores ? (
                        pageIndex === 0 ? <CustomStunnerCard /> : <CustomStunnerGlamCard />
                    ) : isSolarStore ? (
                        <CustomSolarCard />
                    ) : isInfluencerOrEscrow ? (
                        pageIndex === 0 ? <CustomInfluencerCard /> : <InfluencerStatsCard />
                    ) : pageIndex === 0 ? (
                        <RamadanCountdown className="w-full h-full" storeName={storeMeta?.name} onNeedAWebsiteClick={onNeedAWebsiteClick} onRefresh={onRefresh} />
                    ) : showWelcomeSlide && pageIndex === 1 ? (
                        <WelcomeCard />
                    ) : null}
                </motion.div>
            </AnimatePresence>

            {/* Pagination / Progress Indicators */}
            {slideCount > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                    {[...Array(slideCount)].map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation();
                                setDirection(i > pageIndex ? 1 : -1);
                                setPage(i);
                            }}
                            className={`h-1 rounded-full transition-all duration-500 pointer-events-auto ${i === pageIndex
                                ? `w-4 ${isInfluencerOrEscrow ? 'bg-indigo-400' : (is420Hub ? 'bg-emerald-400' : 'bg-rose-500')}`
                                : 'w-1 bg-white/20 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <BusinessCardModal
                open={isBusinessCardOpen}
                onClose={() => setIsBusinessCardOpen(false)}
                storeMeta={storeMeta}
            />
        </div>
    );
}
