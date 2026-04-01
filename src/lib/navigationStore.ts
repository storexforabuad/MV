// src/lib/navigationStore.ts
export type NavigationState = {
  activeCategory: string;
  categoryScrolls: Record<string, number>;
}

class NavigationStore {
  private static STORAGE_KEY = 'storefront_nav_state';

  private static getStoredState(): NavigationState {
    if (typeof window === 'undefined') return { activeCategory: '', categoryScrolls: {} };
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { activeCategory: '', categoryScrolls: {} };
      }
    }
    return { activeCategory: '', categoryScrolls: {} };
  }

  static saveActiveCategory(category: string) {
    if (typeof window === 'undefined') return;
    const state = this.getStoredState();
    state.activeCategory = category;
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  static saveScrollPosition(category: string, scrollPosition: number) {
    if (typeof window === 'undefined' || !category) return;
    const state = this.getStoredState();
    state.categoryScrolls[category] = scrollPosition;
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  static getScrollPosition(category: string): number {
    const state = this.getStoredState();
    return state.categoryScrolls[category] || 0;
  }

  static getActiveCategory(): string {
    return this.getStoredState().activeCategory;
  }

  static clearState() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  // Legacy support for older code if any exists
  static saveState(category: string, scrollPosition: number) {
    this.saveActiveCategory(category);
    this.saveScrollPosition(category, scrollPosition);
  }

  static getState(): { category: string; scrollPosition: number } {
    const active = this.getActiveCategory();
    return {
      category: active,
      scrollPosition: this.getScrollPosition(active)
    };
  }
}

export default NavigationStore;
