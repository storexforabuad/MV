
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
  totalViews?: number; // Added totalViews to match what's in Firestore
  storePageViews?: number;
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
  storeType?: 'general' | 'restaurant' | 'fashion' | 'livestock' | 'automotive' | 'electronics' | 'real-estate' | 'artist' | 'beauty' | 'home-services' | 'digital-products' | 'sports' | 'sports-rental' | 'pitchperfect' | 'pitch';

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
  bankCode?: string;
  paystackSubaccountCode?: string;

  // Subscription Management
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  subscriptionTier?: 'basic' | 'pro' | 'promax' | 'general';
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

  // Wholesale B2B Features
  isWholesaleVendor?: boolean;       // Opt-in to wholesale feature
  wholesaleConfig?: {
    isVisible: boolean;               // Show in other vendors' discovery lists
    globalDiscount: number;           // Default % for all products (0-100)
    minOrderValue: number;            // Min order total in ₦
    defaultPaymentTermsDays: 0 | 7 | 14 | 30;  // Default net terms
  };
  wholesaleStats?: {
    activePartners: number;
    monthlyWholesaleRevenue: number;
    totalWholesaleOrders: number;
    lastInvoiceDate?: Timestamp;
    pendingSettlements: number;
  };
  adminPin?: string; // 4-digit PIN for admin access
  isInfluencer?: boolean;     // Flag for influencer accounts
  isFreePlan?: boolean;       // Flag for free forever accounts (no billing)
}

export interface ProductCategory {
  id: string;
  name: string;
}
