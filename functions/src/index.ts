
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

admin.initializeApp();

const db = admin.firestore();

/**
 * Generate weekly wholesale invoices
 * Runs daily at 12:00 AM UTC
 * Aggregates all delivered orders by seller-buyer pair and creates invoices
 */
export const generateWeeklyWholesaleInvoices = onSchedule(
    'every day 00:00',
    async () => {
        try {
            logger.info('Starting weekly wholesale invoice generation...');

            // Get all wholesale transactions that are paid but not yet invoiced
            const transactionsSnapshot = await db
                .collection('wholesaleTransactions')
                .where('status', '==', 'pending_settlement')
                .limit(1000) // Process in batches
                .get();

            if (transactionsSnapshot.empty) {
                logger.info('No pending wholesale transactions to invoice.');
                return;
            }

            // Group transactions by seller-buyer pair
            const invoiceGroups: Record<
                string,
                {
                    sellerStoreId: string;
                    buyerStoreId: string;
                    sellerStoreName: string;
                    buyerStoreName: string;
                    orders: Array<{
                        wholesaleOrderId: string;
                        amountInKobo: number;
                        createdAt: admin.firestore.Timestamp;
                    }>;
                    totalAmountInKobo: number;
                }
            > = {};

            transactionsSnapshot.docs.forEach((doc) => {
                const transaction = doc.data();
                const key = `${transaction.sellerStoreId}_${transaction.buyerStoreId}`;

                if (!invoiceGroups[key]) {
                    invoiceGroups[key] = {
                        sellerStoreId: transaction.sellerStoreId,
                        buyerStoreId: transaction.buyerStoreId,
                        sellerStoreName: transaction.sellerStoreName,
                        buyerStoreName: transaction.buyerStoreName,
                        orders: [],
                        totalAmountInKobo: 0,
                    };
                }

                invoiceGroups[key].orders.push({
                    wholesaleOrderId: transaction.wholesaleOrderId,
                    amountInKobo: transaction.amountInKobo,
                    createdAt: transaction.createdAt,
                });

                invoiceGroups[key].totalAmountInKobo += transaction.amountInKobo;
            });

            // Create invoices for each group
            const batch = db.batch();
            const invoicesCreated: string[] = [];
            const emailPromises: Promise<any>[] = [];

            Object.entries(invoiceGroups).forEach(([_key, group]) => {
                // Generate invoice number: WL-YYYY-XXXXX
                const now = new Date();
                const year = now.getFullYear();
                const randomNum = Math.floor(Math.random() * 100000)
                    .toString()
                    .padStart(5, '0');
                const invoiceNumber = `WL-${year}-${randomNum}`;

                // Get the latest order's payment terms (use default if not available)
                const paymentTermsDays = group.orders.length > 0 ? 0 : 0; // Default to 0 for now
                const dueDate = new Date(now);
                dueDate.setDate(dueDate.getDate() + paymentTermsDays);

                // Calculate fees
                const platformFeeInKobo = Math.round(group.totalAmountInKobo * 0.05);
                const vendorPayoutInKobo = group.totalAmountInKobo - platformFeeInKobo;

                // Create invoice document
                const invoiceRef = db
                    .collection('wholesaleInvoices')
                    .doc();

                const invoiceData = {
                    invoiceNumber,
                    sellerStoreId: group.sellerStoreId,
                    buyerStoreId: group.buyerStoreId,
                    invoicePeriod: {
                        startDate: admin.firestore.Timestamp.fromDate(
                            new Date(now.getFullYear(), now.getMonth(), 1)
                        ),
                        endDate: admin.firestore.Timestamp.now(),
                    },
                    orders: group.orders.map((o) => ({
                        orderId: o.wholesaleOrderId,
                        date: o.createdAt,
                        amount: o.amountInKobo,
                    })),
                    subtotal: group.totalAmountInKobo,
                    platformFeeTotal: platformFeeInKobo,
                    total: vendorPayoutInKobo,
                    paymentTermsDays,
                    dueDate: admin.firestore.Timestamp.fromDate(dueDate),
                    status: 'pending',
                    createdAt: admin.firestore.Timestamp.now(),
                    emailSentToSeller: false,
                    emailSentToBuyer: false,
                };

                batch.set(invoiceRef, invoiceData);
                invoicesCreated.push(invoiceNumber);

                // Email feature disabled until API keys configured
                // emailPromises.push(
                //     sendInvoiceEmailsForGroup(group, invoiceNumber, invoiceData, invoiceRef.id)
                // );
            });

            // Update transactions to reference their invoice (mark as processed)
            // In a real implementation, we'd link each transaction to its invoice

            await batch.commit();
            logger.info(`Created ${invoicesCreated.length} wholesale invoices`, {
                invoices: invoicesCreated,
            });

            // Email feature disabled until API keys configured
            // Send emails in parallel (non-blocking)
            // Promise.allSettled(emailPromises).then((results) => {
            //     const successful = results.filter((r) => r.status === 'fulfilled').length;
            //     logger.info(`Email notifications sent: ${successful}/${emailPromises.length}`);
            // });
        } catch (error) {
            logger.error('Error generating wholesale invoices:', error);
            // Don't throw - let Cloud Functions handle the error
        }
    }
);

