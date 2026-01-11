'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { SubscriptionStatus, calculateTrialEndDate, calculateGracePeriodEndDate } from '@/types/subscription';

/**
 * Get subscription status for a store
 */
export async function getSubscriptionStatus(storeId: string) {
    try {
        const storeRef = doc(db, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);

        if (!storeSnap.exists()) {
            return null;
        }

        const data = storeSnap.data();
        return {
            status: data.subscriptionStatus || 'trial',
            trialEndsAt: data.subscriptionTrialEndsAt,
            nextBillingDate: data.subscriptionNextBillingDate,
            subscriptionCode: data.subscriptionCode,
            paystackCustomerCode: data.paystackCustomerCode,
            planCode: data.subscriptionPlanCode,
        };
    } catch (error) {
        console.error('Error getting subscription status:', error);
        throw error;
    }
}

/**
 * Update subscription status and related fields
 */
export async function updateSubscriptionStatus(
    storeId: string,
    status: SubscriptionStatus,
    updates: Record<string, any> = {}
) {
    try {
        const storeRef = doc(db, 'stores', storeId);
        await updateDoc(storeRef, {
            subscriptionStatus: status,
            ...updates,
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating subscription status:', error);
        throw error;
    }
}

/**
 * Initialize a new store with trial subscription
 */
export async function initializeTrialSubscription(storeId: string) {
    try {
        const trialEndDate = calculateTrialEndDate();
        const storeRef = doc(db, 'stores', storeId);

        await updateDoc(storeRef, {
            subscriptionStatus: 'trial',
            subscriptionTrialEndsAt: Timestamp.fromDate(trialEndDate),
            subscriptionStartDate: serverTimestamp(),
        });

        return { success: true, trialEndsAt: trialEndDate };
    } catch (error) {
        console.error('Error initializing trial subscription:', error);
        throw error;
    }
}

/**
 * Activate subscription after successful payment
 */
export async function activateSubscription(
    storeId: string,
    subscriptionCode: string,
    customerCode: string,
    planCode: string,
    nextBillingDate: Date
) {
    try {
        const storeRef = doc(db, 'stores', storeId);

        await updateDoc(storeRef, {
            subscriptionStatus: 'active',
            subscriptionCode,
            paystackCustomerCode: customerCode,
            subscriptionPlanCode: planCode,
            subscriptionNextBillingDate: Timestamp.fromDate(nextBillingDate),
            subscriptionStartDate: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error('Error activating subscription:', error);
        throw error;
    }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(storeId: string) {
    try {
        const storeRef = doc(db, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);

        if (!storeSnap.exists()) {
            throw new Error('Store not found');
        }

        const subscriptionCode = storeSnap.data().subscriptionCode;

        if (!subscriptionCode) {
            throw new Error('No active subscription found');
        }

        // Call Paystack API to cancel subscription
        const response = await fetch(`https://api.paystack.co/subscription/${subscriptionCode}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: subscriptionCode,
                token: subscriptionCode, // Email token for subscription management
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to cancel subscription');
        }

        // Update Firestore
        await updateDoc(storeRef, {
            subscriptionStatus: 'cancelled',
            subscriptionCancelledAt: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
    }
}

/**
 * Handle payment failure - set to past_due with grace period
 */
export async function handlePaymentFailure(storeId: string) {
    try {
        const gracePeriodEnd = calculateGracePeriodEndDate();
        const storeRef = doc(db, 'stores', storeId);

        await updateDoc(storeRef, {
            subscriptionStatus: 'past_due',
            subscriptionNextBillingDate: Timestamp.fromDate(gracePeriodEnd),
        });

        return { success: true, gracePeriodEndsAt: gracePeriodEnd };
    } catch (error) {
        console.error('Error handling payment failure:', error);
        throw error;
    }
}

/**
 * Expire subscription after grace period
 */
export async function expireSubscription(storeId: string) {
    try {
        const storeRef = doc(db, 'stores', storeId);

        await updateDoc(storeRef, {
            subscriptionStatus: 'expired',
        });

        return { success: true };
    } catch (error) {
        console.error('Error expiring subscription:', error);
        throw error;
    }
}

/**
 * DevTeam: Manually override subscription status
 */
export async function devTeamOverrideSubscription(
    storeId: string,
    status: SubscriptionStatus,
    tier: SubscriptionTier = 'general',
    reason?: string
) {
    try {
        const storeRef = doc(db, 'stores', storeId);

        const updateData: any = {
            subscriptionStatus: status,
            subscriptionOverrideReason: reason || 'Manual override by devteam',
            subscriptionOverrideAt: serverTimestamp(),
        };

        if (status === 'active') {
            const nextBilling = new Date();
            // Weekly for new tiers, monthly for general
            const isWeekly = ['basic', 'pro', 'promax'].includes(tier);
            nextBilling.setDate(nextBilling.getDate() + (isWeekly ? 7 : 30));

            updateData.subscriptionNextBillingDate = Timestamp.fromDate(nextBilling);
            updateData.subscriptionTier = tier;
        }

        await updateDoc(storeRef, updateData);

        return { success: true };
    } catch (error) {
        console.error('Error overriding subscription:', error);
        throw error;
    }
}

/**
 * Update next billing date after successful payment
 */
export async function updateNextBillingDate(storeId: string, nextBillingDate: Date) {
    try {
        const storeRef = doc(db, 'stores', storeId);

        await updateDoc(storeRef, {
            subscriptionNextBillingDate: Timestamp.fromDate(nextBillingDate),
            subscriptionStatus: 'active', // Ensure status is active after successful payment
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating next billing date:', error);
        throw error;
    }
}
/**
 * Verify subscription payment and activate
 */
export async function verifySubscriptionPayment(reference: string) {
    try {
        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
        if (!PAYSTACK_SECRET_KEY) throw new Error('Missing Paystack secret key');

        // Verify transaction with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!data.status || data.data.status !== 'success') {
            throw new Error('Transaction verification failed');
        }

        const { metadata, customer, plan, subscription_code, authorization } = data.data;
        const storeId = metadata?.storeId;
        const tier = metadata?.tier || 'general';

        if (!storeId) throw new Error('No store ID in transaction metadata');

        // Calculate next billing date
        const nextBillingDate = new Date();
        if (tier === 'basic' || tier === 'pro' || tier === 'promax') {
            // Weekly billing
            nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        } else {
            // Monthly billing
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        // Activate subscription
        await activateSubscription(
            storeId,
            subscription_code, // Paystack creates this automatically for plan payments
            customer.customer_code,
            plan.plan_code,
            nextBillingDate
        );

        return { success: true };
    } catch (error) {
        console.error('Error verifying subscription payment:', error);
        throw error;
    }
}
