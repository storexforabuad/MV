'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, incrementProductViews, getStoreMeta, getCategories } from '../../../../lib/db';
import { Heart, ShoppingCart, Clock, Check, Share2 } from 'lucide-react';
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
  const [isAdding, setIsAdding] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const { state, dispatch } = useCart();
  const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [shareIntent, setShareIntent] = useState(false);

  const { customer } = useCustomer();

  const [imageLoading, setImageLoading] = useState(true);

  const discount = product ? calculateDiscount(product.price, product.originalPrice) : null;

  const router = useRouter();
  const routeParams = useParams();
  const storeId = typeof routeParams?.storeId === 'string' ? routeParams.storeId : Array.isArray(routeParams?.storeId) ? routeParams.storeId[0] : undefined;
  const productId = typeof routeParams?.productId === 'string' ? routeParams.productId : Array.isArray(routeParams?.productId) ? routeParams.productId[0] : undefined;

  const handleShare = (withReferral: boolean) => {
    if (!product || !storeId) return;

    const productUrl = `${window.location.origin}/${storeId}/products/${product.id}`;
    const canonicalShareUrl = withReferral && customer ? `${productUrl}?ref=${customer.referralCode}` : productUrl;
    const tinyUrlStoreLink = `https://tinyurl.com/bizcononline/${storeId}`;

    const shareText = `Check out "${product.name}" on the ${storeMeta?.name || storeId} store!\n\nShop the collection here: ${tinyUrlStoreLink}`;

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
      navigator.clipboard.writeText(canonicalShareUrl).then(
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
          setProduct(fetchedProduct);
          ViewHistoryCache.add(fetchedProduct);
          await incrementProductViews(storeId, productId);

          if (fetchedProduct.categoryId) {
            const categories = await getCategories(storeId);
            const productCategory = categories.find(c => c.id === fetchedProduct.categoryId);
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
      const productInCart = state.items.find(item => item.id === product.id);
      setIsInCart(!!productInCart);
    }
  }, [product, state.items]);

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

  const handlePlaceOrderClick = () => {
    if (customer) {
      setIsOrderModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleAddToCart = () => {
    if (!product || !storeId) return;
    
    setIsAdding(true);
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: {
        ...product,
        quantity: 1,
        storeId: storeId, // Ensure storeId is added to the cart item
      }
    });
    setIsAdding(false);
    setIsInCart(true);
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

  const canOrder = product && !product.soldOut;

return (
  <>
    <Navbar storeName={storeMeta?.name || storeId || 'Alaniq INT.'} backButtonHref={`/${storeId}`} />
    <CustomerLookupModal 
      isOpen={isLoginModalOpen}
      onClose={() => {
        setIsLoginModalOpen(false);
        setShareIntent(false); // Reset intent if modal is closed
      }}
      onSuccess={() => {
        setIsLoginModalOpen(false);
        if (shareIntent) {
          toast.success("You're logged in! Sharing with your referral link.");
          handleShare(true);
          setShareIntent(false); // Reset intent after sharing
        } else {
          toast.success("You're logged in! You can now place your order.");
        }
      }}
    />
    <OrderSummaryModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        product={product} 
        storeMeta={storeMeta} 
        customer={customer}
    />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-[calc(var(--navbar-height)+1rem)] lg:pt-[calc(var(--navbar-height)+2rem)]">
      <div className="flex flex-col lg:flex lg:flex-row gap-6 lg:gap-x-8">
        {/* Image Section */}
        <div className="flex-1 flex flex-col">
          <div className="relative overflow-hidden rounded-2xl bg-gray-50 shadow-lg">
          {imageLoading && (
    <div className="absolute inset-0 bg-[var(--skeleton-background)] animate-pulse">
      <div className="aspect-square" />
    </div>
  )}
            {product.images[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                width={600}
                height={600}
                className={`w-full h-auto object-contain transition-opacity duration-300
                  ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                priority={true}
                loading="eager"
                placeholder="blur"
                blurDataURL={product.images[selectedImage]}
                onLoadingComplete={() => setImageLoading(false)}
                onLoad={() => setImageLoading(false)}
              />
            ) : (
              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}
          </div>
          {/* Reduce spacing below image for mobile */}
          <div className="mt-0.5 mb-0.5">
            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="mt-1 grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setImageLoading(true);
                      setSelectedImage(index);
                    }}
                    className={`relative overflow-hidden rounded-lg min-w-[48px] min-h-[48px] sm:min-w-[56px] sm:min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button-primary)] transition-shadow duration-150
                      ${selectedImage === index 
                        ? 'ring-2 ring-offset-2 ring-[var(--button-primary)]' 
                        : 'hover:opacity-75'
                      }`}
                    aria-label={`View image ${index + 1} of ${product.name}`}
                    tabIndex={0}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-auto object-contain pointer-events-none"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Product Info */}
        <div className="mt-1 lg:mt-0 flex flex-col">
          {/* Badges and View Count Row - moved up for mobile */}
          <div className="flex items-center justify-between mb-1">
            {/* Left side - Badges */}
            <div className="flex flex-wrap gap-1.5">
              {product.limitedStock && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-200 bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)]">
                  Limited Stock
                </span>
              )}
              {product?.soldOut && (
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

            {/* Right side - View Count */}
            <div className="px-4 py-1 rounded-full border border-gray-300 dark:border-slate-700/40 bg-white/60 dark:bg-slate-900/40 shadow-sm flex items-center min-w-[64px] justify-center transition-colors duration-300" aria-label="Views" role="status">
              <AnimatedViewCount value={product?.views || 0} duration={2.5} className="text-base font-semibold text-slate-700 dark:text-slate-200" />
            </div>
          </div>

          {/* Conditional Content based on soldOut status */}
          {product?.soldOut ? (
            // Only show the "Check Back Later" message for sold out products
            <div className="mt-2 bg-[var(--card-background)] border border-[var(--border-color)] 
              rounded-2xl p-6 text-center">
              {/* Icon Container */}
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 
                rounded-full bg-[var(--badge-blue-bg)]">
                <Clock className="w-6 h-6 text-[var(--badge-blue-text)]" />
              </div>
              
              {/* Message */}
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                Currently Unavailable
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                This item is temporarily out of stock. Please check back later or explore our other collections.
              </p>
            </div>
          ) : (
            <>
              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-bold card-text-gradient mb-4">
                {product?.name}
              </h1>

              {/* Price Section */}
              <div className="flex items-center gap-3 mb-6">
                <p className="text-2xl font-semibold card-text-gradient">
                  {product && formatPrice(product.price)}
                </p>
                {product?.originalPrice && product.originalPrice > product.price && (
                  <>
                    <p className="text-lg text-text-secondary line-through">
                      {formatPrice(product.originalPrice)}
                    </p>
                    {discount && (
                      <span className="px-2 py-1 rounded-full text-sm font-medium 
                        bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]">
                        {discount}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Features Section */}
              {product?.features && (
                <div className="mb-8">
                  {/* <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">Features</h2> */}
                  <ul className="space-y-2">

                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-[var(--text-secondary)]">
                        <span className="mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePlaceOrderClick}
                    disabled={!canOrder}
                    className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[980px] bg-[var(--button-success)] text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:bg-[var(--button-success-hover)] transform-gpu active:scale-[0.98] cursor-default disabled:opacity-75 disabled:cursor-not-allowed product-detail-button-success min-h-[48px] text-base"
                    style={{ minHeight: '48px', fontSize: '1rem' }}
                    tabIndex={0}
                    aria-label="Place Order"
                  >
                    <ShoppingCart className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                    <span className="relative tracking-[-0.01em]">Order</span>
                  </button>
                  <button 
                    onClick={handleAddToCart}
                    disabled={isAdding || isInCart}
                    className={`group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[980px] font-medium tracking-[-0.01em] transition-all duration-300 shadow-sm hover:shadow-md transform-gpu min-h-[48px] text-base
                      ${isAdding || isInCart
                        ? 'bg-[var(--button-secondary-disabled)] text-[var(--text-secondary-disabled)] cursor-default'
                        : 'bg-[var(--button-secondary)] text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)] active:bg-[var(--button-secondary-active)] product-detail-button-secondary'
                      }
                      disabled:opacity-100`}
                    style={{ minHeight: '48px', fontSize: '1rem' }}
                    aria-disabled={isAdding || isInCart}
                    tabIndex={0}
                    aria-label={isInCart ? 'Added' : 'Add To Cart'}
                  >
                    {isInCart
                      ? <Check className="w-5 h-5 transition-transform opacity-80" />
                      : <Heart className={`w-5 h-5 transition-transform ${isAdding ? 'opacity-60' : 'group-hover:-translate-y-0.5'}`} />
                    }
                    <span>
                      {isInCart ? 'Added' : ''}
                    </span>
                  </button>
                </div>
                <button
                  onClick={handleShareClick}
                  className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[980px] font-medium tracking-[-0.01em] transition-all duration-300 shadow-sm hover:shadow-md transform-gpu min-h-[48px] text-base bg-[var(--button-secondary)] text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)] active:bg-[var(--button-secondary-active)] product-detail-button-secondary"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share & Earn
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
