import { Timestamp } from 'firebase/firestore';

/**
 * Wholesale Request - Sent between vendors to establish wholesale relationships
 */
export interface WholesaleRequest {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  message?: string;
  createdAt: Timestamp;
  respondedAt?: Timestamp;
  blockedUntil?: Timestamp; // 30 days from block date
  direction: 'incoming' | 'outgoing'; // For filtering in UI
}

/**
 * Wholesale Partner - Represents an established wholesale relationship
 */
export interface WholesalePartner {
  id: string;
  partnerId: string; // The partner's storeId
  partnerStoreName: string;
  status: 'active' | 'paused';
  connectedAt: Timestamp;
  totalOrders: number;
  totalRevenue: number; // Gross amount (before platform fee)
  lastOrderDate?: Timestamp;
  customAgreedDiscount?: number; // If different from global discount
}

/**
 * Line item in a wholesale order
 */
export interface WholesaleOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // Price before discount
  discount: number; // Percentage (e.g., 30 for 30%)
  lineTotal: number; // quantity * unitPrice * (1 - discount/100)
}

/**
 * Wholesale Order - Bulk purchase between two vendors
 */
export interface WholesaleOrder {
  id: string;
  buyerStoreId: string;
  sellerStoreId: string;
  items: WholesaleOrderItem[];
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  paymentStatus: 'pending' | 'confirmed';
  subtotal: number; // Sum of all line totals (after discounts)
  platformFee: number; // 5% of subtotal
  total: number; // subtotal + platformFee
  paymentTermsDays: number; // 0 (immediate), 7, 14, or 30 days
  invoiceNumber?: string; // Assigned when invoice is generated
  paystackReference?: string; // Paystack transaction reference
  createdAt: Timestamp;
  paidAt?: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
  notes?: string;
}

/**
 * Line item in an aggregated invoice
 */
export interface WholesaleInvoiceLineItem {
  orderId: string;
  orderDate: Timestamp;
  items: string; // e.g., "Fashion items (5 units)"
  amount: number;
}

/**
 * Wholesale Invoice - Weekly aggregated invoice for a seller-buyer pair
 */
export interface WholesaleInvoice {
  id: string;
  invoiceNumber: string; // e.g., "WL-2026-001234"
  sellerStoreId: string;
  buyerStoreId: string;
  invoicePeriod: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  orders: WholesaleInvoiceLineItem[];
  subtotal: number; // Sum of all order totals
  platformFeeTotal: number; // 5% of subtotal
  total: number; // subtotal + platformFeeTotal (amount seller receives)
  paymentTermsDays: number; // From largest order's terms
  dueDate: Timestamp;
  status: 'pending' | 'settled' | 'overdue';
  settlementTransactionRef?: string; // Paystack transfer reference
  settledAt?: Timestamp;
  invoicePdfUrl?: string; // Cloud Storage URL
  createdAt: Timestamp;
  emailSentToSeller: boolean;
  emailSentToBuyer: boolean;
}

/**
 * Wholesale Configuration - Store-level settings
 */
export interface WholesaleConfig {
  isVisible: boolean; // Show in other vendors' discovery lists
  globalDiscount: number; // 0-100 percentage
  minOrderValue: number; // Minimum order total in ₦
  defaultPaymentTermsDays: number; // 0, 7, 14, or 30
}

/**
 * Wholesale Statistics - Tracked per store
 */
export interface WholesaleStats {
  activePartners: number;
  monthlyWholesaleRevenue: number;
  totalWholesaleOrders: number;
  lastInvoiceDate?: Timestamp;
  pendingSettlements: number; // Count of unsettled invoices
}

/**
 * Platform-level wholesale transaction log
 * Tracks all payments and settlements for audit trail and reporting
 */
export interface WholesaleTransaction {
  id: string;
  wholesaleOrderId: string;
  buyerStoreId: string;
  buyerStoreName: string;
  sellerStoreId: string;
  sellerStoreName: string;
  amountInKobo: number; // Total amount paid by buyer
  platformFeeInKobo: number; // 5% platform fee (retained by platform)
  vendorPayoutInKobo: number; // 95% vendor receives
  paymentTermsDays: number; // 0, 7, 14, or 30 days
  paystackTransactionRef: string; // Original charge reference
  paystackTransferCode?: string; // Transfer code/ID if immediate settlement
  status: 'pending_settlement' | 'settled' | 'settlement_failed'; // pending_settlement = awaiting invoice + Cloud Function settlement
  settlementError?: string; // Error message if settlement failed
  createdAt: Timestamp;
  settledAt?: Timestamp;
}

/**
 * Product wholesale pricing - Extension to product types
 */
export interface WholesalePricing {
  globalDiscount: number; // e.g., 30 for 30%
  tierPricing?: Array<{
    minQty: number;
    discount: number;
  }>;
  customPartnerDiscounts?: Record<string, number>; // partnerId -> discount %
}
