import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

// Check if the service account key is available
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Initialize the app if it hasn't been initialized already
if (!admin.apps.length) {
  if (!serviceAccount) {
    console.error('Firebase admin initialization error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    } catch (e) {
      console.error('Firebase admin initialization error', e);
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

export { adminDb };
