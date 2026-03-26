'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import RamadanCountdown from './RamadanCountdown';
import Image from 'next/image';
import { StoreMeta } from '@/types/store';
import { ChevronRight, ChevronLeft } from 'lucide-react';

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

    const is420Hub = storeMeta?.id === '420-Hub' || storeMeta?.name === '420-Hub' || storeMeta?.name === '420 Hub';
    const isStunnerStores = storeMeta?.id?.toLowerCase().includes('stunner') || storeMeta?.name?.toLowerCase().includes('stunner');
    // Only show the second slide if it's a restaurant or fashion store
    const showWelcomeSlide = false;
    const slideCount = isStunnerStores ? 2 : 1; // Stunner Stores has the Glam section slide

    const paginate = (newDirection: number) => {
        if (slideCount <= 1) return;
        setPage(page + newDirection);
        setDirection(newDirection);
    };

    // Wrap page index
    const pageIndex = Math.abs(page % slideCount);

    // Auto-play if multiple slides
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
                    {/* Add your generated image here later! */}
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

                {/* Powered by Bizconnet™ at the bottom right */}
                <div className="absolute bottom-4 right-6 z-20">
                    <span className="text-[10px] sm:text-xs font-semibold text-white/40 tracking-wider">
                        Powered by <span className="text-emerald-500/80">BizConNet™</span>
                    </span>
                </div>

                {/* Decorative shine */}
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

                {/* Powered by Bizconnet™ at the bottom right */}
                <div className="absolute bottom-4 right-6 z-20">
                    <span className="text-[10px] sm:text-xs font-semibold text-white/40 tracking-wider">
                        Powered by <span className="text-violet-500/80">BizConNet™</span>
                    </span>
                </div>

                {/* Decorative shine */}
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

                {/* Powered by Bizconnet™ at the bottom right */}
                <div className="absolute bottom-4 right-6 z-20">
                    <span className="text-[10px] sm:text-xs font-semibold text-white/40 tracking-wider">
                        Powered by <span className="text-violet-500/80">BizConNet™</span>
                    </span>
                </div>

                {/* Decorative shine */}
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

                {/* Decorative shine */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none" />
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
                    onClick={() => onNeedAWebsiteClick?.()}
                >
                    {is420Hub ? (
                        <CustomSmokeShopCard />
                    ) : isStunnerStores ? (
                        pageIndex === 0 ? <CustomStunnerCard /> : <CustomStunnerGlamCard />
                    ) : pageIndex === 0 ? (
                        <RamadanCountdown className="w-full h-full" storeName={storeMeta?.name} onNeedAWebsiteClick={onNeedAWebsiteClick} onRefresh={onRefresh} />
                    ) : showWelcomeSlide && pageIndex === 1 ? (
                        <WelcomeCard />
                    ) : null}
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            {slideCount > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
                    {[...Array(slideCount)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setDirection(i > pageIndex ? 1 : -1);
                                setPage(i);
                            }}
                            className={`pointer-events-auto rounded-full transition-all duration-300 ${i === pageIndex
                                ? `${isStunnerStores ? 'bg-cyan-400' : is420Hub ? 'bg-emerald-400' : 'bg-amber-400'} w-6 h-1.5`
                                : 'bg-white/30 hover:bg-white/50 w-1.5 h-1.5'
                                }`}
                            style={{ minWidth: '6px', minHeight: '6px', padding: 0, border: 'none' }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
