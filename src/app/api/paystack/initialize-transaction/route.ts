import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, amount, storeId, metadata } = await request.json();

        if (!email || !amount) {
            return NextResponse.json({ error: 'Missing email or amount' }, { status: 400 });
        }

        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

        // Calculate commission (4%)
        // In a real split payment scenario, we would use 'subaccount' field.
        // For now, we initialize the transaction to the main account.
        // The commission logic is handled by Paystack if we provide a subaccount.
        // Since we don't have vendor subaccounts yet, we collect all and track commission in metadata.

        const params = {
            email,
            amount: Math.round(amount * 100), // Convert to kobo
            metadata: {
                ...metadata,
                storeId,
                commission_percent: 4,
                commission_amount: amount * 0.04
            },
            callback_url: `${request.headers.get('origin')}/${storeId}/payment-success` // We will need to create this page or handle callback
        };

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json({ error: data.message }, { status: 400 });
        }

        return NextResponse.json({
            authorization_url: data.data.authorization_url,
            access_code: data.data.access_code,
            reference: data.data.reference
        });

    } catch (error) {
        console.error('Paystack Init Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
