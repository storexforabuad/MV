import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app as firebaseApp } from './firebase'; // Assuming you have a firebase.ts for initialization
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export const requestNotificationPermission = async (storeId: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }

  console.log('[DEBUG] Checking VAPID Key:', VAPID_KEY ? 'Present' : 'Missing');

  if (!VAPID_KEY) {
    console.error('VAPID key not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local');
    return;
  }

  try {
    // First, register the Firebase messaging service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });

      console.log('Firebase messaging service worker registered:', registration);

      // Wait for service worker to be active
      await navigator.serviceWorker.ready;
      console.log('Service worker is ready');
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

          try {
            const db = getFirestore(firebaseApp);
            const storeRef = doc(db, 'stores', storeId);
            console.log('Saving FCM token to Firestore for store:', storeId);
            await setDoc(storeRef, { fcmToken: currentToken }, { merge: true });
            console.log('✅ FCM token saved to Firestore successfully!');
          } catch (saveError) {
            console.error('❌ Failed to save FCM token to Firestore:', saveError);
          }
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('Error in requestNotificationPermission:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messaging = getMessaging(firebaseApp);
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        resolve(payload);
      });
    }
  });
