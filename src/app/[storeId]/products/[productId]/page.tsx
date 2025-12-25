'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, incrementProductViews, getStoreMeta, getCategories } from '../../../../lib/db';
import { Heart, ShoppingCart, Share2, PackageX, Search, Info } from 'lucide-react';
import { useCart } from '../../../../lib/cartContext';
import { Product, FashionProduct, FoodBeverageProduct  } from '../../../../types/product';
import { Category } from '../../../../types/category';
import { StoreMeta } from '../../../../types/store';
import { calculateDiscount, formatPrice } from '../../../../utils/price';
import { ViewHistoryCache } from '../../../../lib/viewHistoryCache';
import { ProductDetailCache } from '../../../../lib/productDetailCache';
import Navbar from '../../../../components/layout/navbar';
import { useCustomer } from '../../../../context/CustomerContext';
import CustomerLookupModal from '../../../../components/customer/CustomerLookupModal';
import OrderSummaryModal from '../../../../components/modals/OrderSummaryModal';
import toast from 'react-hot-toast';
import VehicleDetailPage from '../../../../components/products/VehicleDetailPage';
import { ensureProductType, isFashionProduct, isGeneralProduct, isVehicleProduct, isFoodBeverageProduct } from '../../../../utils/productHelpers';
import SizeSelector from '../../../../components/products/SizeSelector';
import { SizePreferencesCache } from '../../../../lib/sizePreferencesCache';
import SizeGuideModal from '../../../../components/products/SizeGuideModal';

const ProductDetailSkeleton = dynamic(() => import('../../../../components/ProductDetailSkeleton'), { ssr: false });
const AnimatedViewCount = dynamic(() => import('../../../../components/AnimatedViewCount'), {
  ssr: false,
  loading: () => <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
});

