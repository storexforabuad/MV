'use client';
import { useState, useEffect, useCallback, useRef, useTransition, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  getProducts,
  getProductsByCategory,
  getCategories,
  getStoreMeta,
  getStorePopularProducts,
  incrementStorePageViews,
}
  from '@/lib/db';
import { useConnectionCheck } from '@/hooks/useConnectionCheck';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import Navbar from '@/components/layout/navbar';
import CategoryBar from '@/components/layout/CategoryBar';
import SkeletonLoader from '@/components/SkeletonLoader';
import type { Product } from '@/types/product';
import ConnectionErrorToast from '@/components/ConnectionErrorToast';
import { ProductListCache } from '@/lib/productCache';
import NeedAWebsiteBanner from '@/components/customer/NeedAWebsiteBanner';
import CustomerLookupModal from '@/components/customer/CustomerLookupModal';
import NavigationStore, { NavigationState } from '@/lib/navigationStore';
import { requestCustomerNotificationPermission } from '@/lib/requestCustomerNotifications';
import { useCustomer } from '@/context/CustomerContext';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import toast from 'react-hot-toast';
import HeroCarousel from '@/components/customer/HeroCarousel';

const ProductGrid = dynamic(
  () => import('../../components/products/ProductGrid'),
  { ssr: false }
);

const BusinessCardModal = dynamic(() => import('../../components/products/BusinessCardModal').then(mod => mod.BusinessCardModal), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl bg-background flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Business Info...</p>
      </div>
    </div>
  )
});

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 px-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <SkeletonLoader key={`product-skeleton-${index}`} />
    ))}
  </div>
);

const LoadingGrid = () => (
  <div className="space-y-6">
    <ProductGridSkeleton />
  </div>
);

const PRODUCTS_PAGE_SIZE = 24;

