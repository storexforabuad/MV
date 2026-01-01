import { NextRequest, NextResponse } from 'next/server';
import { activateSubscription } from '@/app/actions/subscriptionActions';

/**
 * POST /api/paystack/create-subscription
 * Creates a Paystack subscription for a vendor
 */
export async function POST(request: NextRequest) {
    try {
        const { storeId, email, storeName } = await request.json();

        if (!storeId || !email) {
            return NextResponse.json(
                { error: 'Missing required fields: storeId and email' },
                { status: 400 }
            );
        }

        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
        const PAYSTACK_PLAN_CODE = process.env.PAYSTACK_PLAN_CODE;

        if (!PAYSTACK_SECRET_KEY || !PAYSTACK_PLAN_CODE) {
            console.error('Missing Paystack environment variables');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Step 1: Create or get Paystack customer
        const customerResponse = await fetch('https://api.paystack.co/customer', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                first_name: storeName || 'Store',
                last_name: 'Owner',
                metadata: {
                    storeId,
                },
            }),
        });

        const customerData = await customerResponse.json();

        // If customer already exists, that's fine
        let customerCode = '';
        if (customerData.status) {
            customerCode = customerData.data.customer_code;
        } else if (customerData.message?.includes('already')) {
            // Customer exists, fetch their code
            const existingCustomerResponse = await fetch(
                `https://api.paystack.co/customer/${encodeURIComponent(email)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                    },
                }
            );
            const existingCustomerData = await existingCustomerResponse.json();
            if (existingCustomerData.status) {
                customerCode = existingCustomerData.data.customer_code;
            }
        }

        if (!customerCode) {
            return NextResponse.json(
                { error: 'Failed to create or retrieve customer' },
                { status: 500 }
            );
        }

        // Step 2: Create subscription
        const subscriptionResponse = await fetch('https://api.paystack.co/subscription', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer: customerCode,
                plan: PAYSTACK_PLAN_CODE,
                metadata: {
                    storeId,
                    storeName: storeName || 'Unknown Store',
                },
            }),
        });

        const subscriptionData = await subscriptionResponse.json();

        if (!subscriptionData.status) {
            console.error('Paystack subscription creation failed:', subscriptionData);
            return NextResponse.json(
                { error: subscriptionData.message || 'Failed to create subscription' },
                { status: 500 }
            );
        }

        // Step 3: Calculate next billing date (1 month from now)
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        // Step 4: Update Firestore with subscription data
        await activateSubscription(
            storeId,
            subscriptionData.data.subscription_code,
            customerCode,
            PAYSTACK_PLAN_CODE,
            nextBillingDate
        );

        return NextResponse.json({
            success: true,
            data: {
                subscriptionCode: subscriptionData.data.subscription_code,
                emailToken: subscriptionData.data.email_token,
                customerCode,
                nextBillingDate: nextBillingDate.toISOString(),
                authorization: subscriptionData.data.authorization,
            },
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
