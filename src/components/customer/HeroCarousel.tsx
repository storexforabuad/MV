'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import RamadanCountdown from './RamadanCountdown';
import Image from 'next/image';
import { StoreMeta } from '@/types/store';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface HeroCarouselProps {
    storeMeta?: StoreMeta;
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

export default function HeroCarousel({ storeMeta }: HeroCarouselProps) {
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(0);

    // Only show the second slide if it's a restaurant or fashion store
    const showWelcomeSlide = false;
    const slideCount = 1;

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
                    className="absolute w-full h-full"
                >
                    {showWelcomeSlide && pageIndex === 0 ? (
                        <WelcomeCard />
                    ) : (
                        <RamadanCountdown className="w-full h-full" storeName={storeMeta?.name} />
                    )}
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
                                ? 'bg-amber-400 w-6 h-1.5'
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
