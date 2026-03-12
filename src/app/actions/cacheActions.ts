'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidates the cache for a specific store's admin dashboard.
 * Designed to be called asynchronously (e.g. on the first user tap of the store name)
 * to hide network latency before they explicitly navigate to the admin area.
 */
export async function refreshAdminCache(storeId: string) {
    if (!storeId) return { success: false, error: 'Store ID is required' };

    try {
        revalidatePath(`/admin/${storeId}`);
        return { success: true };
    } catch (error) {
        console.error('Error refreshing admin cache:', error);
        return { success: false, error: 'Failed to refresh cache' };
    }
}
