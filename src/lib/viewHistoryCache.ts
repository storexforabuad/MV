import { Product } from '../types/product';

const CACHE_KEY = 'hafcys-view-history';
const MAX_HISTORY = 20; // Maximum number of items to keep in history

interface ViewedProduct {
  id: string;
  timestamp: number;
  data?: Product; // Optional full product data
}

export const ViewHistoryCache = {
  add(product: Product) {
    try {
      const history: ViewedProduct[] = JSON.parse(
        localStorage.getItem(CACHE_KEY) || '[]'
      );
      
      // Add new product at the start, remove any existing entry
      const newHistory = [
        { 
          id: product.id, 
          timestamp: Date.now(),
          data: product 
        },
        ...history.filter(item => item.id !== product.id)
      ].slice(0, MAX_HISTORY); // Keep only MAX_HISTORY items
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error adding to view history:', error);
    }
  },

  get(): ViewedProduct[] {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  clear() {
    localStorage.removeItem(CACHE_KEY);
  }
};
