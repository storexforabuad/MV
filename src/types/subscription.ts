import { Timestamp } from 'firebase/firestore';

// Subscription status types
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

// Subscription tier types
export type SubscriptionTier = 'basic' | 'pro' | 'promax' | 'general';

// Subscription data structure
export interface SubscriptionData {
    status: SubscriptionStatus;
    planCode: string;
    tier?: SubscriptionTier;
    subscriptionCode?: string;
    customerCode?: string;
    startDate: Date;
    nextBillingDate?: Date;
    trialEndsAt?: Date;
    cancelledAt?: Date;
}

// Paystack API response for subscription creation
export interface PaystackSubscriptionResponse {
    status: boolean;
    message: string;
    data: {
        customer: number;
        plan: number;
        integration: number;
        domain: string;
        start: number;
        status: string;
        quantity: number;
        amount: number;
        subscription_code: string;
        email_token: string;
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
            reusable: boolean;
            signature: string;
        };
        createdAt: string;
        updatedAt: string;
    };
}

// Paystack customer creation response
export interface PaystackCustomerResponse {
    status: boolean;
    message: string;
    data: {
        email: string;
        integration: number;
        domain: string;
        customer_code: string;
        id: number;
        identified: boolean;
        identifications: null;
        createdAt: string;
        updatedAt: string;
    };
}

// Paystack webhook event structure
export interface PaystackWebhookEvent {
    event: string;
    data: {
        id: number;
        domain: string;
        status: string;
        reference: string;
        amount: number;
        message: string | null;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        ip_address: string;
        metadata: {
            storeId?: string;
            [key: string]: any;
        };
        customer: {
            id: number;
            first_name: string | null;
            last_name: string | null;
            email: string;
            customer_code: string;
            phone: string | null;
            metadata: any;
            risk_action: string;
        };
        authorization?: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
            reusable: boolean;
            signature: string;
        };
        subscription?: {
            id: number;
            subscription_code: string;
            email_token: string;
            amount: number;
            cron_expression: string;
            next_payment_date: string;
            status: string;
        };
    };
}

// Subscription constants
export const SUBSCRIPTION_CONFIG = {
    ORIGINAL_MONTHLY_AMOUNT: 10000, // ₦10,000
    MONTHLY_AMOUNT: 5000, // ₦5,000 (General)
    MONTHLY_AMOUNT_KOBO: 500000, // 5000 * 100 kobo

    // Weekly Tiers
    BASIC_WEEKLY_AMOUNT: 500,
    PRO_WEEKLY_AMOUNT: 1000,
    PROMAX_WEEKLY_AMOUNT: 3500,

    DISCOUNT_PERCENTAGE: 50,
    TRIAL_DAYS: 14, // Maintained for General store
    GRACE_PERIOD_DAYS: 2,
    CURRENCY: 'NGN',
} as const;

export const TIER_DETAILS = {
    basic: {
        name: 'Lite',
        price: 500,
        period: 'week',
        description: 'Perfect for new and small vendors just starting their digital journey.',
        color: 'blue',
        gradient: 'from-blue-500/10 to-cyan-500/10',
        border: 'border-blue-400/30',
        cardBg: 'bg-slate-900/40 backdrop-blur-xl',
        textColor: 'text-white',
        iconColor: 'text-blue-400',
        buttonClass: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-400/30',
        image: '/images/subscriptions/basic_tier.png'
    },
    pro: {
        name: 'Pro',
        price: 1000,
        period: 'week',
        description: 'Ideal for growing businesses looking to scale and reach more customers.',
        color: 'indigo',
        gradient: 'from-indigo-500/20 to-purple-600/20',
        border: 'border-indigo-400/50',
        cardBg: 'bg-indigo-950/40 backdrop-blur-xl',
        textColor: 'text-white',
        iconColor: 'text-indigo-400',
        buttonClass: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 border border-indigo-400/30',
        image: '/images/subscriptions/pro_tier.png'
    },
    promax: {
        name: 'Max',
        price: 3500,
        period: 'week',
        description: 'The ultimate choice for wholesalers and big brands with high volume.',
        color: 'gold',
        gradient: 'from-amber-500/20 to-yellow-600/20',
        border: 'border-amber-500/50',
        cardBg: 'bg-black/60 backdrop-blur-xl',
        textColor: 'text-white',
        iconColor: 'text-amber-500',
        buttonClass: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-500/50',
        image: '/images/subscriptions/promax_tier.png'
    },
    general: {
        name: 'General',
        price: 5000,
        period: 'month',
        description: 'Full access with monthly billing and 14-day free trial.',
        color: 'emerald',
        gradient: 'from-emerald-500/20 to-teal-600/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        cardBg: 'bg-white dark:bg-slate-900',
        textColor: 'text-slate-900 dark:text-white',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    }
} as const;

// Helper to calculate trial end date
export function calculateTrialEndDate(startDate: Date = new Date()): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + SUBSCRIPTION_CONFIG.TRIAL_DAYS);
    return endDate;
}

// Helper to calculate grace period end date
export function calculateGracePeriodEndDate(failedPaymentDate: Date = new Date()): Date {
    const endDate = new Date(failedPaymentDate);
    endDate.setDate(endDate.getDate() + SUBSCRIPTION_CONFIG.GRACE_PERIOD_DAYS);
    return endDate;
}

// Helper to check if trial has expired
export function isTrialExpired(trialEndsAt: Timestamp | Date | null): boolean {
    if (!trialEndsAt) return false;
    const endDate = trialEndsAt instanceof Timestamp ? trialEndsAt.toDate() : trialEndsAt;
    return new Date() > endDate;
}

// Helper to format subscription status for display
export function getStatusDisplay(status: SubscriptionStatus): {
    label: string;
    color: string;
    icon: string;
} {
    switch (status) {
        case 'trial':
            return { label: 'Free Trial', color: 'blue', icon: '🔵' };
        case 'active':
            return { label: 'Active', color: 'green', icon: '🟢' };
        case 'past_due':
            return { label: 'Payment Due', color: 'yellow', icon: '🟡' };
        case 'cancelled':
            return { label: 'Cancelled', color: 'gray', icon: '⚫' };
        case 'expired':
            return { label: 'Expired', color: 'red', icon: '🔴' };
        default:
            return { label: 'Unknown', color: 'gray', icon: '⚪' };
    }
}
