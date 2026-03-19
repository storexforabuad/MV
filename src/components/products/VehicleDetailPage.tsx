import React, { useState } from 'react';
import Image from 'next/image';
import { Product, VehicleProduct } from '../../types/product';
import { StoreMeta } from '../../types/store';
import { formatPrice } from '../../utils/price';
import { isVehicleProduct } from '../../utils/productHelpers';
import { useCustomer } from '@/context/CustomerContext';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import Navbar from '@/components/layout/navbar';
import { Settings, Gauge, Calendar, Activity, MapPin, Truck, Zap, CalendarDays, Paintbrush } from 'lucide-react';

interface VehicleDetailPageProps {
    product: Product;
    storeMeta: StoreMeta | null;
    storeId: string;
}

export default function VehicleDetailPage({ product, storeMeta, storeId }: VehicleDetailPageProps) {
    const { customer } = useCustomer();
    const [selectedImage, setSelectedImage] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [thumbnailsLoaded, setThumbnailsLoaded] = useState<Record<number, boolean>>({});

    // Type guard to ensure we only render vehicle products
    if (!isVehicleProduct(product)) {
        return null;
    }

    // Guard against null storeMeta
    if (!storeMeta) {
        return null; // Silent return while loading
    }

    const allImages = product.images || [];

    const handleImageSelect = (index: number) => {
        if (selectedImage === index) return;
        setImageLoading(true);
        setSelectedImage(index);
    };

    const handleContactDealer = () => {
        const message = `Hello! I'd like to chat with you about the *${product.name}* listed at *${formatPrice(product.price)}*.\n\n` +
            `📍 Location: ${product.vehicleDetails.location}\n` +
            `🛣️ Mileage: ${product.vehicleDetails.mileage?.toLocaleString() || 'N/A'} km\n` +
            `🔗 Link: https://tinyurl.com/bizconnet/${storeId}/products/${product.id}\n\n` +
            `Could you please provide more information?`;

        const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleScheduleTestDrive = () => {
        const message = `Hello! I would like to schedule a test drive for the *${product.name}*.\n\n` +
            `Listed at: *${formatPrice(product.price)}*\n\n` +
            `Preferred date: ___\n` +
            `Preferred time: Morning / Afternoon / Evening\n\n` +
            `Looking forward to viewing!`;
        const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar
                storeId={storeId}
                storeName={storeMeta?.name || storeId || 'Store'}
                backButtonHref={`/${storeId}`}
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-32 pt-[calc(var(--navbar-height)+1rem)] lg:pt-[calc(var(--navbar-height)+2rem)]">
                <div className="flex flex-col lg:flex lg:flex-row gap-6 lg:gap-x-8">
                    {/* Image Section - Mimicking Electronics Page */}
                    <div className="flex-1 flex flex-col">
                        <div className="relative overflow-hidden rounded-2xl bg-gray-50 shadow-lg dark:shadow-xl dark:shadow-white/10 aspect-square">
                            {imageLoading && (
                                <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900">
                                    <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-shimmer bg-[length:200%_100%]" />
                                </div>
                            )}
                            <Image
                                key={`${allImages[selectedImage]}-${selectedImage}`}
                                src={allImages[selectedImage] || '/public/default_product_1200x1200.png'}
                                alt={product.name}
                                fill
                                className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                priority
                                onLoad={() => setImageLoading(false)}
                            />
                        </div>

                        {allImages.length > 1 && (
                            <div className="mt-4 -mx-4 px-5 scroll-px-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory flex items-center gap-4 py-4">
                                {allImages.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleImageSelect(index)}
                                        className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden snap-start focus:outline-none transition-all duration-300 transform origin-center 
                                            ${selectedImage === index
                                                ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900 scale-[1.05] shadow-lg z-10'
                                                : 'opacity-60 hover:opacity-100 ring-1 ring-gray-200 dark:ring-gray-700/50 hover:ring-gray-300 dark:hover:ring-gray-600'
                                            }`}
                                    >
                                        {!thumbnailsLoaded[index] && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer bg-[length:200%_100%]" />
                                        )}
                                        <Image
                                            src={image}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            sizes="(max-width: 640px) 80px, 100px"
                                            className={`object-cover transition-opacity duration-300 ${thumbnailsLoaded[index] ? 'opacity-100' : 'opacity-0'}`}
                                            loading={index === 0 ? undefined : 'lazy'}
                                            onLoad={() => setThumbnailsLoaded(prev => ({ ...prev, [index]: true }))}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info Section */}
                    <div className="mt-4 lg:mt-0 flex flex-col flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold card-text-gradient mb-4">{product.name}</h1>

                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <p className="text-2xl font-semibold card-text-gradient">{formatPrice(product.price)}</p>
                                {product.available && product.vehicleDetails.condition && (
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

                        {/* Tech Spec Cards - Mirroring Electronics Layout */}
                        {product.vehicleDetails && (
                            <div className="mb-8 space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Technical Specifications
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

                                    {/* History */}
                                    {product.vehicleDetails.year && (
                                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                                <CalendarDays className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Year</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{product.vehicleDetails.year}</p>
                                            </div>
                                        </div>
                                    )}

                                    {product.vehicleDetails.mileage !== undefined && (
                                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Gauge className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Mileage</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{product.vehicleDetails.mileage.toLocaleString()} km</p>
                                            </div>
                                        </div>
                                    )}

                                    {product.vehicleDetails.condition && (
                                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Condition</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{product.vehicleDetails.condition.replace('-', ' ')}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Performance */}
                                    {product.vehicleDetails.transmission && (
                                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                                <Settings className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Transmission</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{product.vehicleDetails.transmission}</p>
                                            </div>
                                        </div>
                                    )}

                                    {product.vehicleDetails.fuelType && (
                                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Fuel Type</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{product.vehicleDetails.fuelType}</p>
                                            </div>
                                        </div>
                                    )}

                                    {product.vehicleDetails.bodyType && (
                                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Body Type</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{product.vehicleDetails.bodyType}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Appearance & Location */}
                                    {product.vehicleDetails.color && (
                                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <Paintbrush className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Color</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{product.vehicleDetails.color}</p>
                                            </div>
                                        </div>
                                    )}

                                    {product.vehicleDetails.location && (
                                        <div className="col-span-2 md:col-span-2 flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Location</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{product.vehicleDetails.location}</p>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <div className="mb-6 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 sm:p-5 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Description</h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* CTAs - Floating Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex gap-2 sm:gap-3 z-40 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                <button
                    onClick={handleContactDealer}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 flex justify-center items-center gap-2"
                >
                    💬 Chat
                </button>
                <button
                    onClick={handleScheduleTestDrive}
                    className="flex-[2] bg-emerald-600 text-white py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex justify-center items-center gap-2"
                >
                    📅 Schedule Test Drive
                </button>
            </div>
        </div>
    );
}
