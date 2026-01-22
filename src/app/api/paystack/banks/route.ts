import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

        if (!PAYSTACK_SECRET_KEY) {
            return NextResponse.json({ error: 'Paystack secret key is not configured' }, { status: 500 });
        }

        const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json({ error: data.message }, { status: 400 });
        }

        // Return only necessary fields: name and code
        const banks = data.data.map((bank: any) => ({
            name: bank.name,
            code: bank.code
        }));

        return NextResponse.json({ banks });

    } catch (error) {
        console.error('Paystack Banks Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
