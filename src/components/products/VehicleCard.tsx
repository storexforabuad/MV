import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { VehicleProduct, Product } from '../../types/product';
import { formatPrice } from '../../utils/price';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useProductDetailPrefetch } from '../../hooks/useProductDetailPrefetch';
import { useCart } from '../../lib/cartContext';
import NavigationStore from '@/lib/navigationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_IMAGES = {
    small: '/default_product_400x400.png',
    medium: '/default_product_800x800.png',
    large: '/default_product_1200x1200.png',
};

interface VehicleCardProps {
    product: VehicleProduct;
    storeId?: string | null;
    onOrderClick?: (product: Product, selectedColor?: string, selectedSize?: string, selectedImage?: string) => void;
}

export default function VehicleCard({ product, storeId, onOrderClick }: VehicleCardProps) {
    const [imageLoading, setImageLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Cart variables
    const { state: cartState, dispatch: cartDispatch } = useCart();

    const isInCart = cartState.items.some(item =>
        item.id === product.id
    );

    const handleToggleCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (navigator.vibrate) {
            navigator.vibrate(15);
        }

        if (isInCart) {
            cartDispatch({
                type: 'REMOVE_ITEM',
                payload: { id: product.id }
            });
            toast.success('Removed from cart', {
                duration: 2000,
                position: 'bottom-center',
                style: {
                    background: 'var(--card-background)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                },
            });
        } else {
            cartDispatch({
                type: 'ADD_ITEM',
                payload: { ...product, quantity: 1, storeId: storeId || product.storeId }
            });
            toast.success('Added to cart', {
                duration: 2000,
                position: 'bottom-center',
                style: {
                    background: 'var(--card-background)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                },
            });
        }
    };

    // Double Tap variables
    const lastClickTimeRef = useRef<number>(0);
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isCopyingRef = useRef(false);

    // Detect mobile device for hover states
    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                || window.matchMedia('(max-width: 768px)').matches
                || window.innerWidth <= 768;
            setIsMobile(isMobileDevice);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useIntersectionObserver(cardRef as React.RefObject<Element>, (entries) => {
        if (entries[0].isIntersecting) setIsVisible(true);
    }, { threshold: 0.2 });

    useProductDetailPrefetch(storeId, product.id, (isVisible || isHovered));

    if (!product.id) {
        console.error('Missing product id in VehicleCard', { product });
        return null;
    }

    const carouselImages = product.images?.length ? product.images : [DEFAULT_IMAGES.medium];
    const totalImages = carouselImages.length;
    const hasMultipleImages = totalImages > 1;
    const displayImage = carouselImages[currentImageIndex];

    const productLink = storeId
        ? `/${storeId}/products/${product.id}`
        : `/compass/products/${product.id}?storeId=${product.storeId}`;

    const handleImageError = () => {
        // Fallback handled via UI if needed, but displayImage covers most cases
    };

    const handleClick = () => {
        NavigationStore.saveState('vehicles', window.scrollY);
    };

    // Carousel Handlers
    const handlePrevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDirection(-1);
        setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDirection(1);
        setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
    };

    const handleDotClick = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDirection(index > currentImageIndex ? 1 : -1);
        setCurrentImageIndex(index);
    };

    const executeCopy = () => {
        if (isCopyingRef.current) return;
        isCopyingRef.current = true;
        setTimeout(() => { isCopyingRef.current = false; }, 2000);

        const finalStoreId = storeId || product.storeId || 'compass';
        const url = `https://tinyurl.com/thelinkinmybio/${finalStoreId}/products/${product.id}`;
        const caption = `Check out ${product.name} at our store Online Store: ${url}`;

        navigator.clipboard.writeText(caption)
            .then(() => {
                toast.success(`Link for "${product.name}" copied!`, {
                    duration: 2000,
                    position: 'bottom-center',
                    style: {
                        background: 'var(--card-background)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                    },
                });
                if (navigator.vibrate) navigator.vibrate(50);
            })
            .catch(() => toast.error('Failed to copy link'));
    };

    return (
        <Link href={productLink} passHref>
            <div
                ref={cardRef}
                className="relative group h-full cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const isImageClick = !!(e.target as Element).closest('.vehicle-image-container');

                    if (!product.available) {
                        toast.error('Product is sold out', { duration: 2000, position: 'bottom-center' });
                        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                        return;
                    }

                    const now = Date.now();
                    const timeSinceLastClick = now - lastClickTimeRef.current;

                    // DOUBLE TAP DETECTED
                    if (timeSinceLastClick < 300) {
                        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
                        lastClickTimeRef.current = 0; // Reset
                        executeCopy();
                        return;
                    }

                    // FIRST TAP DELAY LOGIC
                    lastClickTimeRef.current = now;
                    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

                    clickTimeoutRef.current = setTimeout(() => {
                        if (isImageClick && onOrderClick) {
                            onOrderClick(product, undefined, undefined, carouselImages[currentImageIndex]);
                            if (navigator.vibrate) navigator.vibrate(20);
                        } else {
                            handleClick();
                            window.location.href = productLink;
                        }
                    }, 300);
                }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div
                    className="vehicle-image-container relative aspect-[3/4] w-full rounded-[32px] overflow-hidden
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

                    {/* Top Left: Condition Badge */}
                    {product.available && product.vehicleDetails?.condition && (
                        <div className="absolute top-[18px] left-[18px] z-10 flex flex-col items-start gap-2">
                            <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                                <span className={`product-badge shadow-sm whitespace-nowrap px-3 py-1.5 border border-white/20 dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider ${product.vehicleDetails.condition === 'brand-new'
                                    ? 'bg-green-100 text-green-800 dark:bg-emerald-900/80 dark:text-emerald-300 backdrop-blur-md'
                                    : product.vehicleDetails.condition === 'foreign-used'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300 backdrop-blur-md'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/80 dark:text-amber-300 backdrop-blur-md'
                                    }`}>
                                    {product.vehicleDetails.condition === 'brand-new' ? 'Brand New' :
                                        product.vehicleDetails.condition === 'foreign-used' ? 'Foreign Used' : 'Nigerian Used'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Top Right: Mileage Overlay */}
                    {product.available && product.vehicleDetails?.mileage !== undefined && (
                        <div className="absolute top-[18px] right-[18px] z-10 flex flex-col items-end gap-2 max-w-[calc(55%)]">
                            <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                                <span className="product-badge bg-white/90 dark:bg-black/60 backdrop-blur text-slate-700 dark:text-slate-200 shadow-sm border border-white/20 dark:border-white/10 rounded-xl text-[11px] font-bold flex items-center gap-1.5 truncate uppercase">
                                    🛣️ {product.vehicleDetails.mileage.toLocaleString()} km
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Bottom Left: Location Overlay */}
                    {product.available && product.vehicleDetails?.location && (
                        <div className="absolute bottom-[14px] left-[14px] z-10 max-w-[calc(60%)]">
                            <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                                <span className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/40 dark:border-white/20 px-3 py-2 rounded-2xl text-[11px] font-bold text-slate-800 dark:text-slate-100 shadow-lg flex items-center gap-1.5 truncate">
                                    📍 {product.vehicleDetails.location}
                                </span>
                            </div>
                        </div>
                    )}

                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentImageIndex}
                            custom={direction}
                            variants={{
                                enter: (direction: number) => ({
                                    x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
                                    opacity: 0,
                                    scale: 0.95
                                }),
                                center: {
                                    zIndex: 1,
                                    x: 0,
                                    opacity: 1,
                                    scale: 1
                                },
                                exit: (direction: number) => ({
                                    zIndex: 0,
                                    x: direction < 0 ? '100%' : direction > 0 ? '-100%' : 0,
                                    opacity: 0,
                                    scale: 0.95
                                })
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.3 }
                            }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={displayImage}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
                                className={`object-cover object-center
                                    will-change-transform group-hover:scale-[1.03]
                                    ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                loading="lazy"
                                draggable="false"
                                placeholder="blur"
                                blurDataURL={displayImage}
                                onLoad={() => setImageLoading(false)}
                                onError={handleImageError}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Add to Cart / Enquire Button (Bottom Right) */}
                    {product.available && (
                        <div className="absolute bottom-[14px] right-[14px] z-30">
                            <motion.button
                                onClick={handleToggleCart}
                                className="flex-shrink-0 px-3 py-2 rounded-full card-glass shadow-lg flex items-center justify-center gap-1.5 transition-all hover:bg-white/40 dark:hover:bg-black/40"
                                aria-label="Add to cart"
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className={`text-sm font-bold ${isInCart ? 'text-green-500' : 'text-green-500 dark:text-green-400'}`}>
                                    {isInCart ? 'Added' : 'Add'}
                                </span>
                                <ShoppingCart
                                    size={18}
                                    className={`transition-all duration-200 ${isInCart ? 'fill-green-500 text-green-500' : 'text-green-500 dark:text-green-400'}`}
                                />
                            </motion.button>
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {product.available && hasMultipleImages && (
                        <>
                            <motion.button
                                onClick={handlePrevImage}
                                className={`absolute left-[14px] top-1/2 transform -translate-y-1/2 z-20 
                                p-2.5 rounded-full card-glass shadow-lg flex items-center justify-center
                                transition-opacity duration-300 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                aria-label="Previous image"
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <ChevronLeft size={20} className="text-slate-800 dark:text-white" />
                            </motion.button>

                            <motion.button
                                onClick={handleNextImage}
                                className={`absolute right-[14px] top-1/2 transform -translate-y-1/2 z-20 
                                p-2.5 rounded-full card-glass shadow-lg flex items-center justify-center
                                transition-opacity duration-300 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                aria-label="Next image"
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <ChevronRight size={20} className="text-slate-800 dark:text-white" />
                            </motion.button>
                        </>
                    )}

                    {/* Carousel Dots - Positioned higher to not occlude badges */}
                    {product.available && hasMultipleImages && (
                        <div className={`absolute bottom-[16px] left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-1.5 z-20 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                            {carouselImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => handleDotClick(e, index)}
                                    className={`transition-all duration-300 ease-out focus:outline-none rounded-full ${index === currentImageIndex
                                        ? 'w-1.5 h-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                        : 'w-1 h-1 bg-white/50 hover:bg-white/80'
                                        }`}
                                    aria-label={`Go to image ${index + 1} of ${totalImages}`}
                                    type="button"
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-3 space-y-1 px-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                    group-hover:translate-y-[-2px]">
                    <h3 className="text-sm font-medium text-text-primary line-clamp-2 card-text-gradient">
                        {product.name}
                    </h3>

                    <div className="flex flex-col items-start gap-1">
                        <p className="text-lg font-bold text-text-primary card-text-gradient mt-0.5">
                            {formatPrice(product.price)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
