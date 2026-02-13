import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // TODO: Verify payment status with Paystack API
    // Using: https://api.paystack.co/transaction/verify/{reference}

    // Mock response
    return NextResponse.json(
      {
        status: 'success',
        data: {
          reference,
          amount: 50000, // in kobo
          currency: 'NGN',
          customer: {
            email: 'user@example.com',
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
