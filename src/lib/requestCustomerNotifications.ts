import { getMessaging, getToken } from 'firebase/messaging';
import { app as firebaseApp } from './firebase';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export const requestCustomerNotificationPermission = async (customerId: string): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return { success: false, error: 'Notifications not supported' };
    }

    if (!VAPID_KEY) {
        console.error('VAPID key not configured');
        return { success: false, error: 'Configuration error' };
    }

    try {
        // First, register the Firebase messaging service worker
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });

            // Wait for service worker to be active
            await navigator.serviceWorker.ready;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted.');

            const messaging = getMessaging(firebaseApp);

            try {
                const currentToken = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
                });

                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    const db = getFirestore(firebaseApp);
                    const customerRef = doc(db, 'customers', customerId);
                    await setDoc(customerRef, { fcmToken: currentToken }, { merge: true });
                    console.log('Customer FCM token saved to Firestore.');
                    return { success: true };
                } else {
                    console.log('No registration token available.');
                    return { success: false, error: 'No token available' };
                }
            } catch (err) {
                console.error('An error occurred while retrieving token.', err);
                return { success: false, error: 'Token retrieval failed' };
            }
        } else {
            console.log('Notification permission denied.');
            return { success: false, error: 'Permission denied' };
        }
    } catch (error) {
        console.error('Error in requestCustomerNotificationPermission:', error);
        return { success: false, error: 'Unknown error' };
    }
};
