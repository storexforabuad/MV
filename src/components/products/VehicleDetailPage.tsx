import React, { useState } from 'react';
import Image from 'next/image';
import { Product, VehicleProduct } from '../../types/product';
import { StoreMeta } from '../../types/store';
import { formatPrice } from '../../utils/price';
import { ChevronLeftIcon, ChevronRightIcon, ShareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isVehicleProduct } from '../../utils/productHelpers';
import { motion, AnimatePresence } from 'framer-motion';

interface VehicleDetailPageProps {
    product: Product;
    storeMeta: StoreMeta | null;
    storeId: string;
}

const SpecRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex flex-col">
        <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
        <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
);

export default function VehicleDetailPage({ product, storeMeta, storeId }: VehicleDetailPageProps) {
    const router = useRouter();
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

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Top Navigation */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-transparent pointer-events-none">
                <button onClick={() => router.back()} className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm pointer-events-auto">
                    <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
                </button>
                <button className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm pointer-events-auto">
                    <ShareIcon className="w-6 h-6 text-gray-800" />
                </button>
            </div>

            {/* Swipeable Image Gallery */}
            <div
                className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-gray-100 overflow-hidden"
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

                {/* Navigation Arrows - Desktop */}
                {product.images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            disabled={currentImageIndex === 0}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors pointer-events-auto hidden md:block"
                        >
                            <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
                        </button>

                        <button
                            onClick={handleNextImage}
                            disabled={currentImageIndex === product.images.length - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors pointer-events-auto hidden md:block"
                        >
                            <ChevronRightIcon className="w-6 h-6 text-gray-800" />
                        </button>
                    </>
                )}

                {/* Dot Indicators - Optimized for Mobile */}
                {product.images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {product.images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`h-1.5 rounded-full transition-all pointer-events-auto ${idx === currentImageIndex
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 w-1.5'
                                    }`}
                                aria-label={`View image ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Product Info Section - Mobile Optimized */}
            <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 -mt-4 sm:-mt-6 relative bg-background rounded-t-3xl shadow-xl">
                <div className="flex flex-col gap-1 pt-2">
                    <div className="flex justify-between items-start">
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">
                            {product.name}
                        </h1>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-text-primary card-text-gradient mt-1 sm:mt-2">
                        {formatPrice(product.price)}
                    </p>
                </div>

                {/* Vehicle Specs Grid */}
                {product.vehicleDetails && (
                    <div className="bg-card-background rounded-xl p-4 sm:p-5 border border-border-color shadow-sm">
                        <h3 className="font-semibold text-base sm:text-lg text-text-primary mb-3 sm:mb-4">Vehicle Specifications</h3>
                        <div className="grid grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-2">
                            <SpecRow label="Make" value={product.vehicleDetails.make} />
                            <SpecRow label="Model" value={product.vehicleDetails.model} />
                            <SpecRow label="Year" value={product.vehicleDetails.year} />
                            <SpecRow label="Mileage" value={`${product.vehicleDetails.mileage?.toLocaleString() ?? 'N/A'} km`} />
                            <SpecRow label="Condition" value={product.vehicleDetails.condition?.replace('-', ' ') ?? 'N/A'} />
                            <SpecRow label="Transmission" value={product.vehicleDetails.transmission} />
                            <SpecRow label="Fuel Type" value={product.vehicleDetails.fuelType} />
                            <SpecRow label="Body Type" value={product.vehicleDetails.bodyType} />
                            <SpecRow label="Color" value={product.vehicleDetails.color} />
                            <SpecRow label="Location" value={product.vehicleDetails.location} />
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
                    className="flex-[2] bg-blue-600 text-white py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    📅 Schedule Test Drive
                </button>
            </div>
        </div>
    );
}
