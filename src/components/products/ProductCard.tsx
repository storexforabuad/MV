import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Product } from '../../types/product';
import { calculateDiscount, formatPrice } from '../../utils/price';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useProductDetailPrefetch } from '../../hooks/useProductDetailPrefetch';
import { useWishlist } from '../../context/WishlistContext';
import { useCustomer } from '../../context/CustomerContext';
import { useCart } from '../../lib/cartContext';
import NavigationStore from '@/lib/navigationStore';
import { incrementProductViews } from '@/lib/db';
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
  isSingleView?: boolean;
}

export default function ProductCard({
  product,
  storeId,
  activeCategoryId,
  storeMeta,
  onOrderClick,
  isSingleView
}: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || DEFAULT_IMAGES.medium);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
  const [selectedColor, setSelectedColor] = useState<string | undefined>(isFashionProduct(product) && product.colors?.[0] ? product.colors[0].name : undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { state: cartState, dispatch: cartDispatch } = useCart();
  const { customer } = useCustomer();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const hasTrackedInteraction = useRef(false);

  const handleTrackInteraction = () => {
    if (!storeId || !product.id || hasTrackedInteraction.current) return;
    incrementProductViews(storeId, product.id);
    hasTrackedInteraction.current = true;
  };

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

  // Check if product is in cart (matching ProductDetail footer heart logic)
  const isInCart = cartState.items.some(item =>
    item.id === product.id &&
    (!isFashionProduct(product) || item.selectedColor === selectedColor)
  );

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

  // Handle cart toggle (acting as Heart in Single View)
  const handleToggleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }

    if (isInCart) {
      cartDispatch({
        type: 'REMOVE_ITEM',
        payload: { id: product.id, selectedSize, selectedColor }
      });
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
      cartDispatch({
        type: 'ADD_ITEM',
        payload: { ...product, quantity: 1, storeId: storeId || product.storeId, selectedSize, selectedColor }
      });
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
    handleTrackInteraction();
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleTrackInteraction();
    setDirection(1);
    setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(index > currentImageIndex ? 1 : -1);
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
        className="relative group h-full"
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          if (isSingleView) {
            e.preventDefault();
            e.stopPropagation();
            if (onOrderClick) {
              // Intelligent Color Mapping: Pre-select color based on current visible image
              let finalSelectedColor = selectedColor;
              if (isFashionProduct(product) && product.colors) {
                const colorMatch = product.colors.find(c => c.images?.includes(displayImage));
                if (colorMatch) {
                  finalSelectedColor = colorMatch.name;
                }
              }

              onOrderClick(product, finalSelectedColor, selectedSize);
              handleTrackInteraction();
              // Haptic feedback
              if (navigator.vibrate) navigator.vibrate(20);
            }
          } else {
            handleClick();
          }
        }}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden
          shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-lg dark:shadow-white/10
          transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
          transform-gpu will-change-transform
          group-hover:shadow-[0_16px_24px_-8px_rgba(0,0,0,0.12),0_4px_12px_-4px_rgba(0,0,0,0.08)] dark:group-hover:shadow-xl dark:group-hover:shadow-white/15
          ${!isMobile ? 'group-hover:translate-y-[-4px]' : ''}
          bg-white dark:bg-card-background border-2 border-transparent active:border-blue-500/50 active:ring-4 active:ring-blue-500/20"
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

          {/* Floating Action Buttons - Only show when NOT sold out */}
          {!isSoldOut && (
            <div className={`absolute inset-0 flex flex-col items-end justify-between p-3 transition-opacity duration-300 ${isMobile
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
              }`}>
              {/* Spacer - Top heart was here, now removed */}
              <div />

              {/* Bottom Right Icon: Cart (Grid) or Heart (Single View) */}
              <motion.div className="z-30">
                <motion.button
                  onClick={(e) => {
                    if (isSingleView) {
                      handleToggleCart(e);
                    } else {
                      handleOrderClick(e);
                    }
                  }}
                  disabled={isSoldOut}
                  className="flex-shrink-0 p-3 rounded-full card-glass shadow-lg flex items-center justify-center disabled:opacity-50"
                  aria-label={isSingleView ? "Add to cart" : "Place order"}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSingleView ? (
                    <Heart
                      size={20}
                      className={`transition-all duration-200 ${isInCart
                        ? 'fill-red-500 text-red-500'
                        : 'text-red-500'
                        }`}
                    />
                  ) : (
                    <ShoppingCart size={20} className="text-green-500 dark:text-green-400" />
                  )}
                </motion.button>
              </motion.div>
            </div>
          )}

          {/* Action Tap Effect - High performance scale */}
          {isSingleView && (
            <motion.div
              className="absolute inset-0 z-20 cursor-pointer pointer-events-auto rounded-2xl"
              whileTap={{
                scale: 0.98
              }}
              transition={{ duration: 0.1 }}
            />
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 z-30 p-2.5 rounded-full card-glass shadow-lg flex items-center justify-center"
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
            <div className={`absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-0.5 z-10 transition-opacity duration-300 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
              {carouselImages.map((_, index) => (
                <span
                  key={index}
                  className={`transition-all duration-200 rounded-full ${index === currentImageIndex
                    ? 'w-1 h-1 bg-white shadow-md'
                    : 'w-0.75 h-0.75 bg-white/60'
                    }`}
                  aria-label={`Image ${index + 1} of ${totalImages}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`mt-3 space-y-1 px-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${!isMobile ? 'group-hover:translate-y-[-2px]' : ''}`}>
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
