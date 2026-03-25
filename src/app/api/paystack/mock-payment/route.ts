import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Mock Paystack Transaction Initializer
 * Returns a fake authorization_url pointing to our in-app mock checkout page.
 * Use this route when PAYSTACK_MOCK=true or when testing without real keys.
 */
export async function POST(request: NextRequest) {
    try {
        const { email, amount, storeId, metadata } = await request.json();

        if (!email || !amount) {
            return NextResponse.json({ error: 'Missing email or amount' }, { status: 400 });
        }

        // Generate a mock transaction reference
        const reference = `MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const origin = request.headers.get('origin') || '';

        // Build mock Paystack redirect URL pointing to our in-app mock page
        const mockUrl = `${origin}/mock-payment?reference=${reference}&amount=${amount}&email=${encodeURIComponent(email)}&storeId=${storeId}&orderId=${metadata?.orderId || ''}&callback=${encodeURIComponent(`${origin}/${storeId}/payment-success`)}`;

        return NextResponse.json({
            authorization_url: mockUrl,
            access_code: `mock_access_${reference}`,
            reference,
        });
    } catch (error) {
        console.error('Mock Payment Init Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