/**
 * Settle wholesale payments
 * Runs daily at 1:00 AM UTC
 * Processes pending invoices with due dates and transfers to vendor subaccounts
 */
export const settleWholesalePayments = onSchedule('every day 01:00', async () => {
    try {
        logger.info('Starting wholesale payment settlement...');

        const now = admin.firestore.Timestamp.now();

        // Find all pending invoices with due dates <= now
        const invoicesSnapshot = await db
            .collection('wholesaleInvoices')
            .where('status', '==', 'pending')
            .where('dueDate', '<=', now)
            .limit(500) // Process in batches
            .get();

        if (invoicesSnapshot.empty) {
            logger.info('No invoices due for settlement.');
            return;
        }

        logger.info(`Found ${invoicesSnapshot.size} invoices due for settlement.`);

        // Process each invoice
        const settlementResults: {
            success: number;
            failed: number;
            errors: string[];
        } = { success: 0, failed: 0, errors: [] };

        for (const invoiceDoc of invoicesSnapshot.docs) {
            try {
                const invoice = invoiceDoc.data();

                // Get seller store to fetch Paystack subaccount code
                const sellerStoreSnap = await db
                    .collection('stores')
                    .doc(invoice.sellerStoreId)
                    .get();

                if (!sellerStoreSnap.exists) {
                    logger.log(`Seller store not found: ${invoice.sellerStoreId}`);
                    settlementResults.failed++;
                    settlementResults.errors.push(`Seller ${invoice.sellerStoreId} not found`);
                    continue;
                }

                const sellerStore = sellerStoreSnap.data();
                const paystackSubaccountCode = sellerStore?.paystackSubaccountCode;

                if (!paystackSubaccountCode) {
                    logger.log(
                        `No Paystack subaccount for seller: ${invoice.sellerStoreId}`
                    );
                    settlementResults.failed++;
                    settlementResults.errors.push(
                        `No subaccount for ${invoice.sellerStoreId}`
                    );
                    continue;
                }

                // Attempt Paystack transfer
                const transferResult = await transferFundsViaPaystack(
                    paystackSubaccountCode,
                    invoice.total,
                    `INV_${invoice.invoiceNumber}`,
                    `Wholesale Invoice Settlement: ${invoice.invoiceNumber}`
                );

                if (transferResult.success) {
                    // Update invoice status to settled
                    await db.collection('wholesaleInvoices')
                        .doc(invoiceDoc.id)
                        .update({
                            status: 'settled',
                            settlementTransactionRef: transferResult.transferId,
                            settledAt: admin.firestore.Timestamp.now(),
                        });

                    logger.info(`Invoice settled: ${invoice.invoiceNumber}`);
                    settlementResults.success++;

                    // Email feature disabled until API keys configured
                    // Send settlement confirmation email (async, non-blocking)
                    // sendSettlementEmail(
                    //     invoice.sellerStoreId,
                    //     invoice.invoiceNumber,
                    //     invoice.total,
                    //     transferResult.transferId || ''
                    // );
                } else {
                    logger.error(
                        `Transfer failed for invoice ${invoice.invoiceNumber}: ${transferResult.error}`
                    );
                    settlementResults.failed++;
                    settlementResults.errors.push(transferResult.error || 'Unknown error');
                }
            } catch (invoiceError) {
                logger.error('Error processing invoice:', invoiceError);
                settlementResults.failed++;
                settlementResults.errors.push(
                    invoiceError instanceof Error ? invoiceError.message : 'Unknown error'
                );
            }
        }

        logger.info('Wholesale payment settlement completed', settlementResults);
    } catch (error) {
        logger.error('Error in settlement function:', error);
        // Don't throw - let Cloud Functions handle the error
    }
});

