'use server';

import { adminDb, messaging } from '@/lib/firebase-admin';

/**
 * Sends a push notification to a customer when their order status is updated.
 * 
 * @param customerId - The customer ID to send notification to
 * @param orderId - The order ID that was updated
 * @param storeName - The name of the store
 * @param newStatus - The new status of the order ('ready' or 'partially-ready')
 * @returns Success or error status
 */
export async function sendCustomerNotification(
    customerId: string,
    orderId: string,
    storeName: string,
    newStatus: 'ready' | 'partially-ready'
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if Firebase Admin SDK is properly initialized
        if (!adminDb || !messaging) {
            console.error('Firebase Admin SDK not initialized. Cannot send notification.');
            return { success: false, error: 'Firebase Admin not initialized' };
        }

        // Get customer document to retrieve FCM token
        const customerDoc = await adminDb.collection('customers').doc(customerId).get();

        if (!customerDoc.exists) {
            console.error(`Customer ${customerId} not found`);
            return { success: false, error: 'Customer not found' };
        }

        const customerData = customerDoc.data();
        const fcmToken = customerData?.fcmToken;

        // If customer hasn't granted notification permission yet, fail silently
        if (!fcmToken) {
            console.log(`No FCM token found for customer ${customerId}. Customer may not have enabled notifications.`);
            return { success: false, error: 'No FCM token' };
        }

        // Create shortened order ID for display (last 6 characters)
        const shortOrderId = orderId.slice(-6);

        // Get storeId and deliveryMethod from order
        const orderDoc = await adminDb.collection('customers').doc(customerId).collection('orders').doc(orderId).get();
        const orderData = orderDoc.data();
        const storeId = orderData?.storeMeta?.id || '';
        const deliveryMethod = orderData?.deliveryMethod || 'home'; // Default to home if missing

        // Create notification message based on status and delivery method
        let notificationBody = '';
        if (newStatus === 'ready') {
            if (deliveryMethod === 'pickup') {
                notificationBody = `Your order from ${storeName} is ready for pickup! #${shortOrderId}`;
            } else {
                notificationBody = `Your order from ${storeName} has been shipped! #${shortOrderId}`;
            }
        } else {
            notificationBody = `Parts of your order from ${storeName} are ready! #${shortOrderId}`;
        }

        // Construct deep link URL with query parameters
        // Use tinyurl format as requested
        const deepLinkUrl = `https://tinyurl.com/bizconnet/${storeId}?open=orders&orderId=${orderId}`;

        // Send notification via FCM
        const message = {
            token: fcmToken,
            notification: {
                title: '📦 Order Update!',
                body: notificationBody,
            },
            data: {
                type: 'order_status_update',
                customerId,
                orderId,
                storeId,
                newStatus,
                url: deepLinkUrl,
            },
            webpush: {
                notification: {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                    tag: orderId, // Unique tag per order
                    requireInteraction: true, // Keep notification visible until clicked
                },
            },
        };

        await messaging.send(message);

        console.log(`✅ Push notification sent successfully to customer ${customerId} for order ${orderId}`);
        return { success: true };

    } catch (error: any) {
        console.error('Error sending customer notification:', error);

        // Handle specific FCM errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            console.error(`FCM token for customer ${customerId} is invalid or expired. Removing token.`);

            // Clean up invalid token
            if (adminDb) {
                try {
                    await adminDb.collection('customers').doc(customerId).update({
                        fcmToken: null
                    });
                } catch (cleanupError) {
                    console.error('Failed to cleanup invalid FCM token:', cleanupError);
                }
            }
        }

        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}
