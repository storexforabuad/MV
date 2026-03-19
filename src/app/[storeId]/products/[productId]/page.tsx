'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, incrementProductViews, getStoreMeta, getCategories } from '@/lib/db';

import { useCart } from '@/lib/cartContext';
import { Product, FashionProduct, FoodBeverageProduct, ElectronicsProduct } from '@/types/product';
import { Category } from '@/types/category';
import { StoreMeta } from '@/types/store';
import { calculateDiscount, formatPrice } from '@/utils/price';
import { ViewHistoryCache } from '@/lib/viewHistoryCache';
import { ProductDetailCache } from '@/lib/productDetailCache';
import Navbar from '@/components/layout/navbar';
import { useCustomer } from '@/context/CustomerContext';
import CustomerLookupModal from '@/components/customer/CustomerLookupModal';
import OrderSummaryModal from '@/components/modals/OrderSummaryModal';
import toast from 'react-hot-toast';
import VehicleDetailPage from '@/components/products/VehicleDetailPage';
import {
  ensureProductType, isFashionProduct, isGeneralProduct, isVehicleProduct, isFoodBeverageProduct,
  isLivestockProduct,
  isElectronicsProduct,
  isSolarProduct
} from '@/utils/productHelpers';
import { shouldUsePaymentFlow } from '@/utils/storeHelpers';
import SizeSelector from '@/components/products/SizeSelector';
import { SizePreferencesCache } from '@/lib/sizePreferencesCache';
import SizeGuideModal from '@/components/products/SizeGuideModal';
import NeedAWebsiteModal from '@/components/customer/modals/NeedAWebsiteModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShoppingCart, Share2, PackageX, Search, Info, Gift,
  ChevronLeft, ChevronRight, ShieldCheck, Battery, Cpu, Database, Network,
  Smartphone, Activity, Check, Code, Package, Fingerprint, Globe, Sparkles,
  Headphones, VolumeX, Gamepad2, Zap, Watch, Cable, Link,
  Sun, RefreshCw, Layers, Gauge, Monitor, Wifi
} from 'lucide-react';

const ProductDetailSkeleton = dynamic(() => import('@/components/ProductDetailSkeleton'), { ssr: false });
const AnimatedViewCount = dynamic(() => import('@/components/AnimatedViewCount'), {
  ssr: false,
  loading: () => <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
});

