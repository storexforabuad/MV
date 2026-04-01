import { Product } from '../types/product';

const CACHE_KEY = 'hafcys-products';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CachedData {
  products: Product[];
  timestamp: number;
  category?: string;
}

export const ProductCache = {
  save(products: Product[], category?: string) {
    const data: CachedData = {
      products,
      timestamp: Date.now(),
      category
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  },

  get(): CachedData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const isExpired = Date.now() - data.timestamp > CACHE_DURATION;
      
      return isExpired ? null : data;
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(CACHE_KEY);
  }
};

// API cache for product lists
export const ProductListCache = {
  get(key: string) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      const data = JSON.parse(cached);
      // 1 hour expiry
      if (Date.now() - data.timestamp > 1000 * 60 * 60) return null;
      return data.products;
    } catch {
      return null;
    }
  },
  set(key: string, products: Product[]) {
    localStorage.setItem(key, JSON.stringify({ products, timestamp: Date.now() }));
  },
  clear(key: string) {
    localStorage.removeItem(key);
  }
};
