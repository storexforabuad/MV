import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { planId, email, businessName, storeId, storeName } = await request.json();

    if (!planId || !email || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Initialize Paystack payment for weekly subscription
    // Get plan details from config
    // Create Paystack plan/subscription
    // Return authorization URL or reference

    // For now, return mock response
    const mockAuthUrl = `https://checkout.paystack.com/mock?email=${email}&reference=mock_${Date.now()}`;

    return NextResponse.json(
      {
        authUrl: mockAuthUrl,
        reference: `mock_${Date.now()}`,
        message: 'Payment initialized',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