export default function ProductDetail({ params }: { params: { storeId: string; productId: string } }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingCart, setIsTogglingCart] = useState(false);
  const { state, dispatch } = useCart();
  const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [shareIntent, setShareIntent] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const { customer } = useCustomer();
  const [imageLoading, setImageLoading] = useState(true);
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState<Record<number, boolean>>({});

  // Fashion-specific state
  const [selectedColor, setSelectedColor] = useState<FashionProduct['colors'][0] | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [highlightSizeSection, setHighlightSizeSection] = useState(false);
  const [isNeedAWebsiteModalOpen, setIsNeedAWebsiteModalOpen] = useState(false);
  const sizeSectionRef = useRef<HTMLDivElement>(null);

  // Helper to trigger size section highlight
  const triggerSizeHighlight = () => {
    setHighlightSizeSection(true);
    sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightSizeSection(false), 2000);
  };

  const discount = product ? calculateDiscount(product.price, product.originalPrice) : null;

  const router = useRouter();
  const { storeId, productId } = params;

  const productIsFashion = product ? isFashionProduct(product) : false;

  const handleShare = (withReferral: boolean) => {
    if (!product || !storeId) return;
    const productUrl = `https://tinyurl.com/bizconnet/${storeId}/products/${product.id}`;
    const canonicalShareUrl = withReferral && customer ? `${productUrl}?ref=${customer.referralCode}` : productUrl;
    const shareText = `Check out "${product.name}"! I think you'll love it. Use my link to shop:`;
    const shareData = { title: product.name, text: shareText, url: canonicalShareUrl };

    if (navigator.share) {
      navigator.share(shareData).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(`${shareText} ${canonicalShareUrl}`).then(
        () => toast.success('Link copied to clipboard!'),
        () => toast.error('Could not copy link.')
      );
    }
  };

  const handleShareClick = () => {
    if (customer) {
      handleShare(true);
    } else {
      setShareIntent(true);
      setIsLoginModalOpen(true);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchProductAndCategory() {
      if (!storeId || !productId) {
        console.error('Missing storeId or productId');
        setIsLoading(false);
        return;
      }
      try {
        let fetchedProduct: Product | undefined = ProductDetailCache.get(productId);
        if (!fetchedProduct) {
          fetchedProduct = (await getProductById(storeId, productId)) || undefined;
        }
        if (!isMounted || !fetchedProduct) return;

        const typedProduct = ensureProductType(fetchedProduct);
        setProduct(typedProduct);
        ViewHistoryCache.add(typedProduct);
        incrementProductViews(storeId, productId);

        if (typedProduct.categoryId) {
          const categories = await getCategories(storeId);
          const productCategory = categories.find(c => c.id === typedProduct.categoryId);
          if (productCategory) setCategory(productCategory);
        }
      } catch (error) {
        console.error('[PROD] Error in product detail:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProductAndCategory();
    return () => { isMounted = false; };
  }, [storeId, productId]);

  useEffect(() => {
    if (!storeId) return;
    getStoreMeta(storeId).then(meta => setStoreMeta(meta as StoreMeta | null));
  }, [storeId]);

  const allImages = useMemo(() => {
    if (!product) return [];
    const baseImages = product.images || [];
    if (!isFashionProduct(product)) return baseImages;

    const images = [...baseImages];
    product.colors.forEach(color => {
      color.images.forEach(img => {
        if (!images.includes(img)) {
          images.push(img);
        }
      });
    });
    return images;
  }, [product]);

  // Initialize selected color on load
  useEffect(() => {
    if (productIsFashion && product && allImages.length > 0 && !selectedColor) {
      const firstImageUrl = allImages[0];
      const initialColor = (product as FashionProduct).colors.find(c =>
        c.images.includes(firstImageUrl)
      );
      if (initialColor) {
        setSelectedColor(initialColor);
      } else if ((product as FashionProduct).colors.length > 0) {
        setSelectedColor((product as FashionProduct).colors[0]);
      }
    }
  }, [product, productIsFashion, allImages, selectedColor]);

  const isInCart = useMemo(() => {
    if (!product) return false;
    return state.items.some(item =>
      item.id === product.id &&
      (!productIsFashion || (item.selectedColor === selectedColor?.name && item.selectedSize === selectedSize))
    );
  }, [product, state.items, selectedSize, selectedColor, productIsFashion]);

  const handleColorSelect = (color: FashionProduct['colors'][0]) => {
    if (selectedColor?.name === color.name) return; // Don't reload if same color
    setSelectedColor(color);

    // Find the first image of this color in allImages and select it
    if (color.images.length > 0) {
      const firstImageIndex = allImages.indexOf(color.images[0]);
      if (firstImageIndex !== -1) {
        if (selectedImage !== firstImageIndex) {
          setSelectedImage(firstImageIndex);
          setImageLoading(true);
        } else {
          // Image is already selected, no need to show loading
          setImageLoading(false);
        }
      }
    }
  };

  const handleImageSelect = (index: number) => {
    if (selectedImage === index) return;

    setImageLoading(true);
    setSelectedImage(index);

    if (productIsFashion && product) {
      const selectedImageUrl = allImages[index];
      // Find which color this image belongs to
      const associatedColor = (product as FashionProduct).colors.find(color =>
        color.images.includes(selectedImageUrl)
      );

      if (associatedColor) {
        setSelectedColor(associatedColor);
      }
    }
  };

  const handlePlaceOrderClick = () => {
    if (!product) return;
    if (productIsFashion) {
      const fashionProduct = product as FashionProduct;
      const requiresSize = fashionProduct.sizes && fashionProduct.sizes.length > 0;

      if (!selectedColor) {
        toast.error('Please select a color');
        return;
      }
      if (requiresSize && !selectedSize) {
        toast.error('Please select a size');
        triggerSizeHighlight();
        return;
      }
    }
    if (isGeneralProduct(product) && product.sizeOption && !selectedSize) {
      toast.error('Please select a size first');
      triggerSizeHighlight();
      return;
    }
    setIsOrderModalOpen(true);
  };

  const handleToggleCart = () => {
    if (!product || !storeId) return;
    if (productIsFashion) {
      const fashionProduct = product as FashionProduct;
      const requiresSize = fashionProduct.sizes && fashionProduct.sizes.length > 0;

      if (!selectedColor) {
        toast.error('Please select a color');
        return;
      }
      if (requiresSize && !selectedSize) {
        toast.error('Please select a size');
        triggerSizeHighlight();
        return;
      }
    }
    if (isGeneralProduct(product) && product.sizeOption && !selectedSize) {
      toast.error('Please select a size first');
      triggerSizeHighlight();
      return;
    }

    setIsTogglingCart(true);
    const cartId = productIsFashion ? `${product.id}-${selectedColor?.name}-${selectedSize || ''}` : `${product.id}-${selectedSize || ''}`;

    if (isInCart) {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: product.id, selectedSize, selectedColor: selectedColor?.name } });
    } else {
      dispatch({ type: 'ADD_ITEM', payload: { ...product, quantity: 1, storeId, selectedSize, selectedColor: selectedColor?.name } });
    }
    setTimeout(() => setIsTogglingCart(false), 400);
  };

  const isOrderable = useMemo(() => {
    if (!product) return false;

    if (isVehicleProduct(product)) {
      return product.available;
    }

    if (product.soldOut) {
      return false;
    }

    if (isFashionProduct(product)) {
      const fashionProduct = product as FashionProduct;
      const requiresSize = fashionProduct.sizes && fashionProduct.sizes.length > 0;

      if (!selectedColor) return false;
      if (requiresSize && (!selectedSize || fashionProduct.soldOutSizes?.includes(selectedSize))) return false;
      return true;
    }

    if (isGeneralProduct(product)) {
      return !product.soldOut;
    }

    return true;
  }, [product, selectedColor, selectedSize]);


  if (isLoading) {
    return (
      <>
        <Navbar storeId={storeId} storeName="Loading..." />
        <ProductDetailSkeleton />
      </>
    );
  }
  if (!product) return <div className="p-4">Product not found</div>;

  if (storeMeta?.storeType === 'automotive' || isVehicleProduct(product)) {
    return <VehicleDetailPage product={product} storeId={storeId!} storeMeta={storeMeta} />;
  }

  return (
    <>
      <Navbar
        storeId={storeId}
        storeName={storeMeta?.name || storeId || 'Store'}
        backButtonHref={`/${storeId}`}
        activeCategoryId={category?.id}
      />
      <CustomerLookupModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setShareIntent(false);
        }}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          if (shareIntent) {
            toast.success("Logged in! Sharing with your referral link.");
            handleShare(true);
            setShareIntent(false);
          } else {
            toast.success("You can now place your order.");
          }
        }}
      />
      {isOrderable && (
        <OrderSummaryModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          product={product}
          storeMeta={storeMeta}
          customer={customer}
          selectedSize={selectedSize}
          selectedColor={selectedColor?.name}
          openedFrom="productDetails"
        />
      )}
      {productIsFashion && (
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          selectedSize={selectedSize}
          sizeCategory={(product as FashionProduct).sizeCategory || 'clothing'}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-32 pt-[calc(var(--navbar-height)+1rem)] lg:pt-[calc(var(--navbar-height)+2rem)]">
        <div className="flex flex-col lg:flex lg:flex-row gap-6 lg:gap-x-8">
          {/* Image Section */}
          <div className="flex-1 flex flex-col">
            <div className="relative overflow-hidden rounded-2xl bg-gray-50 shadow-lg dark:shadow-xl dark:shadow-white/10">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900">
                  <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-shimmer bg-[length:200%_100%]" />
                </div>
              )}
              <Image
                key={`${allImages[selectedImage]}-${selectedImage}`}
                src={allImages[selectedImage] || '/public/default_product_1200x1200.png'}
                alt={product.name}
                width={600}
                height={600}
                className={`w-full h-auto object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                priority
                onLoad={() => setImageLoading(false)}
              />
            </div>
            {allImages.length > 1 && (
              <div className="mt-4 -mx-4 px-4 scroll-px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory flex items-center gap-3 pt-2 pb-4">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageSelect(index)}
                    className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden snap-start focus:outline-none transition-all duration-200 
                      ${selectedImage === index
                        ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900 scale-105 shadow-md'
                        : 'opacity-60 hover:opacity-100'
                      }`}
                  >
                    {/* Skeleton placeholder for unloaded thumbnails */}
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

          {/* Product Info */}
          <div className="mt-4 lg:mt-0 flex flex-col flex-1">
            {/* Badges, etc. */}

            {product.soldOut ? (
              <div className="w-full text-center p-6 md:p-8 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm mt-4">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50">
                  <PackageX className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold card-text-gradient mb-2">Item Sold Out</h1>
                <p className="text-base text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-8">This product is currently unavailable. Check back later or explore other items!</p>
                <button onClick={() => router.push(`/${storeId}`)} className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium shadow-lg transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus:ring-gray-900 dark:focus:ring-offset-0">
                  <Search className="w-5 h-5" />
                  <span>Explore Store</span>
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold card-text-gradient mb-4">{product.name}</h1>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <p className="text-2xl font-semibold card-text-gradient">{formatPrice(product.price)}</p>
                    {discount && typeof product.originalPrice === 'number' && (
                      <>
                        <p className="text-lg text-gray-500 dark:text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                        <div className="badge-wrapper inline-flex">
                          <span className="product-badge bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] whitespace-nowrap">
                            {discount}% OFF
                          </span>
                        </div>
                      </>
                    )}
                    {!discount && (isGeneralProduct(product) || isFashionProduct(product) || isLivestockProduct(product)) && product.limitedStock && (
                      <div className="badge-wrapper inline-flex">
                        <span className="product-badge bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)] whitespace-nowrap">
                          Limited Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {discount && (isGeneralProduct(product) || isFashionProduct(product) || isLivestockProduct(product)) && product.limitedStock && (
                    <div className="badge-wrapper inline-flex">
                      <span className="product-badge bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)] whitespace-nowrap">
                        Limited Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* FASHION PRODUCT UI */}
                {productIsFashion && (
                  <div className='mb-6'>
                    {/* Color Selector */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Color: <span className="font-normal">{selectedColor?.name || 'Select a color'}</span></h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Map((product as FashionProduct).colors.map(c => [c.hex, c])).values()).map((color) => (
                          <button key={color.hex} onClick={() => handleColorSelect(color)} className={`relative rounded-full h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${selectedColor?.hex === color.hex ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}>
                            <span className="sr-only">{color.name}</span>
                            <span style={{ backgroundColor: color.hex }} className="block h-full w-full rounded-full border border-black border-opacity-10" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selector - Only show if product has sizes */}
                    {productIsFashion && (product as FashionProduct).sizes?.length ? (
                      <div ref={sizeSectionRef} className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Size</h3>
                          <button onClick={() => setIsSizeGuideOpen(true)} className="text-sm font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1">
                            <Info size={16} />
                            <span>Size Guide</span>
                          </button>
                        </div>
                        <SizeSelector selectedSize={selectedSize} onSizeSelect={setSelectedSize} sizes={(product as FashionProduct).sizes!} disabledSizes={(product as FashionProduct).soldOutSizes} highlight={highlightSizeSection} />
                      </div>
                    ) : null}
                  </div>
                )}

                {/* GENERAL PRODUCT UI */}
                {isGeneralProduct(product) && product.sizeOption && product.availableSizes && (
                  <div ref={!productIsFashion ? sizeSectionRef : undefined} className="mb-6">
                    <SizeSelector selectedSize={selectedSize} onSizeSelect={setSelectedSize} sizes={product.availableSizes} sizeCategory={product.sizeOption} highlight={highlightSizeSection} />
                  </div>
                )}

                {/* FOOD PRODUCT UI */}
                {isFoodBeverageProduct(product) && (
                  <div className="mb-8 space-y-6">
                    {/* Category Banner */}
                    {category && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium">
                        🍽️ {category.name}
                      </div>
                    )}

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {product.preparationTime !== undefined && (
                        product.preparationTime === 0 ? (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">
                              ✅
                            </div>
                            <div>
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">Availability</p>
                              <p className="font-semibold text-green-700 dark:text-green-300">Ready</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                              ⏱️
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Prep Time</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{product.preparationTime} mins</p>
                            </div>
                          </div>
                        )
                      )}

                      {product.spiciness && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl">
                            🌶️
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Spiciness</p>
                            <p className="font-semibold text-gray-900 dark:text-white capitalize">{product.spiciness}</p>
                          </div>
                        </div>
                      )}

                      {product.temperature && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                          <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-xl">
                            {product.temperature === 'hot' ? '☕' : product.temperature === 'cold' ? '❄️' : '🌡️'}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Temp</p>
                            <p className="font-semibold text-gray-900 dark:text-white capitalize">{product.temperature}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dietary Badges */}
                    <div className="flex flex-wrap gap-2">
                      {product.isVegetarian && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium border border-green-100 dark:border-green-800">
                          🥗 Vegetarian
                        </span>
                      )}
                      {product.isAlcoholic && !(storeMeta?.storeType === 'restaurant' && (product as any).subtype === 'drink') && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-medium border border-purple-100 dark:border-purple-800">
                          🍷 Contains Alcohol
                        </span>
                      )}
                    </div>

                    {/* Ingredients */}
                    {product.ingredients && product.ingredients.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>🥬</span> Ingredients
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {product.ingredients.map((ing, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ELECTRONICS PRODUCT UI */}
                {isElectronicsProduct(product) && (() => {
                  const elecProduct = product as ElectronicsProduct;
                  return (
                    <div className="mb-8 space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Tech Specs
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Common: Brand & Condition */}
                        {elecProduct.brand && (
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Brand</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.brand}</p>
                            </div>
                          </div>
                        )}
                        {elecProduct.condition && (
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${elecProduct.condition === 'brand-new' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Condition</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{elecProduct.condition.replace('-', ' ')}</p>
                            </div>
                          </div>
                        )}

                        {/* Dynamic Fields by Subtype */}
                        {(() => {
                          switch (elecProduct.subtype) {
                            case 'powerbank':
                              return (
                                <>
                                  {elecProduct.batteryCapacity && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <Battery className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Capacity</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.batteryCapacity}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.powerOutput && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <Zap className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Output</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.powerOutput}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            case 'audio':
                              return (
                                <>
                                  {elecProduct.audioStyle && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <Headphones className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Style</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.audioStyle}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.anc && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                        <VolumeX className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Noise Cancellation</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">Active (ANC)</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.batteryCapacity && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <Battery className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Battery</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.batteryCapacity}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            case 'smartwatch':
                              return (
                                <>
                                  {elecProduct.watchBatteryLife && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <Battery className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Battery Life</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.watchBatteryLife}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.connectivity && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Network className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Connectivity</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.connectivity}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.os && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                        <Code className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">OS</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.os}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            case 'gaming':
                              return (
                                <>
                                  {elecProduct.gamingCategory && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                        <Gamepad2 className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Category</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.gamingCategory}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.gamingPlatform && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                        <Cpu className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Platform</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 truncate" title={elecProduct.gamingPlatform}>{elecProduct.gamingPlatform}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.storage && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Database className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Storage</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.storage}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            case 'accessory':
                              return (
                                <>
                                  {elecProduct.accessoryType && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                        <Cable className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Type</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.accessoryType}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.connectivity && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                        <Link className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Connectivity</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.connectivity}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.compatibleWith && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 md:col-span-2 md:row-start-2 lg:col-span-1 lg:row-start-auto">
                                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Smartphone className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Compatible With</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.compatibleWith}</p>
                                      </div>
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
                                  {elecProduct.batteryCapacity && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <Battery className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Battery</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.batteryCapacity}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.storage && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Database className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Storage</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.storage}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.ram && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                        <Cpu className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Memory</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.ram}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.os && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                        <Code className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">OS</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.os}</p>
                                      </div>
                                    </div>
                                  )}
                                  {elecProduct.network && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Network className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Network</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.network}</p>
                                      </div>
                                    </div>
                                  )}
                                  {(elecProduct.imeiVerification || (elecProduct as any).imeiVerified !== undefined) && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                                        <Fingerprint className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">IMEI Status</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">
                                          {elecProduct.imeiVerification ? (elecProduct.imeiVerification === 'verified' ? '✅ Verified' : 'Not Verified') :
                                            ((elecProduct as any).imeiVerified ? '✅ Verified' : 'Not Verified')}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                          }
                        })()}

                        {/* Common: Box Items & Warranty */}
                        {elecProduct.packageContents && (
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Box</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.packageContents}</p>
                            </div>
                          </div>
                        )}
                        {elecProduct.warranty && elecProduct.warrantyDuration && (
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Warranty</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{elecProduct.warrantyDuration}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* SOLAR PRODUCT UI */}
                {isSolarProduct(product) && (() => {
                  const s = product;
                  return (
                    <div className="mb-8 space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Technical Specifications
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Subtype specific fields */}
                        {s.subtype === 'solar-panels' && (
                          <>
                            {s.wattage && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                  <Sun className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Wattage</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.wattage}</p>
                                </div>
                              </div>
                            )}
                            {s.cellType && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Cell Type</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{s.cellType}</p>
                                </div>
                              </div>
                            )}
                            {s.efficiencyRating && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Efficiency</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.efficiencyRating}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {s.subtype === 'inverters' && (
                          <>
                            {s.powerCapacity && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                  <RefreshCw className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Capacity</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.powerCapacity}</p>
                                </div>
                              </div>
                            )}
                            {s.inverterType && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                  <Activity className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Type</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.inverterType}</p>
                                </div>
                              </div>
                            )}
                            {s.systemVoltage && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">System Voltage</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.systemVoltage}</p>
                                </div>
                              </div>
                            )}
                            {s.smartFeatures && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                  <Wifi className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Smart Features</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">WiFi Monitoring</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {s.subtype === 'batteries' && (
                          <>
                            {s.batteryCapacity && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                  <Battery className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Capacity</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.batteryCapacity}</p>
                                </div>
                              </div>
                            )}
                            {s.batteryChemistry && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                  <Fingerprint className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Chemistry</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{s.batteryChemistry}</p>
                                </div>
                              </div>
                            )}
                            {s.lifeCycles && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                  <RefreshCw className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Life Cycles</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.lifeCycles}</p>
                                </div>
                              </div>
                            )}
                            {s.depthOfDischarge && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                                  <Activity className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">D.O.D</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.depthOfDischarge}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {s.subtype === 'charge-controllers' && (
                          <>
                            {s.controllerType && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                  <Code className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Tech Type</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.controllerType}</p>
                                </div>
                              </div>
                            )}
                            {s.maxCurrentRating && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                  <Gauge className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Max Current</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.maxCurrentRating}</p>
                                </div>
                              </div>
                            )}
                            {s.maxPvInputVoltage && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Max PV Input</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.maxPvInputVoltage}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {(s.subtype === 'dc-appliances' || s.subtype === 'ac-appliances') && (
                          <>
                            {s.applianceCategory && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                  <Monitor className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Appliance</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.applianceCategory}</p>
                                </div>
                              </div>
                            )}
                            {s.powerConsumption && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Consumption</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.powerConsumption}</p>
                                </div>
                              </div>
                            )}
                            {s.operatingVoltage && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                  <Activity className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Voltage</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.operatingVoltage}</p>
                                </div>
                              </div>
                            )}
                            {s.energyStarRating && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Energy Rating</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.energyStarRating}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {s.subtype === 'solar-kits' && (
                          <>
                            {s.totalSystemCapacity && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Kit Capacity</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.totalSystemCapacity}</p>
                                </div>
                              </div>
                            )}
                            {s.estimatedDailyYield && (
                              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Est. Yield</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.estimatedDailyYield}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Common: Warranty */}
                        {s.warranty && s.warrantyDuration && (
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Warranty</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{s.warrantyDuration}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {product.description && !isFoodBeverageProduct(product) && (
                  <div className={`mb-8 ${(isElectronicsProduct(product) || isSolarProduct(product)) ? 'p-6 rounded-[2rem] bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50' : ''}`}>
                    {(isElectronicsProduct(product) || isSolarProduct(product)) && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                          <Info className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Unit Condition & Notes</h3>
                      </div>
                    )}
                    <p className={`text-gray-600 dark:text-gray-300 leading-relaxed ${(isElectronicsProduct(product) || isSolarProduct(product)) ? 'text-[15px]' : ''}`}>
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Optimized Branded Footer */}
                {false && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 mb-8 flex justify-center w-full relative"
                  >
                    {(() => {
                      const is420Hub = storeMeta?.id === '420-Hub' || storeMeta?.name === '420-Hub' || storeMeta?.name === '420 Hub';
                      const isStunnerStores = storeMeta?.id?.toLowerCase().includes('stunner') || storeMeta?.name?.toLowerCase().includes('stunner');
                      return (
                        <button
                          onClick={() => setIsNeedAWebsiteModalOpen(true)}
                          className={`w-full relative p-6 sm:p-8 rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group border ${isStunnerStores ? 'bg-gradient-to-br from-zinc-950/90 via-black to-violet-950/80 border-violet-500/30' : is420Hub ? 'bg-gradient-to-br from-zinc-950/90 via-black to-emerald-950/80 border-emerald-500/30' : 'bg-gradient-to-br from-[#1a1a40] via-[#2d1b4d] to-[#1a1a40] border-amber-500/30'}`}
                        >
                          {/* Promo Badge */}
                          <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-20 uppercase tracking-[0.2em] border ${isStunnerStores ? 'bg-gradient-to-r from-violet-500 to-violet-600 shadow-violet-500/20 border-violet-400/20' : is420Hub ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20 border-emerald-400/20' : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/20 border-amber-400/20'}`}>
                            PROMO
                          </div>

                          {/* Shimmer Layer */}
                          <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent" />
                          </div>

                          {/* Subtle background glows */}
                          <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full opacity-50 z-0 ${isStunnerStores ? 'bg-violet-500/10' : is420Hub ? 'bg-emerald-400/10' : 'bg-amber-400/10'}`} />
                          <div className={`absolute -bottom-10 -left-10 w-32 h-32 blur-[40px] rounded-full opacity-50 z-0 ${isStunnerStores ? 'bg-cyan-500/10' : is420Hub ? 'bg-emerald-600/10' : 'bg-purple-500/10'}`} />

                          <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform ${isStunnerStores ? 'bg-violet-500/10 border-violet-500/20' : is420Hub ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-amber-400/10 border-amber-400/20'}`}>
                                <Globe className={`w-4 h-4 ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`} />
                              </div>
                              <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isStunnerStores ? 'text-violet-400/80' : is420Hub ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>
                                POWERED BY <span className={isStunnerStores ? 'text-violet-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}>BIZCONNET™ 2026.</span>
                              </span>
                            </div>

                            <div className="flex flex-col items-center gap-1 text-center w-full px-2">
                              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-snug">
                                Get your professional business Website like <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{storeMeta?.name || 'this'}</span>
                              </h3>
                              <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mt-2 group-hover:gap-3 transition-all ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`}>
                                Tap to start <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                <span>→</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })()}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons */}
      {!product.soldOut && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white dark:bg-background border-t border-gray-100 dark:border-gray-800 flex gap-3 z-40 safe-area-bottom shadow-sm">
          <button onClick={handlePlaceOrderClick} className={`group relative flex-grow inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] text-base ${!isOrderable ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 text-white hover:shadow-lg hover:bg-green-700'}`}>
            <ShoppingCart className="w-5 h-5" />
            <span>{shouldUsePaymentFlow(storeMeta?.storeType, storeMeta?.subscriptionStatus) ? 'Place Order' : 'Place Order'}</span>
          </button>
          <button onClick={handleToggleCart} disabled={isTogglingCart} className={`group relative flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl font-medium transition-all duration-300 transform-gpu active:scale-[0.9] disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-700 shadow-sm ${isInCart ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'} ${!isOrderable ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Heart className={`w-6 h-6 transition-transform duration-200 ease-in-out ${isInCart ? 'fill-current scale-110' : ''}`} />
          </button>
        </div>
      )}

      <NeedAWebsiteModal
        isOpen={isNeedAWebsiteModalOpen}
        onClose={() => setIsNeedAWebsiteModalOpen(false)}
        storeId={storeId}
        storeName={storeMeta?.name}
      />
    </>
  );
}
