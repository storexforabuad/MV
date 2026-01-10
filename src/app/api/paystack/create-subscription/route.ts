import { NextRequest, NextResponse } from 'next/server';
import { activateSubscription } from '@/app/actions/subscriptionActions';

/**
 * POST /api/paystack/create-subscription
 * Creates a Paystack subscription for a vendor
 */
export async function POST(request: NextRequest) {
    try {
        const { storeId, email, storeName, tier } = await request.json();

        if (!storeId || !email) {
            return NextResponse.json(
                { error: 'Missing required fields: storeId and email' },
                { status: 400 }
            );
        }

        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

        // Map tier to environment variable
        let planCode = '';
        if (tier === 'basic') planCode = process.env.PAYSTACK_BASIC_PLAN_CODE || '';
        else if (tier === 'pro') planCode = process.env.PAYSTACK_PRO_PLAN_CODE || '';
        else if (tier === 'promax') planCode = process.env.PAYSTACK_PROMAX_PLAN_CODE || '';
        else planCode = process.env.PAYSTACK_PLAN_CODE || ''; // Default/General

        if (!PAYSTACK_SECRET_KEY || !planCode) {
            const missing = [];
            if (!PAYSTACK_SECRET_KEY) missing.push('PAYSTACK_SECRET_KEY');
            if (!planCode) missing.push(`PAYSTACK_${(tier || 'general').toUpperCase()}_PLAN_CODE`);

            console.error('Missing Paystack environment variables:', missing.join(', '));
            return NextResponse.json(
                { error: `Server configuration error: Missing ${missing.join(', ')}` },
                { status: 500 }
            );
        }

        // Step 1: Create or get Paystack customer
        const customerResponse = await fetch('https://api.paystack.co/customer', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                first_name: storeName || 'Store',
                metadata: {
                    storeId,
                    tier,
                },
            }),
        });

        const customerData = await customerResponse.json();
        let customerCode = '';

        if (customerData.status) {
            customerCode = customerData.data.customer_code;
        } else {
            // If customer already exists, fetch their details
            const getCustomerResponse = await fetch(`https://api.paystack.co/customer/${email}`, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            });
            const existingCustomerData = await getCustomerResponse.json();
            if (existingCustomerData.status) {
                customerCode = existingCustomerData.data.customer_code;
            } else {
                throw new Error(customerData.message || 'Failed to create or retrieve Paystack customer');
            }
        }

        // Step 2: Return necessary data for client-side initialization
        return NextResponse.json({
            success: true,
            data: {
                customerCode,
                planCode,
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
