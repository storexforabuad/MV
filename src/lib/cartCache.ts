import { CartItem } from './cartContext';

const CACHE_KEY = 'hafcys-cart';

export const CartCache = {
  save(items: CartItem[]) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  },

  get(): CartItem[] {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return [];

      const data = JSON.parse(cached);
      return data;
    } catch {
      return [];
    }
  },

  clear() {
    localStorage.removeItem(CACHE_KEY);
  }
};
