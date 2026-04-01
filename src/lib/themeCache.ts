type Theme = 'light' | 'dark' | 'system';

interface CachedTheme {
  theme: Theme;
  timestamp: number;
}

const CACHE_KEY = 'hafcys-theme';

export const ThemeCache = {
  save(theme: Theme) {
    try {
      const data: CachedTheme = {
        theme,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  get(): Theme | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data: CachedTheme = JSON.parse(cached);
      return data.theme;
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(CACHE_KEY);
  }
};
