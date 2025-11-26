'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, incrementProductViews, getStoreMeta, getCategories } from '../../../../lib/db';
import { Heart, ShoppingCart, Share2, PackageX, Search } from 'lucide-react';
import { useCart } from '../../../../lib/cartContext';
import { Product } from '../../../../types/product';
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
import { ensureProductType, isGeneralProduct, isVehicleProduct } from '../../../../utils/productHelpers';
import SizeSelector from '../../../../components/products/SizeSelector';
import { SizePreferencesCache } from '../../../../lib/sizePreferencesCache';

// Dynamic imports
const ProductDetailSkeleton = dynamic(() => import('../../../../components/ProductDetailSkeleton'), {
  ssr: false
});

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
  const [isInCart, setIsInCart] = useState(false);
  const { state, dispatch } = useCart();
  const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [shareIntent, setShareIntent] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const { customer } = useCustomer();
  const [imageLoading, setImageLoading] = useState(true);

  const discount = product ? calculateDiscount(product.price, product.originalPrice) : null;

  const router = useRouter();
  const routeParams = useParams();
  const storeId = typeof routeParams?.storeId === 'string' ? routeParams.storeId : Array.isArray(routeParams?.storeId) ? routeParams.storeId[0] : undefined;
  const productId = typeof routeParams?.productId === 'string' ? routeParams.productId : Array.isArray(routeParams?.productId) ? routeParams.productId[0] : undefined;

  const handleShare = (withReferral: boolean) => {
    if (!product || !storeId) return;

    const productUrl = `https://tinyurl.com/bizcononline/${storeId}/products/${product.id}`;
    const canonicalShareUrl = withReferral && customer ? `${productUrl}?ref=${customer.referralCode}` : productUrl;

    const shareText = `Check out "${product.name}"! I think you'll love it. Use my link to shop:`;

    const shareData = {
      title: product.name,
      text: shareText,
      url: canonicalShareUrl,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
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
      try {
        if (!storeId || !productId) {
          setProduct(null);
          setIsLoading(false);
          console.error('Missing storeId or productId in product detail page');
          return;
        }
        let fetchedProduct: Product | undefined = ProductDetailCache.get(productId);
        if (!fetchedProduct) {
          fetchedProduct = (await getProductById(storeId, productId)) || undefined;
        }
        if (!isMounted) return;
        if (fetchedProduct) {
          const typedProduct = ensureProductType(fetchedProduct);
          setProduct(typedProduct);
          ViewHistoryCache.add(typedProduct);
          await incrementProductViews(storeId, productId);

          // Only fetch category for general products
          if (isGeneralProduct(typedProduct) && typedProduct.categoryId) {
            const categories = await getCategories(storeId);
            const productCategory = categories.find(c => c.id === typedProduct.categoryId);
            if (productCategory) {
              setCategory(productCategory);
            }
          }
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
    async function fetchMeta() {
      if (!storeId) return;
      const meta = await getStoreMeta(storeId);
      setStoreMeta(meta as StoreMeta | null);
    }
    fetchMeta();
  }, [storeId]);

  useEffect(() => {
    if (product) {
      // Check if this specific product variant (ID + Size) is in the cart
      const productInCart = state.items.find(item =>
        item.id === product.id &&
        // If product has size options, match size. Otherwise, ignore size.
        (product.sizeOption ? item.selectedSize === selectedSize : true)
      );
      setIsInCart(!!productInCart);
    }
  }, [product, state.items, selectedSize]);

  // Load size preference on mount
  useEffect(() => {
    if (product?.sizeOption) {
      const cachedSize = SizePreferencesCache.get(product.id);
      if (cachedSize && product.availableSizes?.includes(cachedSize)) {
        setSelectedSize(cachedSize);
      }
    }
  }, [product]);

  // Save size preference when changed
  useEffect(() => {
    if (product?.id && selectedSize) {
      SizePreferencesCache.set(product.id, selectedSize);
    }
  }, [product, selectedSize]);

  useEffect(() => {
    if (storeId) {
      const handlePopState = () => {
        router.push(`/${storeId}`);
      };

      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [storeId, router]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return <div className="p-4">Product not found</div>;
  }

  // If it's an automotive product, render the specialized vehicle page
  if (storeMeta?.storeType === 'automotive' || isVehicleProduct(product)) {
    return (
      <VehicleDetailPage
        product={product}
        storeId={storeId!}
        storeMeta={storeMeta}
      />
    );
  }

  const handlePlaceOrderClick = () => {
    if (product?.sizeOption && !selectedSize) {
      toast.error('Please select a size first');
      return;
    }

    if (customer) {
      setIsOrderModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleToggleCart = () => {
    if (!product || !storeId) return;

    if (product.sizeOption && !selectedSize) {
      toast.error('Please select a size first');
      return;
    }

    setIsTogglingCart(true);

    if (isInCart) {
      dispatch({
        type: 'REMOVE_ITEM',
        payload: { id: product.id, selectedSize }
      });
    } else {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          ...product,
          quantity: 1,
          storeId: storeId,
          selectedSize: selectedSize,
        }
      });
    }

    setTimeout(() => setIsTogglingCart(false), 400);
  };

  const getCategoryColor = (categoryName: string): { background: string; text: string } => {
    const colorMap: { [key: string]: { background: string; text: string } } = {
      'Bespoke': {
        background: 'bg-[var(--badge-purple-bg)]',
        text: 'text-[var(--badge-purple-text)]'
      },
      'Ready To Wear': {
        background: 'bg-[var(--badge-pink-bg)]',
        text: 'text-[var(--badge-pink-text)]'
      }
    };

    return colorMap[categoryName] || {
      background: 'bg-[var(--badge-blue-bg)]',
      text: 'text-[var(--badge-blue-text)]'
    };
  };

  // We know it's a general product here because of the check above
  const generalProduct = product as import('../../../../types/product').GeneralProduct;
  const canOrder = generalProduct && !generalProduct.soldOut;

  return (
    <>
      <Navbar storeName={storeMeta?.name || storeId || 'Store'} backButtonHref={`/${storeId}`} />
      <CustomerLookupModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setShareIntent(false);
        }}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          if (shareIntent) {
            toast.success("You're logged in! Sharing with your referral link.");
            handleShare(true);
            setShareIntent(false);
          } else {
            toast.success("You're logged in! You can now place your order.");
          }
        }}
      />
      <OrderSummaryModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={product}
        storeId={storeId!} // Changed from storeMeta/customer to storeId to match component prop
        selectedSize={selectedSize}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-[calc(var(--navbar-height)+1rem)] lg:pt-[calc(var(--navbar-height)+2rem)]">
        <div className="flex flex-col lg:flex lg:flex-row gap-6 lg:gap-x-8">
          {/* Image Section */}
          <div className="flex-1 flex flex-col">
            <div className="relative overflow-hidden rounded-2xl bg-gray-50 shadow-lg dark:shadow-xl dark:shadow-white/10">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                width={600}
                height={600}
                className={`w-full h-auto object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                priority
                onLoadingComplete={() => setImageLoading(false)}
              />
            </div>
            {product.images.length > 1 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setImageLoading(true);
                      setSelectedImage(index);
                    }}
                    className={`relative overflow-hidden rounded-lg min-w-[56px] min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-shadow duration-150 ${selectedImage === index ? 'ring-2 ring-offset-2 ring-indigo-500' : 'hover:opacity-75'}`}
                  >
                    <Image src={image} alt={`${product.name} ${index + 1}`} fill sizes="(max-width: 640px) 25vw, 100px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="mt-4 lg:mt-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-wrap gap-1.5">
                {generalProduct.limitedStock && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-200 bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)]">
                    Limited Stock
                  </span>
                )}
                {generalProduct.soldOut && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-200 bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]">
                    Sold Out
                  </span>
                )}
                {category && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-200 ${getCategoryColor(category.name).background} ${getCategoryColor(category.name).text}`}>
                    {category.name}
                  </span>
                )}
              </div>
              <div className="hidden px-4 py-1 rounded-full border border-gray-300 dark:border-gray-700 shadow-sm flex items-center">
                <AnimatedViewCount productId={product.id} storeId={storeId!} initialViews={product.views || 0} />
              </div>
            </div>

            {generalProduct.soldOut ? (
              <div className="w-full text-center p-6 md:p-8 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm mt-4">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50">
                  <PackageX className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold card-text-gradient mb-2">Item Sold Out</h1>
                <p className="text-base text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-8">
                  This product is currently unavailable. We have plenty of other amazing items for you to discover!
                </p>
                <button
                  onClick={() => router.push(`/${storeId}`)}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium shadow-lg transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus:ring-gray-900 dark:focus:ring-offset-0"
                >
                  <Search className="w-5 h-5" />
                  <span>Explore Other Products</span>
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold card-text-gradient mb-4">{product.name}</h1>
                <div className="flex items-center gap-3 mb-6">
                  <p className="text-2xl font-semibold card-text-gradient">{formatPrice(product.price)}</p>
                  {discount && typeof product.originalPrice === 'number' && (
                    <>
                      <p className="text-lg text-gray-500 dark:text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-200 bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>

                {generalProduct.sizeOption && generalProduct.availableSizes && (
                  <div className="mb-6">
                    <SizeSelector
                      selectedSize={selectedSize}
                      onSizeSelect={setSelectedSize}
                      sizes={generalProduct.availableSizes}
                      sizeCategory={generalProduct.sizeOption}
                    />
                  </div>
                )}

                {generalProduct.features && (
                  <div className="mb-8">
                    <ul className="space-y-2">
                      {generalProduct.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-600 dark:text-gray-300"><span className="mr-2">•</span>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex items-stretch gap-3">
                    <button
                      onClick={handlePlaceOrderClick}
                      disabled={!canOrder}
                      className="group relative flex-grow inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-green-600 text-white font-medium shadow-sm hover:bg-green-700 transition-colors active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed min-h-[56px] text-base"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Place Order</span>
                    </button>
                    <button
                      onClick={handleToggleCart}
                      disabled={isTogglingCart}
                      className={`group relative flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-full font-medium transition-all duration-300 transform-gpu active:scale-[0.9] disabled:opacity-75 ${isInCart ? 'bg-red-500 text-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                      style={{ minWidth: '56px', minHeight: '56px' }}
                      aria-label={isInCart ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart
                        className={`w-6 h-6 transition-transform duration-200 ease-in-out ${isInCart ? 'fill-current' : ''} ${isTogglingCart && !isInCart ? 'scale(1.3)' : 'scale(1)'}`}
                      />
                    </button>
                  </div>
                  <button
                    onClick={handleShareClick}
                    className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-medium transition-colors shadow-sm min-h-[48px] text-base bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    <span>Share & Earn</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
