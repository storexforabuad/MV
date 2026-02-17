import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Product } from '../../types/product';
import { calculateDiscount, formatPrice } from '../../utils/price';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useProductDetailPrefetch } from '../../hooks/useProductDetailPrefetch';
import { useWishlist } from '../../context/WishlistContext';
import { useCustomer } from '../../context/CustomerContext';
import NavigationStore from '@/lib/navigationStore';
import {
  isGeneralProduct,
  isVehicleProduct,
  isFashionProduct,
  isLivestockProduct,
  isFoodBeverageProduct
} from '../../utils/productHelpers';


const DEFAULT_IMAGES = {
  small: '/default_product_400x400.png',
  medium: '/default_product_800x800.png',
  large: '/default_product_1200x1200.png',
};

interface ProductCardProps {
  product: Product;
  storeId?: string | null;
  activeCategoryId: string;
  storeMeta?: any; // StoreMeta type, optional for ProductCard
  onOrderClick?: (product: Product, selectedColor?: string, selectedSize?: string) => void;
}

export default function ProductCard({ product, storeId, activeCategoryId, storeMeta, onOrderClick }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || DEFAULT_IMAGES.medium);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(isFashionProduct(product) && product.colors?.[0] ? product.colors[0].name : undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { customer } = useCustomer();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Detect mobile device
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

  // Check if product is in wishlist
  const isInWishlist = wishlist.some(item => item.id === product.id);

  // Get images for carousel (fashion with color or general product)
  const getCarouselImages = (): string[] => {
    if (isFashionProduct(product) && selectedColor && product.colors) {
      const colorData = product.colors.find(c => c.name === selectedColor || c.hex === selectedColor);
      return colorData?.images || product.images || [];
    }
    return product.images || [];
  };

  const carouselImages = getCarouselImages();
  const totalImages = carouselImages.length;
  const hasMultipleImages = totalImages > 1;

  // Handle wishlist toggle
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        removeFromWishlist(product.id);
        toast.success('Removed from wishlist', {
          duration: 2000,
          position: 'bottom-center',
          style: {
            background: 'var(--card-background)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
        });
      } else {
        addToWishlist(product);
        toast.success('Added to wishlist', {
          duration: 2000,
          position: 'bottom-center',
          style: {
            background: 'var(--card-background)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
        });
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  // Handle order button click
  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOrderClick) {
      onOrderClick(product, selectedColor, selectedSize);
    }
  };

  // Handle image carousel navigation
  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  if (!product.id) {
    console.error('Missing product id in ProductCard', { product });
    return null;
  }

  const productLink = storeId
    ? `/${storeId}/products/${product.id}`
    : `/bizcon/products/${product.id}?storeId=${product.storeId}`;


  const discount = calculateDiscount(product.price, product.originalPrice);
  const isSoldOut = (() => {
    if (isGeneralProduct(product)) return !!product.soldOut;
    if (isFashionProduct(product)) return !!product.soldOut;
    if (isVehicleProduct(product)) return !product.available;
    if (isLivestockProduct(product)) return !product.available || !!product.soldOut;
    if (isFoodBeverageProduct(product)) return !product.available || !!product.soldOut;
    return false;
  })();

  const isLimitedStock = (isGeneralProduct(product) || isFashionProduct(product) || isLivestockProduct(product))
    ? !!product.limitedStock
    : false;

  const handleImageError = () => {
    if (imgSrc !== DEFAULT_IMAGES.medium) {
      setImgSrc(DEFAULT_IMAGES.medium);
    } else if (imgSrc !== DEFAULT_IMAGES.small) {
      setImgSrc(DEFAULT_IMAGES.small);
    } else {
      setImgSrc(DEFAULT_IMAGES.large);
    }
  };

  // Update displayed image when carousel index changes or color changes
  const displayImage = carouselImages[currentImageIndex] || DEFAULT_IMAGES.medium;

  const handleClick = () => {
    NavigationStore.saveState(activeCategoryId, window.scrollY);
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
          bg-white dark:bg-card-background"
          style={{
            transform: 'translate3d(0,0,0)',
            perspective: '1000px',
            backfaceVisibility: 'hidden'
          }}
        >
          {imageLoading && (
            <div className="absolute inset-0 bg-[var(--skeleton-background)] animate-pulse z-10" />
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <div className="badge-wrapper transform-gpu transition-transform duration-200 group-hover:scale-105">
                <span className="product-badge bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] shadow-sm">
                  Sold Out
                </span>
              </div>
            </div>
          )}

          {!isSoldOut && (
            <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-2">
              {isLimitedStock && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)] shadow-sm whitespace-nowrap">
                    Limited Stock
                  </span>
                </div>
              )}
              {discount && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] shadow-sm whitespace-nowrap">
                    {discount}% OFF
                  </span>
                </div>
              )}
            </div>
          )}

          <Image
            src={displayImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
            className={`object-cover object-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
              will-change-transform group-hover:scale-[1.03]
              ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
            draggable="false"
            placeholder="blur"
            blurDataURL={displayImage}
            onLoad={() => setImageLoading(false)}
            onError={handleImageError}
          />

          {/* Floating Action Buttons - Only show when NOT sold out */}
          {!isSoldOut && (
            <div className={`absolute inset-0 flex flex-col items-end justify-between p-3 transition-opacity duration-300 ${
              isMobile 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
            }`}>
              {/* Heart Icon - Wishlist (Top Right) */}
              <motion.button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className="relative flex-shrink-0 p-3 rounded-full card-glass shadow-lg flex items-center justify-center disabled:opacity-50"
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart
                  size={20}
                  className={`transition-all duration-200 ${
                    isInWishlist
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                />
              </motion.button>

              {/* Cart Icon - Order (Bottom Right) */}
              <motion.button
                onClick={handleOrderClick}
                disabled={isSoldOut}
                className="flex-shrink-0 p-3 rounded-full card-glass shadow-lg flex items-center justify-center disabled:opacity-50"
                aria-label="Place order"
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart size={20} className="text-green-500 dark:text-green-400" />
              </motion.button>
            </div>
          )}

          {/* Navigation Arrows - Only show when NOT sold out and multiple images */}
          {!isSoldOut && hasMultipleImages && (
            <>
              {/* Left Arrow */}
              <motion.button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20 p-2.5 rounded-full card-glass shadow-lg flex items-center justify-center"
                aria-label="Previous image"
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft size={20} className="text-[var(--text-primary)]" />
              </motion.button>

              {/* Right Arrow */}
              <motion.button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 z-20 p-2.5 rounded-full card-glass shadow-lg flex items-center justify-center"
                aria-label="Next image"
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight size={20} className="text-[var(--text-primary)]" />
              </motion.button>
            </>
          )}

          {/* Carousel Dots - Bottom Center - Only show when NOT sold out */}
          {!isSoldOut && hasMultipleImages && (
            <div className={`absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-0.5 z-10 transition-opacity duration-300 ${
              isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              {carouselImages.map((_, index) => (
                <span
                  key={index}
                  className={`transition-all duration-200 rounded-full ${
                    index === currentImageIndex
                      ? 'w-1 h-1 bg-white shadow-md'
                      : 'w-0.75 h-0.75 bg-white/60'
                  }`}
                  aria-label={`Image ${index + 1} of ${totalImages}`}
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
            {!isSoldOut && product.originalPrice && product.originalPrice > product.price && (
              <p className="text-sm text-text-secondary line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
            <p className="text-lg font-bold text-text-primary card-text-gradient">
              {formatPrice(product.price)}
              {isLivestockProduct(product) && (
                <span className="text-sm font-normal text-text-secondary">
                  /{product.priceUnit === 'kg' ? 'kg' : 'pc'}
                </span>
              )}
            </p>
            {isFoodBeverageProduct(product) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {product.spiciness && product.spiciness !== 'mild' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800">
                    {product.spiciness === 'medium' && '🌶️ Med'}
                    {product.spiciness === 'hot' && '🔥 Hot'}
                    {product.spiciness === 'extra-hot' && '🤯 X-Hot'}
                  </span>
                )}
                {product.temperature && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                    {product.temperature === 'hot' && '☕ Hot'}
                    {product.temperature === 'cold' && '❄️ Cold'}
                  </span>
                )}
                {product.preparationTime !== undefined && (
                  product.preparationTime === 0 ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-800">
                      ✅ Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      ⏱️ {product.preparationTime}m
                    </span>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
