import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { whatsappNumber, businessName, loginLink } = await request.json();

    if (!whatsappNumber || !businessName || !loginLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Send WhatsApp message using Twilio or WhatsApp Business API
    // Message format:
    // "Hi [BusinessName]! 👋 Welcome to SuperMom! Your account is ready. Login here: [link]"

    console.log('Sending WhatsApp message to:', whatsappNumber);
    console.log('Message:', `Hi ${businessName}! Welcome to SuperMom!`);
    console.log('Login link:', loginLink);

    return NextResponse.json(
      {
        success: true,
        message: 'WhatsApp message sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