export default function ProductDetail() {
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

  // Fashion-specific state
  const [selectedColor, setSelectedColor] = useState<FashionProduct['colors'][0] | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const discount = product ? calculateDiscount(product.price, product.originalPrice) : null;

  const router = useRouter();
  const routeParams = useParams();
  const storeId = typeof routeParams?.storeId === 'string' ? routeParams.storeId : Array.isArray(routeParams?.storeId) ? routeParams.storeId[0] : undefined;
  const productId = typeof routeParams?.productId === 'string' ? routeParams.productId : Array.isArray(routeParams?.productId) ? routeParams.productId[0] : undefined;

  const productIsFashion = product ? isFashionProduct(product) : false;

  const handleShare = (withReferral: boolean) => {
    if (!product || !storeId) return;
    const productUrl = `https://tinyurl.com/bizcononline/${storeId}/products/${product.id}`;
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

  const isInCart = useMemo(() => {
    if (!product) return false;
    return state.items.some(item =>
      item.id === product.id &&
      (!productIsFashion || (item.selectedColor === selectedColor?.name && item.selectedSize === selectedSize))
    );
  }, [product, state.items, selectedSize, selectedColor, productIsFashion]);

  const handleColorSelect = (color: FashionProduct['colors'][0]) => {
    setSelectedColor(color);
    setSelectedImage(0); // Reset to first image of the new color
    setImageLoading(true);
  };

  const handlePlaceOrderClick = () => {
    if (!product) return;
    if (productIsFashion && (!selectedColor || !selectedSize)) {
      toast.error('Please select a color and size');
      return;
    }
    if (isGeneralProduct(product) && product.sizeOption && !selectedSize) {
      toast.error('Please select a size first');
      return;
    }
    if (customer) setIsOrderModalOpen(true); else setIsLoginModalOpen(true);
  };

  const handleToggleCart = () => {
    if (!product || !storeId) return;
    if (productIsFashion && (!selectedColor || !selectedSize)) {
      toast.error('Please select a color and size');
      return;
    }
    if (isGeneralProduct(product) && product.sizeOption && !selectedSize) {
      toast.error('Please select a size first');
      return;
    }

    setIsTogglingCart(true);
    const cartId = productIsFashion ? `${product.id}-${selectedColor?.name}-${selectedSize}` : `${product.id}-${selectedSize}`;

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
      return !!selectedColor && !!selectedSize && !product.soldOutSizes?.includes(selectedSize);
    }

    if (isGeneralProduct(product)) {
      return !product.soldOut;
    }

    return true;
  }, [product, selectedColor, selectedSize]);

  const currentImages = useMemo(() => {
    if (productIsFashion && selectedColor && selectedColor.images.length > 0) {
      return selectedColor.images;
    }
    return product?.images || [];
  }, [product, productIsFashion, selectedColor]);


  if (isLoading) return <ProductDetailSkeleton />;
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
        />
      )}
      {productIsFashion && (
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          selectedSize={selectedSize}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-32 pt-[calc(var(--navbar-height)+1rem)] lg:pt-[calc(var(--navbar-height)+2rem)]">
        <div className="flex flex-col lg:flex lg:flex-row gap-6 lg:gap-x-8">
          {/* Image Section */}
          <div className="flex-1 flex flex-col">
            <div className="relative overflow-hidden rounded-2xl bg-gray-50 shadow-lg dark:shadow-xl dark:shadow-white/10">
              {imageLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
              <Image src={currentImages[selectedImage] || '/public/default_product_1200x1200.png'} alt={product.name} width={600} height={600} className={`w-full h-auto object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`} priority onLoadingComplete={() => setImageLoading(false)} />
            </div>
            {currentImages.length > 1 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {currentImages.map((image, index) => (
                  <button key={index} onClick={() => { setImageLoading(true); setSelectedImage(index); }} className={`relative overflow-hidden rounded-lg min-w-[56px] min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-shadow duration-150 ${selectedImage === index ? 'ring-2 ring-offset-2 ring-indigo-500' : 'hover:opacity-75'}`}>
                    <Image src={image} alt={`${product.name} ${index + 1}`} fill sizes="(max-width: 640px) 25vw, 100px" className="object-cover" />
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
                {/* Price and Discount */}
                <div className="flex items-center gap-3 mb-6">
                  <p className="text-2xl font-semibold card-text-gradient">{formatPrice(product.price)}</p>
                  {discount && typeof product.originalPrice === 'number' && (
                    <>
                      <p className="text-lg text-gray-500 dark:text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-200 bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]">{discount}% OFF</span>
                    </>
                  )}
                </div>

                {/* FASHION PRODUCT UI */}
                {productIsFashion && (
                  <div className='mb-6'>
                    {/* Color Selector */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Color: <span className="font-normal">{selectedColor?.name || 'Select a color'}</span></h3>
                      <div className="flex flex-wrap gap-2">
                        {(product as FashionProduct).colors.map((color) => (
                          <button key={color.name} onClick={() => handleColorSelect(color)} className={`relative rounded-full h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${selectedColor?.name === color.name ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}>
                            <span className="sr-only">{color.name}</span>
                            <span style={{ backgroundColor: color.hex }} className="block h-full w-full rounded-full border border-black border-opacity-10" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selector */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Size</h3>
                        <button onClick={() => setIsSizeGuideOpen(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
                          <Info size={16} />
                          <span>Size Guide</span>
                        </button>
                      </div>
                      <SizeSelector selectedSize={selectedSize} onSizeSelect={setSelectedSize} sizes={(product as FashionProduct).sizes} disabledSizes={(product as FashionProduct).soldOutSizes} />
                    </div>
                  </div>
                )}

                {/* GENERAL PRODUCT UI */}
                {isGeneralProduct(product) && product.sizeOption && product.availableSizes && (
                  <div className="mb-6">
                    <SizeSelector selectedSize={selectedSize} onSizeSelect={setSelectedSize} sizes={product.availableSizes} sizeCategory={product.sizeOption} />
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
                      {product.preparationTime && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                            ⏱️
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Prep Time</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{product.preparationTime} mins</p>
                          </div>
                        </div>
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

                {product.description && !isFoodBeverageProduct(product) && <p className="text-gray-600 dark:text-gray-300 mb-8">{product.description}</p>}

                {/* Action Buttons */}
                <button onClick={handleShareClick} className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-medium transition-colors shadow-sm min-h-[48px] text-base bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                  <Share2 className="w-5 h-5 mr-2" />
                  <span>Share & Earn</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons */}
      {!product.soldOut && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-3 z-40 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button onClick={handlePlaceOrderClick} disabled={!isOrderable} className="group relative flex-grow inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 transition-all active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed text-base">
            <ShoppingCart className="w-5 h-5" />
            <span>Place Order</span>
          </button>
          <button onClick={handleToggleCart} disabled={isTogglingCart || !isOrderable} className={`group relative flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl font-medium transition-all duration-300 transform-gpu active:scale-[0.9] disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-700 ${isInCart ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}>
            <Heart className={`w-6 h-6 transition-transform duration-200 ease-in-out ${isInCart ? 'fill-current scale-110' : ''}`} />
          </button>
        </div>
      )}
    </>
  );
}
