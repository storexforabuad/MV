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
        // Support both new array format and legacy single token
        const tokens = new Set<string>();
        if (storeData?.fcmToken) tokens.add(storeData.fcmToken);
        if (storeData?.adminTokens && Array.isArray(storeData.adminTokens)) {
            storeData.adminTokens.forEach((t: string) => tokens.add(t));
        }

        const tokenList = Array.from(tokens);

        // If vendor hasn't granted notification permission yet, fail silently
        if (tokenList.length === 0) {
            console.log(`No FCM tokens found for store ${storeId}. Vendor may not have enabled notifications.`);
            return { success: false, error: 'No FCM tokens' };
        }

        // Create shortened order ID for display (last 6 characters)
        const shortOrderId = orderId.slice(-6);

        // Construct deep link URL with query parameters
        const deepLinkUrl = `https://tinyurl.com/atlasintl/admin/${storeId}?open=orders&orderId=${orderId}`;

        // Send notification via FCM Multicast
        const message = {
            tokens: tokenList,
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

        const response = await messaging.sendEachForMulticast(message);

        console.log(`✅ Push notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);

        // Cleanup invalid tokens
        if (response.failureCount > 0) {
            const invalidTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && (
                    resp.error?.code === 'messaging/invalid-registration-token' ||
                    resp.error?.code === 'messaging/registration-token-not-registered'
                )) {
                    invalidTokens.push(tokenList[idx]);
                }
            });

            if (invalidTokens.length > 0) {
                console.log(`Removing ${invalidTokens.length} invalid tokens`);
                try {
                    const { FieldValue } = require('firebase-admin/firestore');
                    await adminDb.collection('stores').doc(storeId).update({
                        adminTokens: FieldValue.arrayRemove(...invalidTokens),
                        // Also clear legacy token if it matches
                        ...(storeData?.fcmToken && invalidTokens.includes(storeData.fcmToken) ? { fcmToken: null } : {})
                    });
                } catch (cleanupError) {
                    console.error('Failed to cleanup invalid FCM tokens:', cleanupError);
                }
            }
        }

        return { success: true };

    } catch (error: any) {
        console.error('Error sending vendor notification:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}
