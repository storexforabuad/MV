/**
 * Utility for managing customer size preferences in localStorage.
 * Stores the last selected size for each product to provide a better UX on repeat orders.
 */

const STORAGE_KEY = 'mv_size_preferences';

export class SizePreferencesCache {
    /**
     * Get the previously selected size for a product
     */
    static get(productId: string): string | null {
        if (typeof window === 'undefined') return null;

        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return null;

            const preferences = JSON.parse(data);
            return preferences[productId] || null;
        } catch (error) {
            console.error('Error reading size preferences:', error);
            return null;
        }
    }

    /**
     * Save a size preference for a product
     */
    static set(productId: string, size: string): void {
        if (typeof window === 'undefined') return;

        try {
            const data = localStorage.getItem(STORAGE_KEY);
            const preferences = data ? JSON.parse(data) : {};

            preferences[productId] = size;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving size preference:', error);
        }
    }

    /**
     * Get all size preferences
     */
    static getAll(): Record<string, string> {
        if (typeof window === 'undefined') return {};

        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error reading size preferences:', error);
            return {};
        }
    }

    /**
     * Clear all size preferences
     */
    static clear(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing size preferences:', error);
        }
    }

    /**
     * Clear preference for a specific product
     */
    static remove(productId: string): void {
        if (typeof window === 'undefined') return;

        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return;

            const preferences = JSON.parse(data);
            delete preferences[productId];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error removing size preference:', error);
        }
    }
}
