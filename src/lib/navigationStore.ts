// src/lib/navigationStore.ts
export type NavigationState = {
  category: string;
  scrollPosition: number;
}

class NavigationStore {
  private static STORAGE_KEY = 'storefront_nav_state';

  static saveState(category: string, scrollPosition: number) {
    if (typeof window === 'undefined' || !category) return;
    const state = { category, scrollPosition };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  static getState(): NavigationState {
    if (typeof window === 'undefined') return { category: '', scrollPosition: 0 };
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { category: '', scrollPosition: 0 };
      }
    }
    return { category: '', scrollPosition: 0 };
  }

  static clearState() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}

export default NavigationStore;