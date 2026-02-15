'use server';

import { getFirestore, doc, getDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';
import { transferToVendorSubaccount } from '@/lib/paystack-transfers';

const db = getFirestore(firebaseApp);

/**
 * Handle wholesale order payment confirmation from Paystack webhook
 * Updates order status to paid, triggers immediate settlement for 0-day terms,
 * and logs transaction for audit trail
 */
export async function handleWholesalePayment(paymentData: {
    wholesaleOrderId: string;
    buyerStoreId: string;
    sellerStoreId: string;
    paymentTermsDays: number;
    paystackTransactionRef: string;
    amountInKobo: number;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const {
            wholesaleOrderId,
            buyerStoreId,
            sellerStoreId,
            paymentTermsDays,
            paystackTransactionRef,
            amountInKobo,
        } = paymentData;

        // Get the order to verify and get payment details
        const orderRef = doc(db, 'stores', buyerStoreId, 'wholesaleOrders', wholesaleOrderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            console.error(`Wholesale order not found: ${wholesaleOrderId}`);
            return { success: false, error: 'Order not found' };
        }

        const order = orderSnap.data();

        // Verify order belongs to the correct seller
        if (order.sellerStoreId !== sellerStoreId) {
            console.error(
                `Seller mismatch for order ${wholesaleOrderId}: expected ${order.sellerStoreId}, got ${sellerStoreId}`
            );
            return { success: false, error: 'Seller mismatch' };
        }

        // Get seller store to access Paystack subaccount code
        const sellerStoreRef = doc(db, 'stores', sellerStoreId);
        const sellerStoreSnap = await getDoc(sellerStoreRef);

        if (!sellerStoreSnap.exists()) {
            console.error(`Seller store not found: ${sellerStoreId}`);
            return { success: false, error: 'Seller store not found' };
        }

        const sellerStore = sellerStoreSnap.data();
        const paystackSubaccountCode = sellerStore?.paystackSubaccountCode;

        // Get buyer store for transaction logging
        const buyerStoreRef = doc(db, 'stores', buyerStoreId);
        const buyerStoreSnap = await getDoc(buyerStoreRef);
        const buyerStore = buyerStoreSnap.data() || {};

        // Begin batch write for atomic updates
        const batch = writeBatch(db);

        // 1. Update order status to paid
        batch.update(orderRef, {
            status: 'paid',
            paidAt: Timestamp.now(),
            paystackTransactionRef,
        });

        // 2. Log transaction in platform-wide wholesaleTransactions collection
        const transactionRef = doc(
            db,
            'wholesaleTransactions',
            `${sellerStoreId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        );

        const platformFeeInKobo = Math.round(amountInKobo * 0.05); // 5% platform fee
        const vendorPayoutInKobo = amountInKobo - platformFeeInKobo;

        batch.set(transactionRef, {
            wholesaleOrderId,
            buyerStoreId,
            buyerStoreName: buyerStore?.name || 'Unknown',
            sellerStoreId,
            sellerStoreName: sellerStore?.name || 'Unknown',
            amountInKobo,
            platformFeeInKobo,
            vendorPayoutInKobo,
            paymentTermsDays,
            paystackTransactionRef,
            status: paymentTermsDays === 0 ? 'settled' : 'pending_settlement',
            createdAt: Timestamp.now(),
            settledAt: paymentTermsDays === 0 ? Timestamp.now() : null,
        });

        // 3. For 0-day payment terms, immediately settle (transfer to vendor)
        if (paymentTermsDays === 0 && paystackSubaccountCode) {
            try {
                const transferResult = await transferToVendorSubaccount(
                    paystackSubaccountCode,
                    vendorPayoutInKobo,
                    `WHL_${wholesaleOrderId}_${Date.now()}`,
                    `Wholesale Order Settlement: ${wholesaleOrderId}`
                );

                if (transferResult.success) {
                    // Update transaction status to settled with transfer reference
                    batch.update(transactionRef, {
                        paystackTransferCode: transferResult.transferId,
                        settledAt: Timestamp.now(),
                    });

                    console.log(
                        `Immediate wholesale settlement successful for order ${wholesaleOrderId}, transfer: ${transferResult.transferId}`
                    );
                } else {
                    // Log settlement failure but don't fail the payment confirmation
                    console.error(
                        `Failed to transfer to vendor for order ${wholesaleOrderId}: ${transferResult.error}`
                    );
                    batch.update(transactionRef, {
                        settlementError: transferResult.error,
                        status: 'settlement_failed',
                    });
                }
            } catch (transferError) {
                console.error(`Error transferring funds for order ${wholesaleOrderId}:`, transferError);
                batch.update(transactionRef, {
                    settlementError: String(transferError),
                    status: 'settlement_failed',
                });
            }
        }

        // Commit all updates atomically
        await batch.commit();

        console.log(`Wholesale payment processed successfully: ${wholesaleOrderId}`);
        return { success: true };
    } catch (error) {
        console.error('Error in handleWholesalePayment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
