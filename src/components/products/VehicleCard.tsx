import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { VehicleProduct } from '../../types/product';
import { formatPrice } from '../../utils/price';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useProductDetailPrefetch } from '../../hooks/useProductDetailPrefetch';
import NavigationStore from '@/lib/navigationStore';

const DEFAULT_IMAGES = {
    small: '/default_product_400x400.png',
    medium: '/default_product_800x800.png',
    large: '/default_product_1200x1200.png',
};

interface VehicleCardProps {
    product: VehicleProduct;
    storeId?: string | null;
}

export default function VehicleCard({ product, storeId }: VehicleCardProps) {
    const [imageLoading, setImageLoading] = useState(true);
    const [imgSrc, setImgSrc] = useState(product.images?.[0] || DEFAULT_IMAGES.medium);
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useIntersectionObserver(cardRef as React.RefObject<Element>, (entries) => {
        if (entries[0].isIntersecting) setIsVisible(true);
    }, { threshold: 0.2 });

    useProductDetailPrefetch(storeId, product.id, (isVisible || isHovered));

    if (!product.id) {
        console.error('Missing product id in VehicleCard', { product });
        return null;
    }

    const productLink = storeId
        ? `/${storeId}/products/${product.id}`
        : `/bizcon/products/${product.id}?storeId=${product.storeId}`;

    const handleImageError = () => {
        if (imgSrc !== DEFAULT_IMAGES.medium) {
            setImgSrc(DEFAULT_IMAGES.medium);
        } else if (imgSrc !== DEFAULT_IMAGES.small) {
            setImgSrc(DEFAULT_IMAGES.small);
        } else {
            setImgSrc(DEFAULT_IMAGES.large);
        }
    };

    const handleClick = () => {
        NavigationStore.saveState('vehicles', window.scrollY);
    };

    return (
        <Link href={productLink} passHref>
            <div
                ref={cardRef}
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleClick}
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden
          shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-lg dark:shadow-white/10
          transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
          transform-gpu will-change-transform
          group-hover:shadow-[0_16px_24px_-8px_rgba(0,0,0,0.12),0_4px_12px_-4px_rgba(0,0,0,0.08)] dark:group-hover:shadow-xl dark:group-hover:shadow-white/15
          group-hover:translate-y-[-4px]
          active:scale-[0.97] active:ring-4 active:ring-blue-500/40 dark:active:ring-sky-400/40 active:ring-offset-2 active:ring-offset-white dark:active:ring-offset-gray-900
          bg-white dark:bg-gray-900"
                    style={{
                        transform: 'translate3d(0,0,0)',
                        perspective: '1000px',
                        backfaceVisibility: 'hidden'
                    }}
                >
                    {imageLoading && (
                        <div className="absolute inset-0 bg-[var(--skeleton-background)] animate-pulse z-10" />
                    )}

                    {!product.available && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <div className="badge-wrapper transform-gpu transition-transform duration-200 group-hover:scale-105">
                                <span className="product-badge bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] shadow-sm">
                                    Sold
                                </span>
                            </div>
                        </div>
                    )}

                    {product.available && (
                        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-2">
                            <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                                <span className={`product-badge shadow-sm whitespace-nowrap px-2 py-1 rounded-md text-xs font-semibold ${product.vehicleDetails.condition === 'brand-new'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : product.vehicleDetails.condition === 'foreign-used'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}>
                                    {product.vehicleDetails.condition === 'brand-new' ? 'Brand New' :
                                        product.vehicleDetails.condition === 'foreign-used' ? 'Foreign Used' : 'Nigerian Used'}
                                </span>
                            </div>
                        </div>
                    )}

                    <Image
                        src={imgSrc}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
                        className={`object-cover object-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
              will-change-transform group-hover:scale-[1.03]
              ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                        loading="lazy"
                        draggable="false"
                        placeholder="blur"
                        blurDataURL={imgSrc}
                        onLoad={() => setImageLoading(false)}
                        onError={handleImageError}
                    />
                </div>

                <div className="mt-3 space-y-1 px-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          group-hover:translate-y-[-2px]">
                    <h3 className="text-sm font-medium text-text-primary line-clamp-2 card-text-gradient">
                        {product.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span>📍 {product.vehicleDetails.location}</span>
                        <span>•</span>
                        <span>🛣️ {product.vehicleDetails.mileage.toLocaleString()} km</span>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                        <p className="text-lg font-bold text-text-primary card-text-gradient">
                            {formatPrice(product.price)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
