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
  const [isTogglingCart, setIsTogglingCart] = useState(false);
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

  const handleToggleCart = () => {
    if (!product || !storeId) return;

    setIsTogglingCart(true);

    if (isInCart) {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: product.id } });
    } else {
      dispatch({ 
        type: 'ADD_ITEM', 
        payload: {
          ...product,
          quantity: 1,
          storeId: storeId,
        }
      });
    }

    setTimeout(() => setIsTogglingCart(false), 500); // Animation duration
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
                className={`w-full h-auto object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                priority={true}
                loading="eager"
                onLoadingComplete={() => setImageLoading(false)}
              />
            ) : (
              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}
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
                  className={`relative overflow-hidden rounded-lg min-w-[56px] min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button-primary)] transition-shadow duration-150 ${selectedImage === index ? 'ring-2 ring-offset-2 ring-[var(--button-primary)]' : 'hover:opacity-75'}`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 25vw, 100px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Product Info */}
        <div className="mt-4 lg:mt-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-wrap gap-1.5">
              {product.limitedStock && <span className="badge-yellow">Limited Stock</span>}
              {product.soldOut && <span className="badge-red">Sold Out</span>}
              {category && <span className={`badge-${getCategoryColor(category.name).background}`}>{category.name}</span>}
            </div>
            <div className="px-4 py-1 rounded-full border border-gray-300 dark:border-slate-700/40 bg-white/60 dark:bg-slate-900/40 shadow-sm flex items-center min-w-[64px] justify-center transition-colors duration-300" aria-label="Views" role="status">
              <AnimatedViewCount value={product?.views || 0} duration={2.5} className="text-base font-semibold text-slate-700 dark:text-slate-200" />
            </div>
          </div>

          {product.soldOut ? (
            <div className="sold-out-card">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--badge-blue-bg)]">
                <Clock className="w-6 h-6 text-[var(--badge-blue-text)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Currently Unavailable</h3>
              <p className="text-[var(--text-secondary)] text-sm">This item is out of stock. Please check back later.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold card-text-gradient mb-4">{product.name}</h1>
              <div className="flex items-center gap-3 mb-6">
                <p className="text-2xl font-semibold card-text-gradient">{formatPrice(product.price)}</p>
                {discount && (
                  <>
                    <p className="text-lg text-text-secondary line-through">{formatPrice(product.originalPrice)}</p>
                    <span className="badge-green">{discount}% OFF</span>
                  </>
                )}
              </div>

              {product.features && (
                <div className="mb-8">
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-[var(--text-secondary)]">
                        <span className="mr-2">•</span>{feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex items-stretch gap-3">
                  <button
                    onClick={handlePlaceOrderClick}
                    disabled={!canOrder}
                    className="group relative flex-grow inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[980px] bg-[var(--button-success)] text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:bg-[var(--button-success-hover)] transform-gpu active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed min-h-[56px] text-base"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="relative tracking-[-0.01em]">Place Order</span>
                  </button>
                  <button
                    onClick={handleToggleCart}
                    disabled={isTogglingCart}
                    className={`group relative flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-full font-medium transition-all duration-300 transform-gpu active:scale-[0.9] disabled:opacity-75 ${isInCart ? 'bg-red-500 text-white' : 'bg-[var(--button-secondary)] text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)]'}`}
                    style={{ minWidth: '56px', minHeight: '56px' }}
                    aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
                  >
                    <Heart
                      className={`w-6 h-6 transition-transform duration-200 ease-in-out ${isInCart ? 'fill-current' : ''}`}
                      style={{ transform: isTogglingCart && !isInCart ? 'scale(1.3)' : 'scale(1)' }}
                    />
                  </button>
                </div>
                <button
                  onClick={handleShareClick}
                  className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[980px] font-medium tracking-[-0.01em] transition-all duration-300 shadow-sm hover:shadow-md transform-gpu min-h-[48px] text-base bg-[var(--button-secondary)] text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)] active:bg-[var(--button-secondary-active)]"
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
