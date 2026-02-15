import { Resend } from 'resend';

// Resend email service - disabled until API keys are configured
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Send wholesale invoice email to seller and/or buyer
 * Includes invoice number, period, due date, and settlement details
 */
export async function sendWholesaleInvoiceEmail(params: {
    sellerEmail: string;
    sellerName: string;
    buyerEmail: string;
    buyerName: string;
    invoiceNumber: string;
    invoicePeriod: { startDate: Date; endDate: Date };
    dueDate: Date;
    subtotal: number;
    platformFee: number;
    total: number;
    orderCount: number;
}): Promise<{ success: boolean; error?: string }> {
    // Email feature disabled until API keys configured
    if (!resend) {
        console.log('[Email Queue] sendWholesaleInvoiceEmail:', params.invoiceNumber);
        return { success: true, error: undefined };
    }

    try {

        const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${params.invoiceNumber}`;
        const formattedStartDate = params.invoicePeriod.startDate.toLocaleDateString();
        const formattedEndDate = params.invoicePeriod.endDate.toLocaleDateString();
        const formattedDueDate = params.dueDate.toLocaleDateString();

        // Email to seller
        const sellerEmailPromise = resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@pitchperfect.ng',
            to: params.sellerEmail,
            subject: `Wholesale Invoice ${params.invoiceNumber} - Payment Due ${formattedDueDate}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2>Wholesale Invoice Notification</h2>
                    <p>Hi ${params.sellerName},</p>
                    
                    <p>A new wholesale invoice has been generated for your business:</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Invoice Number:</strong> ${params.invoiceNumber}</p>
                        <p><strong>Period:</strong> ${formattedStartDate} to ${formattedEndDate}</p>
                        <p><strong>Orders Included:</strong> ${params.orderCount}</p>
                        <p><strong>Subtotal:</strong> ₦${params.subtotal.toLocaleString()}</p>
                        <p><strong>Platform Fee (5%):</strong> ₦${params.platformFee.toLocaleString()}</p>
                        <p style="font-size: 18px; font-weight: bold; color: #1a7c1a;"><strong>Amount Due:</strong> ₦${params.total.toLocaleString()}</p>
                        <p><strong>Due Date:</strong> ${formattedDueDate}</p>
                    </div>
                    
                    <p>Your payment will be automatically settled via Paystack transfer to your registered subaccount.</p>
                    
                    <p><a href="${invoiceUrl}" style="display: inline-block; background-color: #1a7c1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Invoice</a></p>
                    
                    <p>Questions? Reply to this email or contact our support team.</p>
                    
                    <p>Best regards,<br/>Pitch Perfect Wholesale Team</p>
                </div>
            `,
        });

        // Email to buyer
        const buyerEmailPromise = resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@pitchperfect.ng',
            to: params.buyerEmail,
            subject: `Your Wholesale Order Invoice ${params.invoiceNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2>Wholesale Order Invoice</h2>
                    <p>Hi ${params.buyerName},</p>
                    
                    <p>Your wholesale order invoice is ready:</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Invoice Number:</strong> ${params.invoiceNumber}</p>
                        <p><strong>Period:</strong> ${formattedStartDate} to ${formattedEndDate}</p>
                        <p><strong>Orders Included:</strong> ${params.orderCount}</p>
                        <p><strong>Subtotal:</strong> ₦${params.subtotal.toLocaleString()}</p>
                        <p><strong>Platform Fee (5%):</strong> ₦${params.platformFee.toLocaleString()}</p>
                        <p style="font-size: 18px; font-weight: bold; color: #1a7c1a;"><strong>Total:</strong> ₦${params.total.toLocaleString()}</p>
                        <p><strong>Due Date:</strong> ${formattedDueDate}</p>
                    </div>
                    
                    <p>Your invoice has been prepared. You can view and download it from your account.</p>
                    
                    <p><a href="${invoiceUrl}" style="display: inline-block; background-color: #1a7c1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>
                    
                    <p>Best regards,<br/>Pitch Perfect Wholesale Team</p>
                </div>
            `,
        });

        const [sellerResult, buyerResult] = await Promise.all([sellerEmailPromise, buyerEmailPromise]);

        if (sellerResult.error || buyerResult.error) {
            const errors = [];
            if (sellerResult.error) errors.push(`Seller email: ${sellerResult.error.message}`);
            if (buyerResult.error) errors.push(`Buyer email: ${buyerResult.error.message}`);
            return {
                success: false,
                error: errors.join('; '),
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending wholesale invoice email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send invoice emails',
        };
    }
}

/**
 * Send settlement confirmation email to seller
 * Confirms successful payment settlement via Paystack transfer
 */
export async function sendSettlementConfirmationEmail(params: {
    sellerEmail: string;
    sellerName: string;
    invoiceNumber: string;
    amountInKobo: number;
    paystackReference: string;
    settledDate: Date;
}): Promise<{ success: boolean; error?: string }> {
    // Email feature disabled until API keys configured
    if (!resend) {
        console.log('[Email Queue] sendSettlementConfirmationEmail:', params.invoiceNumber);
        return { success: true, error: undefined };
    }

    try {

        const amountInNaira = (params.amountInKobo / 100).toLocaleString();
        const formattedDate = params.settledDate.toLocaleDateString();

        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@pitchperfect.ng',
            to: params.sellerEmail,
            subject: `Payment Settled - Invoice ${params.invoiceNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="color: #1a7c1a;">✓ Payment Settled</h2>
                    <p>Hi ${params.sellerName},</p>
                    
                    <p>Great news! Your wholesale payment has been successfully settled and transferred to your account.</p>
                    
                    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1a7c1a;">
                        <p><strong>Invoice Number:</strong> ${params.invoiceNumber}</p>
                        <p><strong>Amount Settled:</strong> <span style="font-size: 20px; font-weight: bold; color: #1a7c1a;">₦${amountInNaira}</span></p>
                        <p><strong>Paystack Reference:</strong> ${params.paystackReference}</p>
                        <p><strong>Settlement Date:</strong> ${formattedDate}</p>
                    </div>
                    
                    <p>The funds should appear in your registered Paystack subaccount within 24 hours. You can check your Paystack dashboard for transfer details.</p>
                    
                    <p>Thank you for being part of the Pitch Perfect wholesale community!</p>
                    
                    <p>Best regards,<br/>Pitch Perfect Wholesale Team</p>
                </div>
            `,
        });

        if (result.error) {
            return {
                success: false,
                error: result.error.message,
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending settlement confirmation email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send settlement email',
        };
    }
}

/**
 * Send wholesale partnership request email to recipient
 * Notifies vendor of new wholesale request with requester details
 */
export async function sendWholesaleRequestEmail(params: {
    recipientEmail: string;
    recipientName: string;
    requesterName: string;
    requesterStoreType: string;
    requesterLocation?: string;
    message?: string;
    requestId: string;
}): Promise<{ success: boolean; error?: string }> {
    // Email feature disabled until API keys configured
    if (!resend) {
        console.log('[Email Queue] sendWholesaleRequestEmail:', params.recipientEmail);
        return { success: true, error: undefined };
    }

    try {

        const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/wholesale?tab=requests&id=${params.requestId}`;

        let messageSection = '';
        if (params.message) {
            messageSection = `
                <div style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #ff9800; margin: 15px 0;">
                    <p><strong>Message from Requester:</strong></p>
                    <p style="margin: 10px 0 0 0;">"${params.message}"</p>
                </div>
            `;
        }

        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@pitchperfect.ng',
            to: params.recipientEmail,
            subject: `New Wholesale Partnership Request from ${params.requesterName}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2>New Wholesale Partnership Request</h2>
                    <p>Hi ${params.recipientName},</p>
                    
                    <p>You've received a wholesale partnership request! Here are the details:</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Store Name:</strong> ${params.requesterName}</p>
                        <p><strong>Store Type:</strong> ${params.requesterStoreType}</p>
                        ${params.requesterLocation ? `<p><strong>Location:</strong> ${params.requesterLocation}</p>` : ''}
                    </div>
                    
                    ${messageSection}
                    
                    <p>You can review this request and accept or decline it in your Pitch Perfect dashboard.</p>
                    
                    <p><a href="${requestUrl}" style="display: inline-block; background-color: #1a7c1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a></p>
                    
                    <p>Best regards,<br/>Pitch Perfect Wholesale Team</p>
                </div>
            `,
        });

        if (result.error) {
            return {
                success: false,
                error: result.error.message,
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending wholesale request email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send request email',
        };
    }
}
