import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app as firebaseApp } from './firebase'; // Assuming you have a firebase.ts for initialization
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const VAPID_KEY = 'YOUR_VAPID_KEY'; // Replace with your VAPID key from Firebase project settings

export const requestNotificationPermission = async (storeId: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }

  const messaging = getMessaging(firebaseApp);
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    console.log('Notification permission granted.');
    try {
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        const db = getFirestore(firebaseApp);
        const storeRef = doc(db, 'stores', storeId);
        await setDoc(storeRef, { fcmToken: currentToken }, { merge: true });
        console.log('FCM token saved to Firestore.');
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
    }
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
