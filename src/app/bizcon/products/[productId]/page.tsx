'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams } from 'next/navigation';
import { getProductById, getStoreMeta } from '@/lib/db';
import { CirclePlus, ShoppingCart, Clock, Check } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useOrders } from '@/hooks/useOrders';
import { useCustomer } from '@/context/CustomerContext';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { calculateDiscount, formatPrice } from '@/utils/price';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import { ViewHistoryCache } from '@/lib/viewHistoryCache';
import { ProductDetailCache } from '@/lib/productDetailCache';
import Navbar from '@/components/layout/navbar';

// Dynamic imports
const ProductDetailSkeleton = dynamic(() => import('@/components/ProductDetailSkeleton'), {
  ssr: false
});

const AnimatedViewCount = dynamic(() => import('@/components/AnimatedViewCount'), {
  ssr: false,
  loading: () => <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
});

export default function ProductDetail({ params }: { params: { productId: string } }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const { state, dispatch } = useCart();
  const searchParams = useSearchParams();
  const { customer } = useCustomer();

  const storeId = useMemo(() => searchParams ? searchParams.get('storeId') : null, [searchParams]);
  const { addOrder } = useOrders(customer?.id || null, storeId || ''); // Pass storeId in global context
  const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(null);

  const [imageLoading, setImageLoading] = useState(true);

  const discount = product ? calculateDiscount(product.price, product.originalPrice) : null;

  const { productId } = params;

  useEffect(() => {
    let isMounted = true;
    async function fetchProduct() {
      try {
        if (!productId) {
          setProduct(null);
          setIsLoading(false);
          console.error('Missing productId in product detail page');
          return;
        }
        let fetchedProduct: Product | undefined = ProductDetailCache.get(productId);
        if (!fetchedProduct) {
          fetchedProduct = (await getProductById(null, productId)) || undefined;
        }
        if (!isMounted) return;
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          ViewHistoryCache.add(fetchedProduct);
        }
      } catch (error) {
        console.error('[PROD] Error in product detail:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProduct();
    return () => { isMounted = false; };
  }, [productId]);

  useEffect(() => {
    async function fetchMeta() {
      if (storeId) {
        const meta = await getStoreMeta(storeId);
        setStoreMeta(meta as StoreMeta | null);
      }
    }
    fetchMeta();
  }, [storeId]);

  useEffect(() => {
    if (product) {
      const productInCart = state.items.find(item => item.id === product.id);
      setIsInCart(!!productInCart);
    }
  }, [product, state.items]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return <div className="p-4">Product not found</div>;
  }

  const handleOrderNow = async () => {
    if (!product?.storeId || !storeMeta || !storeMeta.whatsapp || !customer) return;

    addOrder([product], storeMeta, customer, null, false);

    const message =
      `🛍️ *New Order Request*\n\n` +
      `Hello! I would like to order this item:\n\n` +
      `*${product.name}*\n` +
      `• Price: ${formatPrice(product.price)}\n` +
      `• Product Link: ${window.location.href}\n\n` +
      `Thank you! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}?text=${encodedMessage}`;
    window.open(whatsappLink, '_blank');
  };

  const handleAddToCart = () => {
    if (!product) return;

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

  const canOrder = product && !('soldOut' in product && product.soldOut) && storeMeta && storeMeta.whatsapp;

  return (
    <>
      <Navbar storeName={storeMeta?.name || 'Compass 🧭 Marketplace'} />
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
              {product.images && product.images.length > 0 ? (
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
                  onLoad={() => setImageLoading(false)}
                />
              ) : (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No Image Available</span>
                </div>
              )}
            </div>
            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
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
                    tabIndex={0}>
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
          {/* Product Info */}
          <div className="mt-1 lg:mt-0 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="flex flex-wrap gap-1.5">
                <AnimatedViewCount value={product?.views || 0} duration={2.5} className="text-base font-semibold text-slate-700 dark:text-slate-200" />
              </div>
            </div>

            {product && 'soldOut' in product && product.soldOut ? (
              <div className="mt-2 bg-[var(--card-background)] border border-[var(--border-color)] rounded-2xl p-6 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--badge-blue-bg)]">
                  <Clock className="w-6 h-6 text-[var(--badge-blue-text)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  Currently Unavailable
                </h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  This item is temporarily out of stock. Please check back later.
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold card-text-gradient mb-4">
                  {product?.name}
                </h1>
                <div className="flex items-center gap-3 mb-6">
                  <p className="text-2xl font-semibold card-text-gradient">
                    {formatPrice(product.price)}
                  </p>
                  {product?.originalPrice && product.originalPrice > product.price && (
                    <>
                      <p className="text-lg text-text-secondary line-through">
                        {formatPrice(product.originalPrice)}
                      </p>
                      {discount && (
                        <span className="px-2 py-1 rounded-full text-sm font-medium bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]">
                          {discount}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>

                {product && 'features' in product && product.features && (
                  <div className="mb-8">
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

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleOrderNow}
                    disabled={!canOrder}
                    className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[980px] bg-[var(--button-success)] text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:bg-[var(--button-success-hover)] transform-gpu active:scale-[0.98] cursor-default disabled:opacity-75 disabled:cursor-not-allowed product-detail-button-success min-h-[48px] text-base"
                    style={{ minHeight: '48px', fontSize: '1rem' }}
                    tabIndex={0}
                    aria-label="Order Now">
                    <ShoppingCart className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                    <span className="relative tracking-[-0.01em]">Order Now</span>
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
                    aria-label={isAdding || isInCart ? 'Added To Cart' : 'Add To Cart'}>
                    {isInCart
                      ? <Check className="w-5 h-5 transition-transform opacity-80" />
                      : <CirclePlus className={`w-5 h-5 transition-transform ${isAdding ? 'opacity-60' : 'group-hover:-translate-y-0.5'}`} />
                    }
                    <span>
                      {isInCart ? 'Added To Cart' : 'Add To Cart'}
                    </span>
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
