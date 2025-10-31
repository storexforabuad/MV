import { adminDb } from './firebase-admin';
import { StoreMeta } from '../types/store';

export async function getStoreMetaAdmin(storeId: string): Promise<StoreMeta | null> {
  if (!adminDb) {
    console.error('Firebase Admin has not been initialized. Check your service account key.');
    return null;
  }
  try {
    const storeRef = adminDb.collection('stores').doc(storeId);
    const storeSnap = await storeRef.get();
    if (!storeSnap.exists) return null;
    return { id: storeSnap.id, ...storeSnap.data() } as StoreMeta;
  } catch (error) {
    console.error('Error fetching store meta from admin sdk:', error);
    return null;
  }
}
