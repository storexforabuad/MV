import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/resolve-bank?accountNumber=&bankCode=
 * Server-side proxy to Paystack Resolve Account API.
 * Keeps the Paystack secret key off the client.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const accountNumber = searchParams.get('accountNumber');
    const bankCode = searchParams.get('bankCode');

    if (!accountNumber || !bankCode) {
        return NextResponse.json({ error: 'accountNumber and bankCode are required' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        return NextResponse.json({ error: 'Paystack secret key not configured' }, { status: 500 });
    }

    try {
        const res = await fetch(
            `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            }
        );

        const data = await res.json();

        if (!res.ok || !data.status) {
            return NextResponse.json(
                { error: data.message || 'Could not resolve account name' },
                { status: 400 }
            );
        }

        return NextResponse.json({ account_name: data.data.account_name });
    } catch (err) {
        console.error('[resolve-bank] error:', err);
        return NextResponse.json({ error: 'Failed to resolve bank account' }, { status: 500 });
    }
}
