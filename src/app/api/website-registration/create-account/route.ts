import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      businessName, 
      whatsapp, 
      category,
      country,
      state,
      planId,
      paymentReference,
      storeId,
      storeName 
    } = await request.json();

    // Validate input
    if (!email || !businessName || !whatsapp || !category || !country || !state || !planId || !paymentReference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: 
    // 1. Verify payment with Paystack using paymentReference
    // 2. Check for duplicate email
    // 3. Create user in Firestore with plan details
    // 4. Generate login link
    // 5. Send WhatsApp message with login link
    // 6. Log to /devteam registrations

    // Mock response
    const userId = `user_${Date.now()}`;
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?token=${userId}`;

    return NextResponse.json(
      {
        success: true,
        userId,
        loginLink,
        message: 'Account created successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
