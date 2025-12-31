/**
 * Store helper utilities for determining payment flow and state management.
 * Designed to be expandable for multiple store types.
 */

/**
 * Determines if a store type should use the new payment flow (two-page modal with payment evidence upload).
 * Currently only 'restaurant' uses this flow, but can be expanded to other store types.
 * 
 * @param storeType - The type of store ('restaurant', 'clothing', 'livestock', etc.)
 * @returns true if the store should use the payment flow, false otherwise
 */
export function shouldUsePaymentFlow(storeType: string | undefined): boolean {
  if (!storeType) return false;
  
  // Store types that use the new payment flow
  const paymentFlowStoreTypes = ['restaurant'];
  
  return paymentFlowStoreTypes.includes(storeType);
}

/**
 * Generates a unique localStorage key for storing modal state by store ID.
 * Used to persist modal state (current page, uploaded evidence) across app minimization.
 * 
 * @param storeId - The ID of the store
 * @returns localStorage key string
 */
export function getPaymentModalStateKey(storeId: string): string {
  return `restaurant_order_modal_state_${storeId}`;
}
