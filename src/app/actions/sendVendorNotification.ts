'use server';

import { adminDb, messaging } from '@/lib/firebase-admin';

/**
 * Sends a push notification to a vendor when a new order is placed.
 * Uses Firebase Cloud Messaging (FCM) via Firebase Admin SDK.
 * 
 * @param storeId - The store ID to send notification to
 * @param orderId - The order ID that was just created
 * @param customerName - The name of the customer who placed the order
 * @returns Success or error status
 */
export async function sendVendorNotification(
    storeId: string,
    orderId: string,
    customerName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if Firebase Admin SDK is properly initialized
        if (!adminDb || !messaging) {
            console.error('Firebase Admin SDK not initialized. Cannot send notification.');
            return { success: false, error: 'Firebase Admin not initialized' };
        }

        // Get store document to retrieve FCM token
        const storeDoc = await adminDb.collection('stores').doc(storeId).get();

        if (!storeDoc.exists) {
            console.error(`Store ${storeId} not found`);
            return { success: false, error: 'Store not found' };
        }

        const storeData = storeDoc.data();
        const fcmToken = storeData?.fcmToken;

        // If vendor hasn't granted notification permission yet, fail silently
        if (!fcmToken) {
            console.log(`No FCM token found for store ${storeId}. Vendor may not have enabled notifications.`);
            return { success: false, error: 'No FCM token' };
        }

        // Create shortened order ID for display (last 6 characters)
        const shortOrderId = orderId.slice(-6);

        // Construct deep link URL with query parameters
        const deepLinkUrl = `/admin/${storeId}?open=orders&orderId=${orderId}`;

        // Send notification via FCM
        const message = {
            token: fcmToken,
            notification: {
                title: '🛍️ New Order!',
                body: `${customerName} placed order #${shortOrderId}`,
            },
            data: {
                type: 'new_order',
                storeId,
                orderId,
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

        console.log(`✅ Push notification sent successfully to store ${storeId} for order ${orderId}`);
        return { success: true };

    } catch (error: any) {
        console.error('Error sending vendor notification:', error);

        // Handle specific FCM errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            console.error(`FCM token for store ${storeId} is invalid or expired. Removing token.`);

            // Clean up invalid token
            if (adminDb) {
                try {
                    await adminDb.collection('stores').doc(storeId).update({
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
