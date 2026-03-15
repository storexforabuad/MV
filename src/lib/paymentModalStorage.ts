/**
 * localStorage management utilities for payment flow modal state persistence.
 * Allows users to minimize the app during payment, then return to complete the flow.
 * All modal states are automatically cleared after 10 minutes of expiry.
 */

export interface ModalState {
  storeId: string;
  currentPage: 1 | 2 | 3;
  evidenceUrl?: string;
  fileName?: string;
  expiryTime: number; // Milliseconds since epoch
}

const MODAL_STATE_EXPIRY_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Saves the current payment modal state to localStorage.
 * State includes current page, uploaded evidence URL, and expiry time.
 * 
 * @param storeId - The ID of the store
 * @param currentPage - Current page (1 or 2) in the modal flow
 * @param evidenceUrl - Optional Cloudinary URL of uploaded payment evidence
 * @param fileName - Optional original filename of the uploaded evidence
 */
export function saveModalState(
  storeId: string,
  currentPage: 1 | 2 | 3,
  evidenceUrl?: string,
  fileName?: string
): void {
  if (typeof window === 'undefined') return; // SSR safety

  const state: ModalState = {
    storeId,
    currentPage,
    evidenceUrl,
    fileName,
    expiryTime: Date.now() + MODAL_STATE_EXPIRY_DURATION,
  };

  try {
    const key = `restaurant_order_modal_state_${storeId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save modal state to localStorage:', error);
  }
}

/**
 * Retrieves the payment modal state from localStorage if it exists and hasn't expired.
 * Returns null if state is missing or expired.
 * 
 * @param storeId - The ID of the store
 * @returns ModalState if valid and not expired, null otherwise
 */
export function getModalState(storeId: string): ModalState | null {
  if (typeof window === 'undefined') return null; // SSR safety

  try {
    const key = `restaurant_order_modal_state_${storeId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const state: ModalState = JSON.parse(stored);

    // Check if state has expired
    if (isModalStateExpired(state)) {
      clearModalState(storeId);
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to retrieve modal state from localStorage:', error);
    return null;
  }
}

/**
 * Checks if a modal state has expired based on the stored expiry time.
 * 
 * @param state - The modal state to check
 * @returns true if state has expired, false otherwise
 */
export function isModalStateExpired(state: ModalState): boolean {
  return Date.now() > state.expiryTime;
}

/**
 * Clears the payment modal state from localStorage for a given store.
 * Called when modal is manually closed, order is placed successfully, or state expires.
 * 
 * @param storeId - The ID of the store
 */
export function clearModalState(storeId: string): void {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const key = `restaurant_order_modal_state_${storeId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear modal state from localStorage:', error);
  }
}

/**
 * Clears all payment modal states from localStorage.
 * Useful for app logout or privacy cleanup.
 */
export function clearAllModalStates(): void {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('restaurant_order_modal_state_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear all modal states from localStorage:', error);
  }
}
