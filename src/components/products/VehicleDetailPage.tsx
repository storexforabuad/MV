import React from 'react';
import Image from 'next/image';
import { Product, VehicleProduct } from '../../types/product';
import { StoreMeta } from '../../types/store';
import { formatPrice } from '../../utils/price';
import { ChevronLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isVehicleProduct } from '../../utils/productHelpers';

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

            {/* Image Gallery (Simplified for now - just main image + scroll) */}
            <div className="relative w-full h-[50vh] md:h-[60vh] bg-gray-100 overflow-hidden">
                <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    1 / {product.images.length}
                </div>
            </div>

            {/* Product Info Section */}
            <div className="px-4 py-6 space-y-6 -mt-6 relative bg-background rounded-t-3xl shadow-xl">
                <div className="flex flex-col gap-1 pt-2">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-text-primary leading-tight">
                            {product.name}
                        </h1>
                    </div>
                    <p className="text-3xl font-bold text-text-primary card-text-gradient mt-2">
                        {formatPrice(product.price)}
                    </p>
                </div>

                {/* Vehicle Specs Grid */}
                {product.vehicleDetails && (
                    <div className="bg-card-background rounded-xl p-5 border border-border-color shadow-sm">
                        <h3 className="font-semibold text-lg text-text-primary mb-4">Vehicle Specifications</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
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
                    <div className="bg-card-background rounded-xl p-5 border border-border-color shadow-sm">
                        <h3 className="font-semibold text-lg text-text-primary mb-2">Description</h3>
                        <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{product.description}</p>
                    </div>
                )}
            </div>

            {/* CTAs */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border-color flex gap-3 z-40 safe-area-bottom">
                <button
                    onClick={handleContactDealer}
                    className="flex-1 bg-button-secondary text-text-primary py-3.5 rounded-xl font-semibold border border-border-color hover:bg-button-secondary-hover transition-colors"
                >
                    💬 Chat
                </button>
                <button
                    onClick={handleScheduleTestDrive}
                    className="flex-[2] bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    📅 Schedule Test Drive
                </button>
            </div>
        </div>
    );
}