/**
 * Helper function to transfer funds via Paystack API
 */
async function transferFundsViaPaystack(
    recipientSubaccountCode: string,
    amountInKobo: number,
    reference: string,
    reason: string
): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
        if (!PAYSTACK_SECRET_KEY) {
            return { success: false, error: 'Paystack secret key not configured' };
        }

        const response = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: 'balance',
                recipient: recipientSubaccountCode,
                amount: amountInKobo,
                reference,
                reason,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            logger.error('Paystack transfer error:', data);
            return {
                success: false,
                error: data.message || 'Failed to process transfer',
            };
        }

        return {
            success: true,
            transferId: data.data?.transfer_code || data.data?.id,
        };
    } catch (error) {
        logger.error('Error transferring funds:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Helper function to send invoice emails to seller and buyer
 */
async function sendInvoiceEmailsForGroup(
    group: any,
    invoiceNumber: string,
    invoiceData: any,
    invoiceDocId: string
): Promise<void> {
    try {
        // Fetch seller and buyer store details for contact info
        const [sellerSnap, buyerSnap] = await Promise.all([
            db.collection('stores').doc(group.sellerStoreId).get(),
            db.collection('stores').doc(group.buyerStoreId).get(),
        ]);

        if (!sellerSnap.exists || !buyerSnap.exists) {
            logger.log(`Missing store data for invoice ${invoiceNumber}`);
            return;
        }

        const sellerStore = sellerSnap.data();
        const buyerStore = buyerSnap.data();

        if (!sellerStore?.ceoEmail || !buyerStore?.ceoEmail) {
            logger.log(`Missing email for stores in invoice ${invoiceNumber}`);
            return;
        }

        // In production, trigger an HTTP Cloud Function to send emails via Resend
        // For now, log that emails were queued
        logger.info(`Invoice emails queued for ${invoiceNumber}`, {
            sellerEmail: sellerStore.ceoEmail,
            buyerEmail: buyerStore.ceoEmail,
        });
    } catch (error) {
        logger.error(`Error queuing invoice emails for ${invoiceNumber}:`, error);
        // Don't throw - don't block invoice generation on email errors
    }
}

/**
 * Helper function to send settlement confirmation email
 */
async function sendSettlementEmail(
    sellerStoreId: string,
    invoiceNumber: string,
    amountInKobo: number,
    transferCode: string
): Promise<void> {
    try {
        const sellerSnap = await db.collection('stores').doc(sellerStoreId).get();

        if (!sellerSnap.exists) {
            logger.log(`Seller store not found: ${sellerStoreId}`);
            return;
        }

        const sellerStore = sellerSnap.data();
        if (!sellerStore?.ceoEmail) {
            logger.log(`No email for seller: ${sellerStoreId}`);
            return;
        }

        // In production, trigger an HTTP Cloud Function to send emails via Resend
        // For now, log that emails were queued
        logger.info(`Settlement confirmation email queued for ${invoiceNumber}`, {
            sellerEmail: sellerStore.ceoEmail,
            amount: amountInKobo,
            reference: transferCode,
        });
    } catch (error) {
        logger.error(`Error queuing settlement email for ${invoiceNumber}:`, error);
        // Don't throw - don't block settlement on email errors
    }
}
