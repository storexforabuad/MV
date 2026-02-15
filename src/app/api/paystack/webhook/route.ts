import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
    updateNextBillingDate,
    handlePaymentFailure,
    activateSubscription,
    updateSubscriptionStatus,
} from '@/app/actions/subscriptionActions';
import { handleWholesalePayment } from '@/app/actions/wholesaleWebhook';

/**
 * POST /api/paystack/webhook
 * Handles Paystack webhook events
 */
export async function POST(request: NextRequest) {
    try {
        // Get the signature from headers
        const signature = request.headers.get('x-paystack-signature');
        const body = await request.text();

        // Verify webhook signature
        const WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
        if (!WEBHOOK_SECRET) {
            console.error('PAYSTACK_WEBHOOK_SECRET not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const hash = crypto
            .createHmac('sha512', WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        if (hash !== signature) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Parse the event
        const event = JSON.parse(body);
        const eventType = event.event;
        const eventData = event.data;

        console.log(`Received Paystack webhook: ${eventType}`);

        // Extract storeId from metadata
        const storeId = eventData.metadata?.storeId || eventData.customer?.metadata?.storeId;

        if (!storeId) {
            console.warn('No storeId found in webhook event metadata');
            // Still return 200 to acknowledge receipt
            return NextResponse.json({ received: true, warning: 'No storeId in metadata' });
        }

        // Handle different event types
        switch (eventType) {
            case 'subscription.create':
                // Subscription successfully created
                await handleSubscriptionCreate(eventData, storeId);
                break;

            case 'charge.success':
                // Payment successful (renewal)
                await handleChargeSuccess(eventData, storeId);
                break;

            case 'invoice.payment_failed':
                // Payment failed
                await handleInvoicePaymentFailed(eventData, storeId);
                break;

            case 'subscription.disable':
                // Subscription cancelled
                await handleSubscriptionDisable(eventData, storeId);
                break;

            case 'subscription.not_renew':
                // Subscription set to not renew
                await handleSubscriptionNotRenew(eventData, storeId);
                break;

            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        // Return 200 even on error to prevent Paystack from retrying
        return NextResponse.json({ error: 'Processing error' }, { status: 200 });
    }
}

/**
 * Handle subscription.create event
 */
async function handleSubscriptionCreate(data: any, storeId: string) {
    try {
        const subscription = data.subscription || data;
        const nextPaymentDate = new Date(subscription.next_payment_date);

        await activateSubscription(
            storeId,
            subscription.subscription_code,
            data.customer?.customer_code || '',
            subscription.plan?.plan_code || process.env.PAYSTACK_PLAN_CODE || '',
            nextPaymentDate
        );

        console.log(`Subscription activated for store: ${storeId}`);

        // TODO: Send email notification (subscription activated)
    } catch (error) {
        console.error('Error handling subscription.create:', error);
    }
}

/**
 * Handle charge.success event (renewal payment or wholesale order payment)
 */
async function handleChargeSuccess(data: any, storeId: string) {
    try {
        // Check if this is a wholesale order payment
        const wholesaleOrderId = data.metadata?.wholesaleOrderId;
        const buyerStoreId = data.metadata?.buyerStoreId;
        const sellerStoreId = data.metadata?.sellerStoreId;
        const paymentTermsDays = data.metadata?.paymentTermsDays;
        const paystackTransactionRef = data.reference;

        if (wholesaleOrderId && buyerStoreId && sellerStoreId !== undefined) {
            // Handle wholesale order payment
            await handleWholesalePayment({
                wholesaleOrderId,
                buyerStoreId,
                sellerStoreId,
                paymentTermsDays: parseInt(paymentTermsDays || '0'),
                paystackTransactionRef,
                amountInKobo: data.amount,
            });

            console.log(`Wholesale order payment successful: ${wholesaleOrderId}`);
            return;
        }

        // Check if this is a subscription renewal
        if (data.subscription) {
            const nextPaymentDate = new Date(data.subscription.next_payment_date);

            await updateNextBillingDate(storeId, nextPaymentDate);

            console.log(`Payment successful for store: ${storeId}, next billing: ${nextPaymentDate}`);

            // TODO: Send email notification (payment successful)
        }
    } catch (error) {
        console.error('Error handling charge.success:', error);
    }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(data: any, storeId: string) {
    try {
        await handlePaymentFailure(storeId);

        console.log(`Payment failed for store: ${storeId}, grace period started`);

        // TODO: Send email notification (payment failed, retry reminder)
    } catch (error) {
        console.error('Error handling invoice.payment_failed:', error);
    }
}

/**
 * Handle subscription.disable event
 */
async function handleSubscriptionDisable(data: any, storeId: string) {
    try {
        await updateSubscriptionStatus(storeId, 'cancelled', {
            subscriptionCancelledAt: new Date(),
        });

        console.log(`Subscription cancelled for store: ${storeId}`);

        // TODO: Send email notification (subscription cancelled)
    } catch (error) {
        console.error('Error handling subscription.disable:', error);
    }
}

/**
 * Handle subscription.not_renew event
 */
async function handleSubscriptionNotRenew(data: any, storeId: string) {
    try {
        await updateSubscriptionStatus(storeId, 'cancelled', {
            subscriptionCancelledAt: new Date(),
        });

        console.log(`Subscription set to not renew for store: ${storeId}`);

        // TODO: Send email notification (subscription will not renew)
    } catch (error) {
        console.error('Error handling subscription.not_renew:', error);
    }
}
