import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { storeId, businessName, settlementBank, accountNumber, subaccountCode } = await request.json();

        if (!storeId || !businessName || !settlementBank || !accountNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

        if (!PAYSTACK_SECRET_KEY) {
            return NextResponse.json({ error: 'Paystack secret key is not configured' }, { status: 500 });
        }

        const payload = {
            business_name: businessName,
            settlement_bank: settlementBank,
            account_number: accountNumber,
            percentage_charge: 0, // We handle splitting dynamically per transaction
        };

        let response;
        if (subaccountCode) {
            // Update existing subaccount
            response = await fetch(`https://api.paystack.co/subaccount/${subaccountCode}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Create new subaccount
            response = await fetch('https://api.paystack.co/subaccount', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json({ error: data.message }, { status: 400 });
        }

        const newSubaccountCode = data.data.subaccount_code;

        // Update Firestore with the subaccount code
        const storeRef = doc(db, 'stores', storeId);
        await updateDoc(storeRef, {
            paystackSubaccountCode: newSubaccountCode
        });

        return NextResponse.json({
            status: true,
            subaccount_code: newSubaccountCode,
            message: subaccountCode ? 'Subaccount updated' : 'Subaccount created'
        });

    } catch (error) {
        console.error('Paystack Subaccount Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
