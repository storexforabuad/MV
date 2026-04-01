import { Category } from '../types/category';

const CACHE_KEY = 'hafcys-categories';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CachedData {
  categories: Category[];
  timestamp: number;
}

export const CategoryCache = {
  save(categories: Category[]) {
    const data: CachedData = {
      categories,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  },

  get(): Category[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const isExpired = Date.now() - data.timestamp > CACHE_DURATION;
      
      return isExpired ? null : data.categories;
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(CACHE_KEY);
  }
};
