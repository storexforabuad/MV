import { useEffect } from 'react';
import { getProductById } from '../lib/db';
import { ProductDetailCache } from '../lib/productDetailCache';

export function useProductDetailPrefetch(storeId: string | null | undefined, productId: string, shouldPrefetch: boolean) {
  useEffect(() => {
    if (!storeId || !productId || !shouldPrefetch || ProductDetailCache.get(productId)) return;
    getProductById(storeId, productId).then(product => {
      if (product) ProductDetailCache.set(productId, product);
    });
  }, [storeId, productId, shouldPrefetch]);
}
