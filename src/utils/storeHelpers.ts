/**
 * Store helper utilities for determining payment flow and state management.
 * Designed to be expandable for multiple store types.
 */

/**
 * Determines if a store type should use the new payment flow (two-page modal with payment evidence upload).
 * Currently only 'fashion' and 'restaurant' use this flow, but only if they don't have a subscription.
 * Subscription stores always use WhatsApp preview checkout instead.
 * 
 * @param storeType - The type of store ('restaurant', 'fashion', 'livestock', etc.)
 * @param subscriptionStatus - The subscription status of the store (trial, active, past_due, cancelled, expired, or undefined)
 * @returns true if the store should use the payment flow, false otherwise
 */
export function shouldUsePaymentFlow(storeType: string | undefined, subscriptionStatus: string | undefined): boolean {
  // Media Influencer ALWAYS uses payment flow (escrow protection)
  if (storeType === 'media-influencer') {
    return true;
  }
  // Subscription stores (other types) use WhatsApp checkout
  if (subscriptionStatus) {
    return false;
  }
  // Only non-subscription fashion and restaurant stores use payment flow
  return storeType === 'fashion' || storeType === 'restaurant';
}

/**
 * Determines if a store type should show the WhatsApp message preview page.
 * 
 * @param storeType - The type of store
 * @returns true if the store should show the preview
 */
export function shouldShowWhatsAppPreview(storeType: string | undefined): boolean {
  return true;
}

/**
 * @param storeId - The ID of the store
 * @returns localStorage key string
 */
export function getPaymentModalStateKey(storeId: string): string {
  return `restaurant_order_modal_state_${storeId}`;
}
