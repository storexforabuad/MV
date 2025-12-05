import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Check if the service account key is available
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Initialize the app if it hasn't been initialized already
if (!admin.apps.length) {
  if (!serviceAccount) {
    console.error('❌ Firebase admin initialization error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    console.error('ℹ️  Please ensure you have a .env.local file with FIREBASE_SERVICE_ACCOUNT_KEY defined.');
  } else {
    try {
      const parsedAccount = JSON.parse(serviceAccount);
      console.log('✅ Service account parsed successfully');
      console.log('ℹ️  Project ID:', parsedAccount.project_id);

      admin.initializeApp({
        credential: admin.credential.cert(parsedAccount),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (e) {
      console.error('❌ Firebase admin initialization error:', e);
      console.error('ℹ️  Make sure FIREBASE_SERVICE_ACCOUNT_KEY is valid JSON');
    }
  }
}

// We need a way to handle the case where initialization fails.
// Let's export a potentially null db and handle it in the calling code.
let adminDb: Firestore | null;
try {
  adminDb = admin.firestore();
} catch (e) {
  adminDb = null;
  console.error('Failed to get firestore instance from admin', e);
}

// Export messaging instance for push notifications
let messaging: ReturnType<typeof getMessaging> | null;
try {
  messaging = admin.apps.length > 0 ? getMessaging() : null;
} catch (e) {
  messaging = null;
  console.error('Failed to get messaging instance from admin', e);
}

export { adminDb, messaging };
