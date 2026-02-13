import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, storeId, timestamp } = await request.json();

    // Validate input
    if (!email || !storeId) {
      return NextResponse.json(
        { error: 'Email and storeId are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // TODO: Send email to mlawal44@gmail.com using your preferred email service
    // Options:
    // 1. SendGrid API
    // 2. Nodemailer with Gmail/SMTP
    // 3. Firebase Cloud Functions
    // 4. Resend.dev
    
    // For now, log to console and save to a service (Firebase, etc.)
    console.log('Website inquiry received:', {
      email,
      storeId,
      timestamp,
    });

    // Example: You can add Firebase Firestore save here
    // await db.collection('website_inquiries').add({
    //   email,
    //   storeId,
    //   timestamp: new Date(timestamp),
    //   createdAt: serverTimestamp(),
    // });

    return NextResponse.json(
      { 
        success: true,
        message: 'Inquiry submitted successfully. We will contact you soon!' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing website inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to process inquiry' },
      { status: 500 }
    );
  }
}
