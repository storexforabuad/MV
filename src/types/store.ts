import { Timestamp } from 'firebase/firestore';

export interface StoreMeta {
  id: string;
  name: string;
  logo: string;
  category: string[];
  followers: number;
  views: number;
  createdAt: Timestamp;
  owner: string;
  products: string[];
  totalOrders?: number;
  promoCaption?: string;
  hasCompletedOnboarding?: boolean;
  description?: string;

  // Business contact and details
  whatsapp: string;
  businessDescription?: string;
  businessInstagram?: string;
  ceoName?: string;
  ceoImage?: string;
  ceoEmail?: string;
  ceoPhone?: string;
  ceoInstagram?: string;

  // Physical address details
  hasPhysicalShop?: boolean;
  shopNumber?: string;
  plazaBuildingName?: string;
  streetAddress?: string;
  state?: string;
  country?: string;

  // Store Vertical
  storeType?: 'general' | 'automotive' | 'livestock' | 'fashion' | 'restaurant' | 'sports' | 'sports-rental' | 'pitchperfect' | 'pitch';

  // Timezone & payout tracking
  timezone?: string;
  lastPaidAt?: Timestamp;

  // Restaurant specific
  isOpen?: boolean;
  openingHours?: string;

  // Payout account details
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;

  // Subscription Management
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  subscriptionPlanCode?: string;     // Paystack plan code
import { Timestamp } from 'firebase/firestore';

export interface StoreMeta {
  id: string;
  name: string;
  logo: string;
  category: string[];
  followers: number;
  views: number;
  createdAt: Timestamp;
  owner: string;
  products: string[];
  totalOrders?: number;
  promoCaption?: string;
  hasCompletedOnboarding?: boolean;
  description?: string;

  // Business contact and details
  whatsapp: string;
  businessDescription?: string;
  businessInstagram?: string;
  ceoName?: string;
  ceoImage?: string;
  ceoEmail?: string;
  ceoPhone?: string;
  ceoInstagram?: string;

  // Physical address details
  hasPhysicalShop?: boolean;
  shopNumber?: string;
  plazaBuildingName?: string;
  streetAddress?: string;
  state?: string;
  country?: string;

  // Store Vertical
  storeType?: 'general' | 'automotive' | 'livestock' | 'fashion' | 'restaurant' | 'sports' | 'sports-rental' | 'pitchperfect' | 'pitch';

  // Timezone & payout tracking
  timezone?: string;
  lastPaidAt?: Timestamp;

  // Restaurant specific
  isOpen?: boolean;
  openingHours?: string;

  // Payout account details
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;

  // Subscription Management
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  subscriptionPlanCode?: string;     // Paystack plan code
  subscriptionCode?: string;         // Paystack subscription code
  paystackCustomerCode?: string;     // Paystack customer code for recurring billing
  subscriptionStartDate?: Timestamp;
  subscriptionNextBillingDate?: Timestamp;
  subscriptionCancelledAt?: Timestamp;
  subscriptionTrialEndsAt?: Timestamp;
  // Admin Notifications
  adminTokens?: string[];
  subscriptionEmailToken?: string;   // Secure token for email management links
}

export interface ProductCategory {
  id: string;
  name: string;
}
