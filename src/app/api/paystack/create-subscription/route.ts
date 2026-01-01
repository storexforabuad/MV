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

        // Step 2: Return necessary data for client-side initialization
        // We do NOT create the subscription here. Paystack Inline will create it when the user pays with the plan code.

        return NextResponse.json({
            success: true,
            data: {
                customerCode,
                planCode: PAYSTACK_PLAN_CODE,
                email,
            },
        });
    } catch (error) {
        console.error('Error preparing subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
