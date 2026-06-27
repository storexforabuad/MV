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
  isFoodBeverageProduct,
  isElectronicsProduct,
  isSolarProduct,
  isBeautyProduct,
  isArtProduct,
  isMediaInfluencerProduct,
  isTicketProduct,
  isDigitalProduct
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
  onOrderClick?: (product: Product, selectedColor?: string, selectedSize?: string, selectedImage?: string) => void;
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
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || DEFAULT_IMAGES.medium);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
  const [selectedColor, setSelectedColor] = useState<string | undefined>(isFashionProduct(product) && product.colors?.[0] && !product.isTextile ? product.colors[0].name : undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { state: cartState, dispatch: cartDispatch } = useCart();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const hasTrackedInteraction = useRef(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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

  const isInfluencerHub = product.name === 'Influencer Services Hub' || (isMediaInfluencerProduct(product) && product.subtype === 'service-hub');
  Hartman_InfluencerHub_Logic: ; // marker
  Hartman_InfluencerHub_Logic_End: ; // marker

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

  // Get images for carousel (all images so user can swipe through colors on the card)
  const getCarouselImages = (): string[] => {
    if (!product) return [];
    if (isBeautyProduct(product) && product.shades) {
      const shadeImages = product.shades.flatMap(s => s.images || []);
      return shadeImages.length > 0 ? shadeImages : (product.images || []);
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
        addToWishlist(product);
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

    const getEffectiveColor = () => {
      if (isFashionProduct(product) && product.colors) {
        // If no color is explicitly selected, derive from currently visible image
        const colorMatch = product.colors.find(c => c.images?.includes(carouselImages[currentImageIndex]));
        if (colorMatch) return colorMatch.name;
      }
      return selectedColor;
    };

    const effectiveColor = getEffectiveColor();

    if (isInCart) {
      cartDispatch({
        type: 'REMOVE_ITEM',
        payload: { id: product.id, selectedSize, selectedColor: effectiveColor }
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
      cartDispatch({ type: 'ADD_ITEM', payload: { ...product, quantity: 1, storeId, selectedSize, selectedColor: effectiveColor, selectedImage: carouselImages[currentImageIndex] } });
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

  // Handle order button click
  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOrderClick) {
      let finalColor = selectedColor;
      if (isFashionProduct(product) && product.colors) {
        const colorMatch = product.colors.find(c => c.images?.includes(carouselImages[currentImageIndex]));
        if (colorMatch) finalColor = colorMatch.name;
      }
      onOrderClick(product, finalColor, selectedSize, carouselImages[currentImageIndex]);
    }
  };

  // Handle image carousel navigation
  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleImagePressEnd(); // cancel any pending long press
    handleTrackInteraction();
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    handleImagePressEnd(); // cancel any pending long press
    handleTrackInteraction();
    setDirection(1);
    setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const swipeDistance = touchStart - touchEnd;
    const swipeThreshold = 40; // minimum distance to be considered a swipe

    if (swipeDistance > swipeThreshold) {
      // Swiped left, go to next image
      handleNextImage(e as unknown as React.MouseEvent);
    } else if (swipeDistance < -swipeThreshold) {
      // Swiped right, go to previous image
      handlePrevImage(e as unknown as React.MouseEvent);
    }
    setTouchStart(null);
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    handleImagePressEnd(); // cancel any pending long press
    setDirection(index > currentImageIndex ? 1 : -1);
    setCurrentImageIndex(index);
  };

  if (!product.id) {
    console.error('Missing product id in ProductCard', { product });
    return null;
  }

  const productLink = storeId
    ? `/${storeId}/products/${product.id}`
    : `/compass/products/${product.id}?storeId=${product.storeId}`;


  const discount = calculateDiscount(product.price, product.originalPrice);
  const isSoldOut = (() => {
    if (isGeneralProduct(product)) return !!product.soldOut;
    if (isFashionProduct(product)) return !!product.soldOut;
    if (isVehicleProduct(product)) return !product.available;
    if (isLivestockProduct(product)) return !product.available || !!product.soldOut;
    if (isFoodBeverageProduct(product)) return !product.available || !!product.soldOut;
    if (isElectronicsProduct(product)) return !product.available || !!product.soldOut;
    if (isSolarProduct(product)) return !product.available || !!product.soldOut;
    if (isArtProduct(product)) return !product.available || !!product.soldOut;
    if (isTicketProduct(product)) return !(product as any).available || !!product.soldOut;
    return false;
  })();

  const isLimitedStock = (isGeneralProduct(product) || isFashionProduct(product) || isLivestockProduct(product) || isElectronicsProduct(product) || isSolarProduct(product) || isBeautyProduct(product) || isArtProduct(product) || isTicketProduct(product))
    ? !!(product as any).limitedStock
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

  // ── Long-press on image to copy product link ─────────────────────────────
  const imagePressTimer = useRef<NodeJS.Timeout | null>(null);
  const imagePressStartPos = useRef<{ x: number; y: number } | null>(null);
  const isCopyingRef = useRef(false);

  const executeCopy = () => {
    if (isCopyingRef.current) return;
    isCopyingRef.current = true;
    setTimeout(() => { isCopyingRef.current = false; }, 2000);

    const finalStoreId = storeId || product.storeId || 'compass';
    const url = `https://tinyurl.com/thelinkinmybio/${finalStoreId}/products/${product.id}`;
    const caption = `Discover this amazing find on Compass 🧭\n\nCheck out ${product.name} at ${storeMeta?.name || 'our store'} Online Store: ${url}`;

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

  const handleImagePressStart = (e: React.TouchEvent | React.PointerEvent | React.MouseEvent, clientX: number, clientY: number, isContextMenu = false) => {
    imagePressStartPos.current = { x: clientX, y: clientY };
    if (imagePressTimer.current) clearTimeout(imagePressTimer.current);

    if (isContextMenu) {
      executeCopy();
      return;
    }

    imagePressTimer.current = setTimeout(() => {
      imagePressTimer.current = null;
      executeCopy();
    }, 600);
  };

  const handleImagePressEnd = () => {
    if (imagePressTimer.current) {
      clearTimeout(imagePressTimer.current);
      imagePressTimer.current = null;
    }
    imagePressStartPos.current = null;
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ── Double Tap state ────────────────────────────────────────────────────
  const lastClickTimeRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <Link href={productLink} passHref>
      <div
        ref={cardRef}
        className="relative group h-full"
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const isImageClick = !!(e.target as Element).closest('.product-image-container');

          if (isSoldOut) {
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
            if (onOrderClick && !isSoldOut) {
              // Intelligent Color Mapping: Pre-select color based on current visible image
              let finalSelectedColor = selectedColor;
              if (isFashionProduct(product) && product.colors) {
                const colorMatch = product.colors.find(c => c.images?.includes(carouselImages[currentImageIndex]));
                if (colorMatch) {
                  finalSelectedColor = colorMatch.name;
                }
              }
              onOrderClick(product, finalSelectedColor, selectedSize, carouselImages[currentImageIndex]);
              handleTrackInteraction();
              // Haptic feedback
              if (navigator.vibrate) navigator.vibrate(20);
            }
          }, 300);
        }}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          className={`product-image-container relative aspect-[3/4] w-full rounded-[32px] overflow-hidden
          shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-lg dark:shadow-white/10
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          transform-gpu will-change-transform
          group-hover:shadow-[0_16px_24px_-8px_rgba(0,0,0,0.12),0_4px_12px_-4px_rgba(0,0,0,0.08)] dark:group-hover:shadow-xl dark:group-hover:shadow-white/15
          ${!isMobile ? 'group-hover:translate-y-[-4px]' : ''}
          bg-white dark:bg-card-background border-2 border-transparent`}
          style={{
            transform: 'translate3d(0,0,0)',
            perspective: '1000px',
            backfaceVisibility: 'hidden',
          }}
          draggable="false"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {!loadedImages[displayImage] && (
            <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-200 dark:bg-zinc-800 pointer-events-none">
              <motion.div
                className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -skew-x-[20deg]"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
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
            <>
              {/* Top Left: Discount + Limited Stock */}
              <div className="absolute top-[18px] left-[18px] z-10 flex flex-col items-start gap-2">
                {discount && (
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] shadow-sm whitespace-nowrap">
                      {discount}% OFF
                    </span>
                  </div>
                )}
                {isLimitedStock && (
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)] shadow-sm whitespace-nowrap">
                      Limited
                    </span>
                  </div>
                )}
                {/* Solar Warranty (Moved to Top Left) */}
                {isSolarProduct(product) && product.warranty && (
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-indigo-600 text-white shadow-sm whitespace-nowrap text-[9px] font-black border border-white/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                      🛡️ {product.warrantyDuration || 'Warranty'}
                    </span>
                  </div>
                )}
              </div>

              {/* Top Right: Brand + Condition */}
              {isBeautyProduct(product) && product.brand && (
                <div className="absolute top-[18px] right-[18px] z-10">
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-white/90 dark:bg-black/60 backdrop-blur text-slate-700 dark:text-slate-200 shadow-sm whitespace-nowrap border border-white/20 dark:border-white/10 uppercase font-black tracking-[0.15em] text-[9px] px-3 py-1">
                      {product.brand}
                    </span>
                  </div>
                </div>
              )}
              {isMediaInfluencerProduct(product) && product.subtype === 'event-ticket-promo' && (
                <div className="absolute top-[18px] right-[18px] z-10">
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-purple-600 text-white shadow-md whitespace-nowrap border border-white/20 uppercase font-black tracking-wider text-[9px] px-3 py-1 rounded-full">
                      🎫 TICKET PROMO
                    </span>
                  </div>
                </div>
              )}
              {isMediaInfluencerProduct(product) && isInfluencerHub && (
                <div className="absolute top-[18px] right-[18px] z-10 flex flex-col items-end gap-2">
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-emerald-600 text-white shadow-md border border-white/20 uppercase font-black tracking-wider text-[9px] px-3 py-1 rounded-full flex items-center gap-1">
                      🛡️ ESCROW PROTECTED
                    </span>
                  </div>
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-blue-600 text-white shadow-md border border-white/20 uppercase font-black tracking-wider text-[9px] px-3 py-1 rounded-full flex items-center gap-1">
                      ✨ VERIFIED
                    </span>
                  </div>
                </div>
              )}
              {isTicketProduct(product) && (
                <div className="absolute top-[18px] right-[18px] z-10">
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-blue-600 text-white shadow-md whitespace-nowrap border border-white/20 uppercase font-black tracking-wider text-[9px] px-3 py-1 rounded-full">
                      🎟️ EVENT TICKETS
                    </span>
                  </div>
                </div>
              )}
              {isDigitalProduct(product) && (
                <div className="absolute top-[18px] right-[18px] z-10">
                  <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="product-badge bg-blue-600 text-white shadow-md whitespace-nowrap border border-white/20 uppercase font-black tracking-wider text-[9px] px-3 py-1 rounded-full">
                      ⚡ DIGITAL
                    </span>
                  </div>
                </div>
              )}
              {(isElectronicsProduct(product) || isSolarProduct(product)) && (
                <div className="absolute top-[18px] right-[18px] z-10 flex flex-col items-end gap-2">
                  {/* Brand Badge */}
                  {product.brand && (
                    <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                      <span className="product-badge bg-white/90 dark:bg-black/60 backdrop-blur text-slate-700 dark:text-slate-200 shadow-sm whitespace-nowrap border border-white/20 dark:border-white/10 uppercase font-bold tracking-widest text-[10px]">
                        {product.brand}
                      </span>
                    </div>
                  )}

                  {/* Condition Badge */}
                  {product.condition && (
                    <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                      <span className={`product-badge shadow-sm whitespace-nowrap text-[10px] font-bold tracking-wide border border-white/20 px-2 py-0.5 rounded-lg ${product.condition === 'brand-new' ? 'bg-zinc-400 text-white' :
                        product.condition === 'open-box' ? 'bg-blue-500 text-white' :
                          product.condition === 'used-good' ? 'bg-green-500 text-white' :
                            product.condition === 'used-fair' ? 'bg-yellow-400 text-zinc-900' :
                              product.condition === 'refurbished' ? 'bg-purple-500 text-white' :
                                'bg-white/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 backdrop-blur'
                        }`}>
                        {product.condition === 'brand-new' && '✨ BRAND NEW'}
                        {product.condition === 'open-box' && '📦 OPEN BOX'}
                        {product.condition === 'used-good' && '👍 CLEAN'}
                        {product.condition === 'used-fair' && '⚠️ GOOD'}
                        {product.condition === 'refurbished' && '🔄 REFURB'}
                        {!['brand-new', 'open-box', 'used-good', 'used-fair', 'refurbished'].includes(product.condition) && product.condition.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {isArtProduct(product) && product.artDetails && (
                <div className="absolute top-[18px] right-[18px] z-10 flex flex-col items-end gap-2">
                  {product.artDetails.edition && (
                    <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                      <span className="product-badge bg-amber-500 text-white shadow-sm whitespace-nowrap text-[10px] font-bold tracking-wide border border-white/20 px-2 py-0.5 rounded-lg capitalize">
                        {product.artDetails.edition === 'original' ? '🖼️ Original' : product.artDetails.edition.replace('-', ' ')}
                      </span>
                    </div>
                  )}
                  {product.artDetails.isSigned && (
                    <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                      <span className="product-badge bg-indigo-600 text-white shadow-sm whitespace-nowrap text-[10px] font-bold tracking-wide border border-white/20 px-2 py-0.5 rounded-lg">
                        ✍️ Signed
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!isSoldOut && isBeautyProduct(product) && (
            <div className="absolute bottom-[14px] left-[14px] z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-80px)]">
              {/* Candle Specifics */}
              {product.subtype === 'candles' && (
                <>
                  {product.scent && (
                    <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                      <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1">
                        🕯️ {product.scent}
                      </span>
                    </div>
                  )}
                  {product.burnTime && (
                    <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                      <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1">
                        ⏱️ {product.burnTime}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Bottle Sizes / Volumes (Only if not candle or if candle has size) */}
              {product.bottleSizes && product.bottleSizes.length > 0 && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1">
                    {product.subtype === 'candles' ? '⚖️' : '🧴'} {product.bottleSizes[0].size} {product.bottleSizes[0].label && `(${product.bottleSizes[0].label})`}
                  </span>
                </div>
              )}
              {/* Skin/Hair Types */}
              {product.subtype !== 'candles' && (product.skinTypes?.[0] || product.hairTypes?.[0]) && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1 uppercase">
                    ✨ {product.skinTypes?.[0] || product.hairTypes?.[0]}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Ticket Product Overlays */}
          {!isSoldOut && isTicketProduct(product) && (
            <div className="absolute bottom-[14px] left-[14px] z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-80px)]">
              {(product as any).eventDate && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1">
                    📅 {new Date((product as any).eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} {(product as any).eventTime && `• ${(product as any).eventTime}`}
                  </span>
                </div>
              )}
              {(product as any).venue && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1 truncate max-w-[200px]">
                    📍 {(product as any).venue}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Digital Product Overlays */}
          {!isSoldOut && isDigitalProduct(product) && (
            <div className="absolute bottom-[14px] left-[14px] z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-80px)]">
              <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1 capitalize">
                  📂 {product.subtype?.replace('-', ' ')}
                </span>
              </div>
              {product.digitalDetails?.fileType && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-zinc-900/10 dark:bg-white/10 backdrop-blur text-zinc-900 dark:text-white shadow-sm font-bold flex items-center gap-1 border border-zinc-900/10 dark:border-white/10 text-[10px] tracking-widest px-2.5 py-1 uppercase">
                    📦 {product.digitalDetails.fileType}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Food Overlays on Bottom Left */}
          {!isSoldOut && isFoodBeverageProduct(product) && (
            <div className="absolute bottom-[14px] left-[14px] z-10 flex flex-wrap max-w-[calc(100%-80px)] gap-1.5">
              {product.temperature && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/90 dark:bg-black/60 backdrop-blur text-slate-700 dark:text-slate-200 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10">
                    {product.temperature === 'hot' ? '☕ Hot' : '❄️ Cold'}
                  </span>
                </div>
              )}
              {product.preparationTime !== undefined && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/90 dark:bg-black/60 backdrop-blur text-slate-700 dark:text-slate-200 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10">
                    {product.preparationTime === 0 ? '✅ Ready' : `⏱️ ${product.preparationTime}m`}
                  </span>
                </div>
              )}
              {product.spiciness && product.spiciness !== 'mild' && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-red-500/10 dark:bg-red-500/20 backdrop-blur text-red-600 dark:text-red-400 shadow-sm font-semibold flex items-center gap-1 border border-red-500/20 dark:border-red-500/30">
                    {product.spiciness === 'medium' && '🌶️ Med'}
                    {product.spiciness === 'hot' && '🔥 Hot'}
                    {product.spiciness === 'extra-hot' && '🤯 X-Hot'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Electronics Bottom Left Overlay */}
          {!isSoldOut && isElectronicsProduct(product) && (
            <div className="absolute bottom-[14px] left-[14px] z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-80px)]">
              {(() => {
                switch (product.subtype) {
                  case 'powerbank':
                    return (
                      <>
                        {product.batteryCapacity && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🔋 {product.batteryCapacity}
                            </span>
                          </div>
                        )}
                        {product.powerOutput && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              ⚡ {product.powerOutput}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  case 'audio':
                    return (
                      <>
                        {product.audioStyle && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🎧 {product.audioStyle}
                            </span>
                          </div>
                        )}
                        {product.anc && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🔇 ANC
                            </span>
                          </div>
                        )}
                      </>
                    );
                  case 'smartwatch':
                    return (
                      <>
                        {product.watchBatteryLife && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🔋 {product.watchBatteryLife}
                            </span>
                          </div>
                        )}
                        {product.connectivity && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              📶 {product.connectivity}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  case 'gaming':
                    return (
                      <>
                        {product.gamingCategory && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🎮 {product.gamingCategory}
                            </span>
                          </div>
                        )}
                        {product.gamingPlatform && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1 truncate max-w-[100px]">
                              🕹️ {product.gamingPlatform}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  case 'accessory':
                    return (
                      <>
                        {product.accessoryType && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🔌 {product.accessoryType}
                            </span>
                          </div>
                        )}
                        {product.connectivity && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🔗 {product.connectivity}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  case 'phone':
                  case 'tablet':
                  case 'laptop':
                  default:
                    return (
                      <>
                        {product.storage && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              💾 {product.storage}
                            </span>
                          </div>
                        )}
                        {product.ram && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              ⚡ {product.ram}
                            </span>
                          </div>
                        )}
                      </>
                    );
                }
              })()}
            </div>
          )}

          {/* Solar Bottom Left Overlay */}
          {!isSoldOut && isSolarProduct(product) && (
            <div className="absolute bottom-[14px] left-[14px] z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-80px)]">
              {(() => {
                const s = product;
                switch (s.subtype) {
                  case 'solar-panels':
                    return s.wattage && (
                      <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                        <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                          ☀️ {s.wattage}
                        </span>
                      </div>
                    );
                  case 'inverters':
                    return s.powerCapacity && (
                      <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                        <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                          🔄 {s.powerCapacity}
                        </span>
                      </div>
                    );
                  case 'batteries':
                    return (
                      <>
                        {s.batteryCapacity && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🔋 {s.batteryCapacity}
                            </span>
                          </div>
                        )}
                        {s.batteryChemistry && (
                          <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                            <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                              🧪 {s.batteryChemistry}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  case 'charge-controllers':
                    return s.maxCurrentRating && (
                      <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                        <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                          🎛️ {s.maxCurrentRating}
                        </span>
                      </div>
                    );
                  case 'dc-appliances':
                  case 'ac-appliances':
                    return s.powerConsumption && (
                      <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                        <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                          ⚡ {s.powerConsumption}
                        </span>
                      </div>
                    );
                  case 'solar-kits':
                    return s.totalSystemCapacity && (
                      <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                        <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-semibold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2 py-1">
                          📦 {s.totalSystemCapacity}
                        </span>
                      </div>
                    );
                  default:
                    return null;
                }
              })()}
            </div>
          )}

          {/* Media Influencer Platform Badge (Top Right) */}
          {!isSoldOut && isMediaInfluencerProduct(product) && !isInfluencerHub && (
            <div className="absolute top-[14px] right-[14px] z-10">
              <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-indigo-600 dark:text-indigo-400 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1 uppercase rounded-full">
                  📱 {product.platform}
                </span>
              </div>
            </div>
          )}

          {/* Media Influencer Overlays on Bottom Left */}
          {!isSoldOut && isMediaInfluencerProduct(product) && (
            <div className="absolute bottom-[14px] left-[14px] z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-80px)]">
              {product.subtype === 'service' && product.deliveryTimeDays !== undefined && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-indigo-600 dark:text-indigo-400 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1 uppercase rounded-lg">
                    ⏱️ {product.deliveryTimeDays} Days Delivery
                  </span>
                </div>
              )}
              {product.subtype === 'service' && product.revisionsAllowed !== undefined && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-indigo-600 dark:text-indigo-400 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1 uppercase rounded-lg">
                    🔄 {product.revisionsAllowed} Revisions
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Art Bottom Left Overlay */}
          {!isSoldOut && isArtProduct(product) && (product as any).artDetails && (
            <div className="absolute bottom-[14px] left-[14px] z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-80px)]">
              <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1">
                  🎨 {(product as any).artDetails.medium} on {(product as any).artDetails.surface}
                </span>
              </div>
              {(product as any).artDetails.dimensions && (
                <div className="badge-wrapper inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                  <span className="product-badge bg-white/95 dark:bg-black/80 backdrop-blur text-slate-800 dark:text-slate-100 shadow-sm font-bold flex items-center gap-1 border border-white/20 dark:border-white/10 text-[10px] tracking-wide px-2.5 py-1 lowercase">
                    📏 {(product as any).artDetails.dimensions}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Vehicle Overlays */}
          {!isSoldOut && isVehicleProduct(product) && (
            <>
              {/* Location Overlay (Bottom Left) */}
              {product.vehicleDetails?.location && (
                <div className="absolute bottom-[14px] left-[14px] z-10">
                  <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/20 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm flex items-center gap-1">
                      📍 {product.vehicleDetails.location}
                    </span>
                  </div>
                </div>
              )}
              {/* Mileage Overlay (Bottom Right) */}
              {product.vehicleDetails?.mileage !== undefined && (
                <div className="absolute bottom-[14px] right-[14px] z-10 mb-[-4px] mr-[36px]">
                  <div className="inline-flex transform-gpu transition-transform duration-200 group-hover:scale-105">
                    <span className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/20 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm flex items-center gap-1">
                      🛣️ {product.vehicleDetails.mileage.toLocaleString()} km
                    </span>
                  </div>
                </div>
              )}
            </>
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
                x: { type: "spring", stiffness: 400, damping: 40 },
                opacity: { duration: 0.25 }
              }}
              className="absolute inset-0 pointer-events-none"
            >
              <Image
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
                className={`object-cover object-center
                  will-change-transform group-hover:scale-[1.03] transition-opacity duration-300
                  ${loadedImages[displayImage] ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                draggable="false"
                placeholder="blur"
                blurDataURL={displayImage}
                onLoad={() => setLoadedImages(prev => ({ ...prev, [displayImage]: true }))}
                onError={handleImageError}
              />
            </motion.div>
          </AnimatePresence>

          {/* Floating Action Buttons - Only show when NOT sold out */}
          {!isSoldOut && (
            <div className={`absolute inset-0 flex flex-col items-end justify-between p-[14px] transition-opacity duration-300 ${isMobile
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
              }`}>
              {/* Spacer - Top heart was here, now removed */}
              <div />

              {/* Bottom Right Icon: Cart (Grid) or Heart (Single View) */}
              {!isInfluencerHub && (
                <motion.div className="z-30">
                  <motion.button
                    onClick={handleToggleCart}
                    disabled={isSoldOut}
                    className="flex-shrink-0 px-3 py-2 rounded-full card-glass shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                    aria-label="Add to cart"
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSingleView && (
                      <span className={`text-sm font-bold ${isInCart ? 'text-green-500' : 'text-green-500 dark:text-green-400'}`}>
                        {isInCart ? 'Added' : 'Add'}
                      </span>
                    )}
                    {isSingleView ? (
                      <ShoppingCart
                        size={18}
                        className={`transition-all duration-200 ${isInCart
                          ? 'fill-green-500 text-green-500'
                          : 'text-green-500'
                          }`}
                      />
                    ) : (
                      <ShoppingCart size={18} className={`transition-all duration-200 ${isInCart ? 'fill-green-500 text-green-500' : 'text-green-500 dark:text-green-400'}`} />
                    )}
                  </motion.button>
                </motion.div>
              )}
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
              <motion.button
                onClick={handlePrevImage}
                onContextMenu={(e) => { e.preventDefault(); handlePrevImage(e); }}
                className="absolute left-[14px] top-1/2 transform -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center justify-center transition-all duration-300"
                aria-label="Previous image"
                type="button"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.7)' }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft size={18} className="text-gray-900 drop-shadow-md" />
              </motion.button>

              {/* Right Arrow */}
              <motion.button
                onClick={handleNextImage}
                onContextMenu={(e) => { e.preventDefault(); handleNextImage(e); }}
                className="absolute right-[14px] top-1/2 transform -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center justify-center transition-all duration-300"
                aria-label="Next image"
                type="button"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.7)' }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight size={18} className="text-gray-900 drop-shadow-md" />
              </motion.button>
            </>
          )}

          {/* Carousel Dots - Bottom Center - Only show when NOT sold out */}
          {!isSoldOut && hasMultipleImages && (
            <div className={`absolute bottom-3 inset-x-0 w-full flex items-center justify-center gap-1.5 z-20 pointer-events-none transition-opacity duration-300 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {carouselImages.map((_, index) => (
                <div
                  key={index}
                  onClick={(e) => handleDotClick(e, index)}
                  className={`transition-all duration-300 ease-out rounded-full pointer-events-auto cursor-pointer ${index === currentImageIndex
                    ? 'w-1.5 h-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                    : 'w-1 h-1 bg-white/50 hover:bg-white/80'
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`mt-3 space-y-1 px-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${!isMobile ? 'group-hover:translate-y-[-2px]' : ''}`}>
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
              {isInfluencerHub && (
                <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary mr-1 block mb-0.5">Starting from</span>
              )}
              {formatPrice(product.price)}
              {isLivestockProduct(product) && (
                <span className="text-sm font-normal text-text-secondary">
                  /{product.priceUnit === 'kg' ? 'kg' : 'pc'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </Link >
  );
}
