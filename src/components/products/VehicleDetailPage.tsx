import React, { useState } from 'react';
import Image from 'next/image';
import { Product, VehicleProduct } from '../../types/product';
import { StoreMeta } from '../../types/store';
import { formatPrice } from '../../utils/price';
import { ChevronLeftIcon, ChevronRightIcon, ShareIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, MapPinIcon, SparklesIcon, CogIcon, BoltIcon, TruckIcon, SwatchIcon, TagIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isVehicleProduct } from '../../utils/productHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomer } from '@/context/CustomerContext';

interface VehicleDetailPageProps {
    product: Product;
    storeMeta: StoreMeta | null;
    storeId: string;
}

const SpecRow = ({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) => (
    <div className="flex items-start gap-2.5">
        {icon && <div className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>}
        <div className="flex flex-col min-w-0">
            <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
            <span className="text-sm font-medium text-text-primary truncate">{value}</span>
        </div>
    </div>
);

function GlassButton({ onClick, children, 'aria-label': ariaLabel }: { onClick: () => void; children: React.ReactNode; 'aria-label': string }) {
    return (
        <motion.button
            className="relative card-glass rounded-full flex items-center justify-center p-3 shadow-lg pointer-events-auto"
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={ariaLabel}
        >
            {children}
        </motion.button>
    );
}

export default function VehicleDetailPage({ product, storeMeta, storeId }: VehicleDetailPageProps) {
    const router = useRouter();
    const { customer } = useCustomer();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    // Type guard to ensure we only render vehicle products
    if (!isVehicleProduct(product)) {
        console.error('VehicleDetailPage received non-vehicle product');
        return null;
    }

    // Guard against null storeMeta
    if (!storeMeta) {
        console.error('VehicleDetailPage requires storeMeta');
        return null;
    }

    // Touch handlers for mobile swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentImageIndex < product.images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }

        if (isRightSwipe && currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }

        // Reset
        setTouchStart(0);
        setTouchEnd(0);
    };

    // Navigation handlers
    const handlePrevImage = () => {
        setCurrentImageIndex(prev => prev > 0 ? prev - 1 : prev);
    };

    const handleNextImage = () => {
        setCurrentImageIndex(prev => prev < product.images.length - 1 ? prev + 1 : prev);
    };

    const handleContactDealer = () => {
        const message = `Hello! I'm interested in the ${product.name} listed at ${formatPrice(product.price)}.
    
Details:
• Year: ${product.vehicleDetails.year}
• Mileage: ${product.vehicleDetails.mileage} km
• Condition: ${product.vehicleDetails.condition}
• Location: ${product.vehicleDetails.location}

Please share more details.`;

        const whatsappUrl = `https://wa.me/${storeMeta.whatsapp}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleScheduleTestDrive = () => {
        const message = `Hello! I'd like to schedule a test drive for the ${product.name}.

Listed at: ${formatPrice(product.price)}

Preferred date: ___
Preferred time: Morning / Afternoon / Evening

Looking forward to viewing!`;
        const whatsappUrl = `https://wa.me/${storeMeta.whatsapp}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleShare = async () => {
        const url = new URL(window.location.href);
        if (customer?.referralCode) {
            url.searchParams.set('ref', customer.referralCode);
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: `Check out this ${product.name} on ${storeMeta.name}`,
                    url: url.toString(),
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(url.toString());
            // You might want to add a toast notification here
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-transparent pointer-events-none">
                <GlassButton onClick={() => router.back()} aria-label="Go back">
                    <ChevronLeftIcon className="w-6 h-6 text-text-primary" />
                </GlassButton>
                <GlassButton onClick={handleShare} aria-label="Share product">
                    <ShareIcon className="w-6 h-6 text-text-primary" />
                </GlassButton>
            </div>

            {/* Swipeable Image Gallery */}
            <div
                className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] bg-gray-100 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={product.images[currentImageIndex]}
                            alt={`${product.name} - Image ${currentImageIndex + 1}`}
                            fill
                            className="object-cover"
                            priority={currentImageIndex === 0}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows - Glassmorphic & Mobile Friendly */}
                {product.images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                            disabled={currentImageIndex === 0}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 backdrop-blur-md border border-white/10 text-white disabled:opacity-0 transition-all hover:bg-black/20 active:scale-95 z-10"
                            aria-label="Previous image"
                        >
                            <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                            disabled={currentImageIndex === product.images.length - 1}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 backdrop-blur-md border border-white/10 text-white disabled:opacity-0 transition-all hover:bg-black/20 active:scale-95 z-10"
                            aria-label="Next image"
                        >
                            <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </>
                )}

                {/* Dot Indicators - Glassmorphic & Proportional */}
                {product.images.length > 1 && (
                    <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 p-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 z-10">
                        {product.images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                className={`rounded-full transition-all duration-300 p-0 m-0 border-none outline-none flex-shrink-0 ${idx === currentImageIndex
                                    ? 'bg-white w-[8px] h-[8px] shadow-sm'
                                    : 'bg-white/40 w-[6px] h-[6px] hover:bg-white/60'
                                    }`}
                                style={{ minWidth: idx === currentImageIndex ? '8px' : '6px', minHeight: idx === currentImageIndex ? '8px' : '6px' }}
                                aria-label={`View image ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Product Info Section - Mobile Optimized */}
            <div className="px-4 py-6 space-y-6 -mt-6 relative bg-background rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-32">
                <div className="flex flex-col gap-1 pt-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">
                        {product.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-2xl sm:text-3xl font-bold text-text-primary card-text-gradient">
                            {formatPrice(product.price)}
                        </p>
                        {product.available && (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${product.vehicleDetails.condition === 'brand-new'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : product.vehicleDetails.condition === 'foreign-used'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                {product.vehicleDetails.condition === 'brand-new' ? 'Brand New' :
                                    product.vehicleDetails.condition === 'foreign-used' ? 'Foreign Used' : 'Nigerian Used'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Vehicle Specs Grid */}
                {product.vehicleDetails && (
                    <div className="bg-card-background rounded-xl p-4 sm:p-5 border border-border-color shadow-sm">
                        <h3 className="font-semibold text-base sm:text-lg text-text-primary mb-4">Vehicle Specifications</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                            <SpecRow label="Make" value={product.vehicleDetails.make} icon={<TagIcon className="w-4 h-4" />} />
                            <SpecRow label="Model" value={product.vehicleDetails.model} icon={<TagIcon className="w-4 h-4" />} />
                            <SpecRow label="Year" value={product.vehicleDetails.year} icon={<CalendarIcon className="w-4 h-4" />} />
                            <SpecRow label="Mileage" value={`${product.vehicleDetails.mileage?.toLocaleString() ?? 'N/A'} km`} icon={<TruckIcon className="w-4 h-4" />} />
                            <SpecRow label="Condition" value={product.vehicleDetails.condition?.replace('-', ' ') ?? 'N/A'} icon={<SparklesIcon className="w-4 h-4" />} />
                            <SpecRow label="Transmission" value={product.vehicleDetails.transmission} icon={<CogIcon className="w-4 h-4" />} />
                            <SpecRow label="Fuel Type" value={product.vehicleDetails.fuelType} icon={<BoltIcon className="w-4 h-4" />} />
                            <SpecRow label="Body Type" value={product.vehicleDetails.bodyType} icon={<TruckIcon className="w-4 h-4" />} />
                            <SpecRow label="Color" value={product.vehicleDetails.color} icon={<SwatchIcon className="w-4 h-4" />} />
                            <SpecRow label="Location" value={product.vehicleDetails.location} icon={<MapPinIcon className="w-4 h-4" />} />
                        </div>
                    </div>
                )}

                {/* Description */}
                {product.description && (
                    <div className="bg-card-background rounded-xl p-4 sm:p-5 border border-border-color shadow-sm">
                        <h3 className="font-semibold text-base sm:text-lg text-text-primary mb-2">Description</h3>
                        <p className="text-sm sm:text-base text-text-secondary whitespace-pre-wrap leading-relaxed">{product.description}</p>
                    </div>
                )}
            </div>

            {/* CTAs - Mobile Optimized */}
            <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background border-t border-border-color flex gap-2 sm:gap-3 z-40 safe-area-bottom">
                <button
                    onClick={handleContactDealer}
                    className="flex-1 bg-button-secondary text-text-primary py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold border border-border-color hover:bg-button-secondary-hover transition-colors"
                >
                    💬 Chat
                </button>
                <button
                    onClick={handleScheduleTestDrive}
                    className="flex-[2] bg-slate-900 dark:bg-emerald-500 text-white py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:bg-slate-800 dark:hover:bg-emerald-600 transition-colors shadow-lg"
                >
                    📅 Schedule Test Drive
                </button>
            </div>
        </div>
    );
}
