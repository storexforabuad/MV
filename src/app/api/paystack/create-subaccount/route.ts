import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            business_name,
            settlement_bank,
            account_number,
            subaccount_type,
            first_name,
            last_name,
            phone,
            email
        } = body;

        // Validate required fields
        if (!business_name || !settlement_bank || !account_number || !email) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate account number is 10 digits
        if (!/^\d{10}$/.test(account_number)) {
            return NextResponse.json(
                { success: false, message: 'Invalid account number format' },
                { status: 400 }
            );
        }

        // Validate bank code is 3 digits
        if (!/^\d{3}$/.test(settlement_bank)) {
            return NextResponse.json(
                { success: false, message: 'Invalid bank code format' },
                { status: 400 }
            );
        }

        // Call Paystack API to create subaccount
        const paystackResponse = await fetch('https://api.paystack.co/subaccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            },
            body: JSON.stringify({
                business_name,
                settlement_bank,
                account_number,
                subaccount_type: subaccount_type || 'individual',
                first_name,
                last_name,
                phone,
                email,
                percentage_charge: 0 // Commission will be handled at transaction level
            })
        });

        const paystackData = await paystackResponse.json();

        if (!paystackResponse.ok) {
            console.error('Paystack API Error:', paystackData);
            return NextResponse.json(
                {
                    success: false,
                    message: paystackData.message || 'Failed to create subaccount with Paystack'
                },
                { status: paystackResponse.status }
            );
        }

        // Extract subaccount code from response
        const subaccountCode = paystackData.data?.subaccount_code;

        if (!subaccountCode) {
            console.error('No subaccount code in Paystack response:', paystackData);
            return NextResponse.json(
                { success: false, message: 'No subaccount code returned from Paystack' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Subaccount created successfully',
            subaccount_code: subaccountCode,
            subaccount_id: paystackData.data?.id
        });

    } catch (error: any) {
        console.error('Error creating Paystack subaccount:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Internal server error'
            },
            { status: 500 }
        );
    }
}
