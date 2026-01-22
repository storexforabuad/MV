import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
    try {
        const { email, amount, storeId, metadata } = await request.json();

        if (!email || !amount) {
            return NextResponse.json({ error: 'Missing email or amount' }, { status: 400 });
        }

        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

        // Fetch store subaccount code
        let subaccountCode = null;
        if (storeId) {
            const storeRef = doc(db, 'stores', storeId);
            const storeSnap = await getDoc(storeRef);
            if (storeSnap.exists()) {
                subaccountCode = storeSnap.data().paystackSubaccountCode;
            }
        }

        // Calculate commission (4.5%)
        const params: any = {
            email,
            amount: Math.round(amount * 100), // Convert to kobo
            metadata: {
                ...metadata,
                storeId,
                commission_percent: 4.5,
                commission_amount: amount * 0.045
            },
            callback_url: `${request.headers.get('origin')}/${storeId}/payment-success`
        };

        if (subaccountCode) {
            params.subaccount = subaccountCode;
        }

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
