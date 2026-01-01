import { Timestamp } from 'firebase/firestore';

// Subscription status types
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

// Subscription data structure
export interface SubscriptionData {
    status: SubscriptionStatus;
    planCode: string;
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
    MONTHLY_AMOUNT: 5000, // ₦5,000
    MONTHLY_AMOUNT_KOBO: 500000, // 5000 * 100 kobo
    TRIAL_DAYS: 14,
    GRACE_PERIOD_DAYS: 2,
    CURRENCY: 'NGN',
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