export default function StorefrontPageClient({
  storeId,
  initialStoreMeta,
  initialCategories,
  initialProducts
}: {
  storeId: string;
  initialStoreMeta?: any;
  initialCategories?: { id: string; name: string }[];
  initialProducts?: Product[];
}) {
  const scrollDirection = useScrollDirection();
  const scrollRestoreState = useRef<NavigationState | null>(NavigationStore.getState());

  const restoredCategory = scrollRestoreState.current?.category;
  // If we are restoring a category that is NOT the default 'promo' (which initialProducts represents),
  // we should ignore initialProducts to prevent showing the wrong list and triggering premature scroll restoration.
  const isRestoringDifferentCategory = restoredCategory && restoredCategory !== 'promo';

  const [products, setProducts] = useState<Product[]>(
    isRestoringDifferentCategory ? [] : (initialProducts || [])
  );
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(initialCategories || []);
  const [storeName, setStoreName] = useState(initialStoreMeta?.name || '');
  const [loading, setLoading] = useState(false);

  // We are "initial loading" if we don't have products to show yet.
  // This happens if we didn't get initialProducts OR if we are restoring a different category.
  const [initialLoading, setInitialLoading] = useState(!initialProducts || !!isRestoringDifferentCategory);

  const [activeCategoryId, setActiveCategoryId] = useState(() => scrollRestoreState.current?.category || 'promo');
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { isConnectionError, setIsConnectionError } = useConnectionCheck();
  const observerRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [storeMeta, setStoreMeta] = useState<any | null>(initialStoreMeta || null);
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const { customer } = useCustomer();

  // Swipe gesture state
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isSwipeTransitioning, setIsSwipeTransitioning] = useState(false);

  // Track store page visit
  useEffect(() => {
    if (storeId) {
      incrementStorePageViews(storeId);
    }
  }, [storeId]);

  // Handle deep linking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('open') === 'orders') {
        const orderId = params.get('orderId');
        if (orderId) {
          setHighlightOrderId(orderId);
        }
        setIsOrdersModalOpen(true);
      }
    }
  }, []);

  const handleNotificationRequest = async () => {
    if (customer?.id) {
      return requestCustomerNotificationPermission(customer.id);
    }
    return { success: false, error: 'No customer ID' };
  };

  // Handle foreground notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);

          if (payload.notification) {
            toast.custom((t) => (
              <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
                onClick={() => {
                  if (payload.data?.orderId) {
                    setHighlightOrderId(payload.data.orderId);
                    setIsOrdersModalOpen(true);
                    toast.dismiss(t.id);
                  }
                }}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payload.notification?.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {payload.notification?.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ), { duration: 5000 });
          }
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up foreground message listener:', error);
      }
    }
  }, []);

  const fetchProducts = useCallback(async (categoryId: string, pageNum = 1, lastDoc: DocumentSnapshot | null = null) => {
    if (!storeId) return;
    setLoading(true);
    console.log(`[StorefrontPageClient] Fetching products for category: ${categoryId}, page: ${pageNum}`);
    try {
      const cacheKey = `store_${storeId}_products_${categoryId || 'all'}_page${pageNum}`;
      let fetchedProducts;
      const cached = ProductListCache.get(cacheKey);

      if (cached && Array.isArray(cached) && pageNum === 1) {
        console.log(`[StorefrontPageClient] Using cached products for ${categoryId}`);
        fetchedProducts = cached;
      } else {
        switch (categoryId) {
          case 'promo': {
            const promoProducts = await getProducts(storeId);
            fetchedProducts = promoProducts.filter(p => p.originalPrice && p.originalPrice > p.price);
            break;
          }
          case 'popular': {
            const { products: popularProducts, lastVisible: newLastVisible } = await getStorePopularProducts(storeId, lastDoc, PRODUCTS_PAGE_SIZE);
            fetchedProducts = popularProducts;
            setLastVisible(newLastVisible);
            break;
          }
          case 'new-arrivals': {
            fetchedProducts = await getProducts(storeId);
            break;
          }
          default: {
            fetchedProducts = await getProductsByCategory(storeId, categoryId);
            break;
          }
        }
        if (pageNum === 1) {
          ProductListCache.set(cacheKey, fetchedProducts);
        }
      }

      if (fetchedProducts) {
        setProducts(prev => {
          const newProducts = pageNum === 1 ? fetchedProducts : [...prev, ...fetchedProducts];
          // Deduplicate by ID
          const uniqueProducts = Array.from(new Map(newProducts.map(p => [p.id, p])).values());
          return uniqueProducts;
        });
        setHasMore(fetchedProducts.length === PRODUCTS_PAGE_SIZE);
      }

    } catch (error) {
      console.error(`Error fetching products for store ${storeId}, category ${categoryId}:`, error);
      setIsConnectionError(true);
    } finally {
      setLoading(false);
      if (pageNum === 1) setInitialLoading(false);
    }
  }, [storeId, setIsConnectionError]);

  // Get all categories including special ones
  const getAllCategories = useCallback(() => {
    return [
      { id: 'promo', name: 'Promo' },
      { id: 'popular', name: 'Popular' },
      { id: 'new-arrivals', name: 'New Arrivals' },
      ...categories
    ];
  }, [categories]);

  // Get next category (circular)
  const getNextCategory = useCallback(() => {
    const allCategories = getAllCategories();
    // Use robust matching (string conversion + trim)
    const currentIndex = allCategories.findIndex(c => String(c.id).trim() === String(activeCategoryId).trim());

    // If not found (shouldn't happen if activeCategoryId is valid), default to first category
    if (currentIndex === -1) {
      return allCategories[0].id;
    }

    const nextIndex = (currentIndex + 1) % allCategories.length;
    return allCategories[nextIndex].id;
  }, [getAllCategories, activeCategoryId]);

  // Get previous category (circular)
  const getPreviousCategory = useCallback(() => {
    const allCategories = getAllCategories();
    // Use robust matching (string conversion + trim)
    const currentIndex = allCategories.findIndex(c => String(c.id).trim() === String(activeCategoryId).trim());

    // If not found, default to last category
    if (currentIndex === -1) {
      return allCategories[allCategories.length - 1].id;
    }

    const prevIndex = (currentIndex - 1 + allCategories.length) % allCategories.length;
    return allCategories[prevIndex].id;
  }, [getAllCategories, activeCategoryId]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    console.log(`[StorefrontPageClient] Category selected: ${categoryId}`);
    scrollRestoreState.current = null;
    NavigationStore.clearState();

    // Clear products immediately and set loading to true to show skeletons
    setProducts([]);
    setLoading(true);
    setActiveCategoryId(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle swipe gesture
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (isSwipeTransitioning || loading) return; // Prevent rapid swipes and swipes during loading

    setIsSwipeTransitioning(true);
    setSwipeDirection(direction);

    const newCategoryId = direction === 'left' ? getNextCategory() : getPreviousCategory();
    handleCategorySelect(newCategoryId);

    // Reset after animation
    setTimeout(() => {
      setSwipeDirection(null);
      setIsSwipeTransitioning(false);
    }, 300);
  }, [isSwipeTransitioning, loading, getNextCategory, getPreviousCategory, handleCategorySelect]);

  useEffect(() => {
    if (!storeId) return;

    const fetchInitialAndCategoryData = async () => {
      // Only fetch meta/categories if we don't have them yet
      if (!storeMeta) {
        const meta = await getStoreMeta(storeId);
        setStoreName(meta?.name || storeId);
        setStoreMeta(meta);
      }

      if (categories.length === 0) {
        const cats = await getCategories(storeId);
        setCategories(cats);
      }

      // Always fetch products for the active category.
      // If we initialized with initialProducts and activeCategoryId is 'promo', 
      // fetchProducts will still run but we can optimize it or let it refresh.
      // For now, let's let it refresh to ensure client-side consistency, 
      // but we could skip if products.length > 0 && activeCategoryId === 'promo'.
      await fetchProducts(activeCategoryId, 1, null);
    };

    fetchInitialAndCategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, activeCategoryId]);

  useLayoutEffect(() => {
    if (scrollRestoreState.current?.scrollPosition && products.length > 0) {
      const { scrollPosition } = scrollRestoreState.current;
      window.scrollTo(0, scrollPosition);
      scrollRestoreState.current = null;
      NavigationStore.clearState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const fetchMoreProducts = useCallback(() => {
    if (!loading && hasMore) {
      fetchProducts(activeCategoryId, products.length / PRODUCTS_PAGE_SIZE + 1, lastVisible);
    }
  }, [loading, hasMore, activeCategoryId, products.length, lastVisible, fetchProducts]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchMoreProducts();
      }
    }, { threshold: 1.0 });

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [hasMore, loading, fetchMoreProducts]);

  return (
    <div className="min-h-screen bg-background overscroll-none">
      <Navbar
        storeId={storeId}
        storeName={storeName}
        scrollDirection={scrollDirection}
      />
      <CategoryBar
        onCategorySelect={handleCategorySelect}
        activeCategoryId={activeCategoryId}
        categories={categories}
        onActiveCategoryClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        scrollDirection={scrollDirection}
        storeType={storeMeta?.storeType}
      />
      <CustomerLookupModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setIsLoginModalOpen(false)}
      />
      <div className="pt-52 pb-safe-area-inset-bottom">
        <div className="mt-2">
          <HeroCarousel storeMeta={storeMeta} />
        </div>
        <NeedAWebsiteBanner
          storeId={storeId}
        />

        {/* Store Closed Banner */}
        {storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false && (
          <div className="mx-4 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 dark:text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Store is Currently Closed</h3>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                {storeMeta.openingHours
                  ? `Opens ${storeMeta.openingHours.open} - ${storeMeta.openingHours.close}`
                  : 'You can browse the menu, but ordering is disabled.'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 sm:mt-4 px-2 sm:px-4 md:px-6 lg:px-8">
          {initialLoading || isPending ? (
            <LoadingGrid />
          ) : (
            <>
              {isConnectionError && (
                <ConnectionErrorToast onRetry={() => fetchProducts(activeCategoryId, 1, null)} />
              )}
              <ProductGrid
                products={products}
                containerRef={productGridRef}
                storeId={storeId}
                activeCategoryId={activeCategoryId}
                onAboutClick={() => setAboutOpen(true)}
                storeMeta={storeMeta}
                isOrdersModalOpen={isOrdersModalOpen}
                setOrdersModalOpen={setIsOrdersModalOpen}
                highlightOrderId={highlightOrderId}
                onNotificationRequest={handleNotificationRequest}
                onSwipeLeft={() => handleSwipe('left')}
                onSwipeRight={() => handleSwipe('right')}
                swipeDirection={swipeDirection}
                isSwipeTransitioning={isSwipeTransitioning}
                isLoading={loading}
              />
              {storeId && <BusinessCardModal open={aboutOpen} onClose={() => setAboutOpen(false)} storeMeta={storeMeta || undefined} />}
              {hasMore && (
                <div ref={observerRef} className="h-8 flex items-center justify-center">
                  {loading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
