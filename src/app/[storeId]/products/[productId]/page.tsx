'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, incrementProductViews, getStoreMeta, getCategories } from '../../../../lib/db';
import { Heart, ShoppingCart, Clock, Share2 } from 'lucide-react';
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
      dispatch({ type: 'REMOVE_ITEM', payload: product.id });
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

    // Prevent button spamming
    setTimeout(() => setIsTogglingCart(false), 400);
  };

  const getCategoryColor = (categoryName: string): { background: string; text: string } => {
    const colorMap: { [key: string]: { background: string; text: string } } = {
      'Bespoke': { background: 'bg-purple-100', text: 'text-purple-800' },
      'Ready To Wear': { background: 'bg-pink-100', text: 'text-pink-800' },
      'Default': { background: 'bg-blue-100', text: 'text-blue-800' },
    };
    return colorMap[categoryName] || colorMap['Default'];
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
              {product.limitedStock && <span className="badge-yellow">Limited Stock</span>}
              {product.soldOut && <span className="badge-red">Sold Out</span>}
              {category && <span className={`badge-blue`}>{category.name}</span>}
            </div>
            <div className="px-4 py-1 rounded-full border border-gray-300 shadow-sm flex items-center">
              <AnimatedViewCount value={product?.views || 0} />
            </div>
          </div>

          {product.soldOut ? (
            <div className="sold-out-card">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Currently Unavailable</h3>
              <p className="text-sm text-gray-600">This item is out of stock. Please check back later.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-center gap-3 mb-6">
                <p className="text-2xl font-semibold text-gray-900">{formatPrice(product.price)}</p>
                {discount && (
                  <>
                    <p className="text-lg text-gray-500 line-through">{formatPrice(product.originalPrice)}</p>
                    <span className="badge-green">{discount}% OFF</span>
                  </>
                )}
              </div>

              {product.features && (
                <div className="mb-8">
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600"><span className="mr-2">•</span>{feature}</li>
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
                    className={`group relative flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-full font-medium transition-all duration-300 transform-gpu active:scale-[0.9] disabled:opacity-75 ${isInCart ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
                  className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-medium transition-colors shadow-sm min-h-[48px] text-base bg-gray-200 text-gray-700 hover:bg-gray-300"
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
