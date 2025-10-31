// src/lib/navigationStore.ts
export type NavigationState = {
    category: string;
    scrollPosition: number;
  }
  
  class NavigationStore {
    private static state: NavigationState = {
      category: '',
      scrollPosition: 0
    };
  
    static saveState(category: string, scrollPosition: number) {
      this.state = { category, scrollPosition };
    }
  
    static getState(): NavigationState {
      return this.state;
    }
  
    static clearState() {
      this.state = { category: '', scrollPosition: 0 };
    }
  }
  
  export default NavigationStore;