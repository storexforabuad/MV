'use client';
import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import {
  getProducts,
  getProductsByCategory,
  getCategories,
  getStoreMeta,
  getStorePopularProducts, 
}
from '../../lib/db';
import { useConnectionCheck } from '../../hooks/useConnectionCheck';
import Navbar from '../../components/layout/navbar';
import CategoryBar from '../../components/layout/CategoryBar';
import SkeletonLoader from '../../components/SkeletonLoader';
import type { Product } from '../../types/product';
import ConnectionErrorToast from '../../components/ConnectionErrorToast';
import { CategoryCache } from '../../lib/categoryCache';
import { ProductListCache } from '../../lib/productCache';

const ProductGrid = dynamic(
  () => import('../../components/products/ProductGrid'),
  { ssr: false }
);

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

export default function StorefrontPage() {
  const params = useParams();
  const storeId = typeof params?.storeId === 'string' ? params.storeId : Array.isArray(params?.storeId) ? params.storeId[0] : '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState('promo');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const { isConnectionError, setIsConnectionError } = useConnectionCheck();
  const observerRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const fetchProducts = useCallback(async (categoryId: string, pageNum = 1, lastDoc: any = null) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const cacheKey = `store_${storeId}_products_${categoryId || 'all'}_page${pageNum}`;
      let fetchedProducts;
      const cached = ProductListCache.get(cacheKey);

      if (cached && Array.isArray(cached) && pageNum === 1) {
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
            fetchedProducts = await getProducts(storeId); // Already sorted by createdAt desc by default
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
      
      if(fetchedProducts) {
        setProducts(prev => pageNum === 1 ? fetchedProducts : [...prev, ...fetchedProducts]);
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

  const handleCategorySelect = useCallback((categoryId: string) => {
    startTransition(() => {
      setActiveCategoryId(categoryId);
      setLastVisible(null);
      setHasMore(true);
      fetchProducts(categoryId, 1, null);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  useEffect(() => {
    if (!storeId) return;
    const fetchInitialData = async () => {
      try {
        const meta = await getStoreMeta(storeId);
        setStoreName(meta?.name || storeId);

        const cats = await getCategories(storeId);
        setCategories(cats);

        // Fetch initial products for the default category
        fetchProducts(activeCategoryId, 1, null);

      } catch (error) {
        console.error("Error fetching initial store data:", error);
        setIsConnectionError(true);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [storeId, activeCategoryId, fetchProducts, setIsConnectionError]);

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
      <Navbar storeName={storeName} />
      <div className="pt-16 pb-safe-area-inset-bottom">
        <CategoryBar 
          onCategorySelect={handleCategorySelect}
          activeCategoryId={activeCategoryId}
          categories={categories}
          onActiveCategoryClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />
        <div className="mt-3 sm:mt-4">
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
                storeId={storeId} // Pass storeId here
              />
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
