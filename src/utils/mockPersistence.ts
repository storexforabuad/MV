'use client';

/**
 * Utility to persist mock data state (hidden IDs) in localStorage.
 * This ensures that a "deleted" mock item stays hidden without affecting the shared Firestore database.
 */

const HIDDEN_MOCKS_KEY = (storeId: string) => `mv_hidden_mocks_${storeId}`;

export const getHiddenMockIds = (storeId: string): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(HIDDEN_MOCKS_KEY(storeId));
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error reading hidden mocks from localStorage', e);
        return [];
    }
};

export const hideMockId = (storeId: string, id: string): void => {
    if (typeof window === 'undefined') return;
    try {
        const current = getHiddenMockIds(storeId);
        if (!current.includes(id)) {
            const next = [...current, id];
            localStorage.setItem(HIDDEN_MOCKS_KEY(storeId), JSON.stringify(next));
        }
    } catch (e) {
        console.error('Error saving hidden mock to localStorage', e);
    }
};

export const clearHiddenMocks = (storeId: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(HIDDEN_MOCKS_KEY(storeId));
};
