import { adminDb } from './firebase-admin';
import { StoreMeta } from '../types/store';
import { Product } from '../types/product';
import { WholesaleData } from './db';
import { unstable_cache } from 'next/cache';

// Helper to recursively transform Admin Firestore data (serializing timestamps)
const sanitizeData = (data: any): any => {
  if (data === null || data === undefined) return data;

  // Handle Firestore Timestamps (check for toDate method)
  if (typeof data === 'object' && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Handle Objects
  if (typeof data === 'object') {
    const transformed: any = {};
    for (const key in data) {
      transformed[key] = sanitizeData(data[key]);
    }
    return transformed;
  }

  // Return primitive values as is
  return data;
};

export async function getStoreMetaAdmin(storeId: string): Promise<StoreMeta | null> {
  if (!adminDb) {
    console.error('Firebase Admin has not been initialized. Check your service account key.');
    return null;
  }
  try {
    const storeRef = adminDb.collection('stores').doc(storeId);
    const storeSnap = await storeRef.get();
    if (!storeSnap.exists) return null;
    return sanitizeData({ id: storeSnap.id, ...storeSnap.data() }) as StoreMeta;
  } catch (error) {
    console.error('Error fetching store meta from admin sdk:', error);
    return null;
  }
}

export async function getProductsAdmin(storeId: string): Promise<Product[]> {
  if (!adminDb) return [];
  try {
    const productsRef = adminDb.collection('stores').doc(storeId).collection('products').orderBy('createdAt', 'desc');
    const snapshot = await productsRef.get();
    return snapshot.docs.map(doc => {
      const data = sanitizeData({ id: doc.id, ...doc.data() });
      // Handle promo price logic similar to client SDK
      if (data.onPromo && data.promoPrice) {
        data.originalPrice = data.price;
        data.price = data.promoPrice;
      }
      return data as Product;
    });
  } catch (error) {
    console.error('Error fetching products admin:', error);
    return [];
  }
}

export async function getCategoriesAdmin(storeId: string): Promise<{ id: string, name: string }[]> {
  if (!adminDb) return [];
  try {
    const categoriesRef = adminDb.collection('stores').doc(storeId).collection('categories');
    const snapshot = await categoriesRef.get();
    return snapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }) as { id: string, name: string });
  } catch (error) {
    console.error('Error fetching categories admin:', error);
    return [];
  }
}

export async function getContactsAdmin(storeId: string): Promise<WholesaleData[]> {
  if (!adminDb) return [];
  try {
    const contactsRef = adminDb.collection('stores').doc(storeId).collection('contacts').orderBy('name', 'asc');
    const snapshot = await contactsRef.get();
    return snapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }) as WholesaleData);
  } catch (error) {
    console.error('Error fetching contacts admin:', error);
    return [];
  }
}

export async function getReferralsAdmin(storeId: string): Promise<any[]> {
  if (!adminDb) return [];
  try {
    const referralsRef = adminDb.collection('stores').doc(storeId).collection('referrals');
    const snapshot = await referralsRef.get();
    return snapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching referrals admin:', error);
    return [];
  }
}

export const getStoreMetaAdminCached = unstable_cache(
  async (storeId: string) => getStoreMetaAdmin(storeId),
  ['store-meta'],
  { revalidate: 300, tags: ['store-meta'] }
);

export const getCategoriesAdminCached = unstable_cache(
  async (storeId: string) => getCategoriesAdmin(storeId),
  ['store-categories'],
  { revalidate: 300, tags: ['store-categories'] }
);

export const getPromoProductsAdmin = unstable_cache(
  async (storeId: string, limitCount: number = 24) => {
    if (!adminDb) return [];
    try {
      const productsRef = adminDb.collection('stores').doc(storeId).collection('products');
      // Note: In a real app, you'd want a composite index for this query.
      // For now, we'll fetch recent products and filter in memory if needed, 
      // or rely on the fact that we're caching the result.
      // Ideally: .where('onPromo', '==', true).orderBy('createdAt', 'desc').limit(limitCount)

      const snapshot = await productsRef
        .orderBy('createdAt', 'desc')
        .limit(100) // Fetch more to filter in memory if index is missing
        .get();

      const products = snapshot.docs
        .map(doc => {
          const data = sanitizeData({ id: doc.id, ...doc.data() });
          if (data.onPromo && data.promoPrice) {
            data.originalPrice = data.price;
            data.price = data.promoPrice;
          }
          return data as Product;
        })
        .filter(p => p.onPromo === true) // Filter for promo
        .slice(0, limitCount);

      return products;
    } catch (error) {
      console.error('Error fetching promo products admin:', error);
      return [];
    }
  },
  ['store-promo-products'],
  { revalidate: 300, tags: ['store-products'] }
);

export const getPopularProductsAdmin = unstable_cache(
  async (storeId: string, limitCount: number = 24) => {
    if (!adminDb) return [];
    try {
      const productsRef = adminDb.collection('stores').doc(storeId).collection('products');
      const snapshot = await productsRef.orderBy('views', 'desc').limit(limitCount).get();
      return snapshot.docs.map(doc => {
        const data = sanitizeData({ id: doc.id, ...doc.data() });
        if (data.onPromo && data.promoPrice) {
          data.originalPrice = data.price;
          data.price = data.promoPrice;
        }
        return data as Product;
      });
    } catch (error) {
      console.error('Error fetching popular products admin:', error);
      return [];
    }
  },
  ['store-popular-products'],
  { revalidate: 300, tags: ['store-products'] }
);

export const getProductsByCategoryAdmin = unstable_cache(
  async (storeId: string, categoryId: string, limitCount: number = 24) => {
    if (!adminDb) return [];
    try {
      const productsRef = adminDb.collection('stores').doc(storeId).collection('products');
      const snapshot = await productsRef
        .where('categoryId', '==', categoryId)
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();

      return snapshot.docs.map(doc => {
        const data = sanitizeData({ id: doc.id, ...doc.data() });
        if (data.onPromo && data.promoPrice) {
          data.originalPrice = data.price;
          data.price = data.promoPrice;
        }
        return data as Product;
      });
    } catch (error) {
      console.error('Error fetching products by category admin:', error);
      return [];
    }
  },
  ['store-category-products'],
  { revalidate: 300, tags: ['store-products'] }
);

export { adminDb };
