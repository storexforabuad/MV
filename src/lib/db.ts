import { db, storage } from './firebase';
import { FirebaseError } from 'firebase/app';
import { StockNotification } from '../types/stockNotification';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  setDoc,
  Timestamp,
  collectionGroup,
  startAfter,
  DocumentSnapshot,
  DocumentData,
  Query,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product } from '../types/product';
import { StoreMeta } from '../types/store';
import { ensureProductType, isGeneralProduct } from '../utils/productHelpers';
import { stripUndefined } from '../utils/sanitize';

// Re-export order actions from the new location
export {
  addOrderToFirestore,
  fetchStoreOrders,
} from '../app/actions/orderActions';
export type { StoreOrder } from '../app/actions/orderActions';


export { db };

// Define types for the contact data
export interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  specialization: string;
}

export interface WholesaleData {
  id: string;
  name: string;
  contacts: Contact[];
}

// Type for paginated product results
export interface PaginatedProductsResult {
  products: Product[];
  lastVisible: DocumentSnapshot | null;
}

const transformProductData = (data: DocumentData): Product => {
  const product: Record<string, unknown> = { ...data };

  // Convert Timestamps to ISO strings
  for (const key in product) {
    if (product[key] instanceof Timestamp) {
      product[key] = (product[key] as Timestamp).toDate().toISOString();
    }
  }

  if (product.onPromo && product.promoPrice) {
    product.originalPrice = product.price;
    product.price = product.promoPrice;
  }
  return product as unknown as Product;
};


function assertDb() {
  if (!db) throw new Error('Firestore db is not initialized. Check your Firebase config and imports.');
}

// Create a new store (vendor) and seed default categories/products
export async function createStore(store: { id: string; name: string; whatsapp?: string; description?: string }): Promise<void> {
  try {
    const storeRef = doc(db, 'stores', store.id);
    await setDoc(storeRef, {
      name: store.name,
      createdAt: serverTimestamp(),
      whatsapp: store.whatsapp || '',
      description: store.description || '',
    });
    // Seed default categories if not present
    const categoriesRef = collection(db, 'stores', store.id, 'categories');
    const snapshot = await getDocs(categoriesRef);
    if (snapshot.empty) {
      await addDoc(categoriesRef, { name: 'Promo', createdAt: serverTimestamp() });
      await addDoc(categoriesRef, { name: 'New Arrivals', createdAt: serverTimestamp() });
    }
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
}

// Update store metadata
export async function updateStore(storeId: string, data: Partial<StoreMeta>): Promise<void> {
  try {
    const storeRef = doc(db, 'stores', storeId);
    await updateDoc(storeRef, data);
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
}

// Get all stores
export async function getStores(): Promise<StoreMeta[]> {
  try {
    const storesRef = collection(db, 'stores');
    const snapshot = await getDocs(storesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StoreMeta[];
  } catch (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
}

// Ensure default store exists (e.g., 'alaniq')
export async function ensureDefaultStore(): Promise<void> {
  const defaultStoreId = 'alaniq';
  const defaultStoreName = 'Alaniq';
  const storeRef = doc(db, 'stores', defaultStoreId);
  const storeSnap = await getDoc(storeRef);
  if (!storeSnap.exists()) {
    await createStore({ id: defaultStoreId, name: defaultStoreName, description: 'Your favorite online store' });
  }
}

// Fetch store metadata by storeId
export async function getStoreMeta(storeId: string): Promise<StoreMeta | null> {
  try {
    const storeRef = doc(db, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);
    if (!storeSnap.exists()) return null;
    return { id: storeSnap.id, ...storeSnap.data() } as StoreMeta;
  } catch (error) {
    console.error('Error fetching store meta:', error);
    return null;
  }
}

import { syncDropshippedProductsInventory } from '../app/actions/wholesaleActions';

export async function updateProduct(storeId: string, productId: string, data: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, 'stores', storeId, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const currentData = productSnap.data();

      // Sanitize the data to remove undefined fields
      const sanitizedData = { ...data };
      (Object.keys(sanitizedData) as Array<keyof typeof sanitizedData>).forEach(key => {
        if (sanitizedData[key] === undefined) {
          delete sanitizedData[key];
        }
      });

      // Type-specific logic for "back in stock"
      const currentProduct = ensureProductType({ ...currentData, id: productId });

      if (isGeneralProduct(currentProduct)) {
        // Only general products have soldOut/backInStock logic
        const generalUpdateData = data as Partial<import('../types/product').GeneralProduct>;

        if (currentData.soldOut === true && generalUpdateData.soldOut === false) {
          (sanitizedData as any).backInStock = true;
          await handleBackInStock(storeId, productId);
        }
      }

      await updateDoc(productRef, sanitizedData);

      // --- B2B Dropshipping Sync ---
      // If inventory-related fields are updated, sync them to all resellers who copied this product.
      const syncFields: any = {};
      if ('soldOut' in sanitizedData) syncFields.soldOut = sanitizedData.soldOut;
      if ('limitedStock' in sanitizedData) syncFields.limitedStock = sanitizedData.limitedStock;
      if ('quantity' in sanitizedData) syncFields.quantity = sanitizedData.quantity;
      if ('stock' in sanitizedData) syncFields.stock = (sanitizedData as any).stock;

      if (Object.keys(syncFields).length > 0) {
        // Fire and forget, or await to gracefully handle
        syncDropshippedProductsInventory(productId, syncFields).catch(err => {
          console.error('[Dropship Sync] Failed to sync inventory for', productId, err);
        });
      }
    }
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function addProduct(storeId: string, product: Omit<Product, 'id'>): Promise<string> {
  try {
    const productsRef = collection(db, 'stores', storeId, 'products');

    // Ensure productType is set (fallback for safety)
    const productWithType = {
      ...product,
      productType: product.productType || 'general'
    };

    const sanitized = stripUndefined(productWithType);
    const docRef = await addDoc(productsRef, {
      ...sanitized,
      createdAt: serverTimestamp(),
      views: 0
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

async function handleBackInStock(storeId: string, productId: string): Promise<void> {
  try {
    const notifications = await getStockNotificationsForProduct(productId);
    const product = await getProductById(storeId, productId);
    if (!product) return;

    const notificationPromises = notifications.map(async (notification) => {
      try {
        if (!notification.pushSubscription) return;

        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: notification.pushSubscription,
            message: {
              text: `${product.name} is back in stock!`,
              productId: productId
            }
          }),
        });

        await updateNotificationStatus(notification.id!, 'sent');
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    });

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error handling back in stock:', error);
  }
}

export async function hasUserRegisteredForNotification(
  productId: string,
  deviceInfo: { userAgent: string; platform: string; language: string }
): Promise<boolean> {
  try {
    const stockNotificationsRef = collection(db, 'stockNotifications');
    const q = query(
      stockNotificationsRef,
      where('productId', '==', productId),
      where('deviceInfo.userAgent', '==', deviceInfo.userAgent),
      where('deviceInfo.platform', '==', deviceInfo.platform),
      where('deviceInfo.language', '==', deviceInfo.language),
      where('notificationStatus', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking notification registration:', error);
    return false;
  }
}

export async function createStockNotification(
  notification: Omit<StockNotification, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const stockNotificationsRef = collection(db, 'stockNotifications');
    const docRef = await addDoc(stockNotificationsRef, {
      ...notification,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating stock notification:', error);
    throw error;
  }
}

export async function getStockNotificationsForProduct(productId: string): Promise<StockNotification[]> {
  try {
    const stockNotificationsRef = collection(db, 'stockNotifications');
    const q = query(
      stockNotificationsRef,
      where('productId', '==', productId),
      where('notificationStatus', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StockNotification[];
  } catch (error) {
    console.error('Error getting stock notifications:', error);
    return [];
  }
}

export async function updateNotificationStatus(
  notificationId: string,
  status: 'sent' | 'pending'
): Promise<void> {
  try {
    const notificationRef = doc(db, 'stockNotifications', notificationId);
    await updateDoc(notificationRef, {
      notificationStatus: status
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    throw error;
  }
}

export async function getProducts(storeId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'stores', storeId, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const transformedData = transformProductData(data);
      return {
        ...transformedData,
        id: doc.id,
      } as Product;
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductsByCategory(storeId: string, categoryId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'stores', storeId, 'products');
    const q = query(
      productsRef,
      where('categoryId', '==', categoryId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const transformedData = transformProductData(data);
      return {
        ...transformedData,
        id: doc.id,
      } as Product;
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

// Overload getProductById: If storeId is null, it will search globally.
export async function getProductById(storeId: string, id: string): Promise<Product | null>;
export async function getProductById(storeId: null, id: string): Promise<Product | null>;
export async function getProductById(storeId: string | null, id: string): Promise<Product | null> {
  assertDb();
  if (!id) {
    console.error('Missing product id');
    return null;
  }

  try {
    let productData;
    // Case 1: Global search (for /bizcon)
    if (storeId === null) {
      const productsRef = collectionGroup(db, 'products');
      const q = query(productsRef, where('id', '==', id), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const productDoc = snapshot.docs[0];
      productData = { ...productDoc.data(), id: productDoc.id, storeId: productDoc.ref.parent.parent?.id };

      // Increment views for global discovery
      await updateDoc(productDoc.ref, { views: increment(1) });

    } else {
      // Case 2: Store-specific search (original functionality)
      const productRef = doc(db, 'stores', storeId, 'products', id);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        return null;
      }
      productData = { id: productSnap.id, ...productSnap.data() };
    }

    return transformProductData(productData) as Product;

  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function deleteProduct(storeId: string, id: string): Promise<void> {
  try {
    const productRef = doc(db, 'stores', storeId, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
  }
}

export async function uploadImage(file: File): Promise<string> {
  try {
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function getCategories(storeId: string): Promise<{ id: string, name: string }[]> {
  try {
    const categoriesRef = collection(db, 'stores', storeId, 'categories');
    const snapshot = await getDocs(categoriesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as { id: string, name: string }[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function addCategory(storeId: string, name: string): Promise<{ id: string; name: string }> {
  try {
    const categoriesRef = collection(db, 'stores', storeId, 'categories');
    const docRef = await addDoc(categoriesRef, {
      name,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, name };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

export async function updateCategory(storeId: string, id: string, name: string): Promise<void> {
  try {
    const categoryRef = doc(db, 'stores', storeId, 'categories', id);
    await updateDoc(categoryRef, {
      name,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating category:', error);
  }
}

export async function deleteCategory(storeId: string, id: string): Promise<void> {
  try {
    const categoryRef = doc(db, 'stores', storeId, 'categories', id);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
  }
}

export async function getPopularProducts(storeId: string, limitCount: number = 6): Promise<Product[]> {
  if (!storeId) {
    console.error('Missing storeId in getPopularProducts');
    return [];
  }
  assertDb();
  try {
    const productsRef = collection(db, 'stores', storeId, 'products');
    const q = query(productsRef, orderBy('views', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const transformedData = transformProductData(data);
      return {
        ...transformedData,
        id: doc.id,
      } as Product;
    });
  } catch (error) {
    console.error('Error fetching popular products:', error);
    return [];
  }
}

export async function getContacts(storeId: string): Promise<WholesaleData[]> {
  if (!storeId) {
    console.error('Missing storeId in getContacts');
    return [];
  }
  assertDb();
  try {
    const contactsRef = collection(db, 'stores', storeId, 'contacts');
    const q = query(contactsRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WholesaleData));
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}

export async function addContact(storeId: string, contact: Omit<Contact, 'id'>): Promise<string> {
  if (!storeId) {
    throw new Error('Missing storeId. Cannot add contact.');
  }
  assertDb();
  try {
    const contactsRef = collection(db, 'stores', storeId, 'contacts');
    const docRef = await addDoc(contactsRef, {
      ...contact,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
}

export async function incrementProductViews(storeId: string, productId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyMetricsRef = doc(db, 'stores', storeId, 'dailyMetrics', today);

    const productRef = doc(db, 'stores', storeId, 'products', productId);
    const storeRef = doc(db, 'stores', storeId);
    const batch = writeBatch(db);

    // Increment product views
    batch.update(productRef, {
      views: increment(1),
      lastViewed: serverTimestamp()
    });

    // Increment total store views
    batch.update(storeRef, {
      totalViews: increment(1)
    });

    // Increment daily views
    batch.set(dailyMetricsRef, {
      views: increment(1),
      date: today
    }, { merge: true });

    await batch.commit();

  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error('[PROD] Firebase error incrementing views:', {
        message: error.message,
        code: error.code,
        storeId,
        productId
      });
    } else if (error instanceof Error) {
      console.error('[PROD] Error incrementing views:', {
        message: error.message,
        storeId,
        productId
      });
    } else {
      console.error('[PROD] Unknown error incrementing views:', {
        error,
        storeId,
        productId
      });
    }
  }
}

export async function incrementStorePageViews(storeId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyMetricsRef = doc(db, 'stores', storeId, 'dailyMetrics', today);
    const storeRef = doc(db, 'stores', storeId);
    const batch = writeBatch(db);

    // Increment store page views on the store document
    batch.update(storeRef, {
      storePageViews: increment(1),
      lastVisited: serverTimestamp()
    });

    // Increment daily store page views
    batch.set(dailyMetricsRef, {
      storePageViews: increment(1),
      date: today
    }, { merge: true });

    await batch.commit();

  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error('[STORE] Firebase error incrementing store page views:', {
        message: error.message,
        code: error.code,
        storeId,
      });
    } else {
      console.error('[STORE] Error incrementing store page views:', error);
    }
  }
}



async function executePaginatedQuery(q: Query): Promise<PaginatedProductsResult> {
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => {
    const data = doc.data();
    const transformedData = transformProductData(data);
    return {
      ...transformedData,
      id: doc.id,
      storeId: doc.ref.parent.parent?.id,
    } as Product;
  });
  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { products, lastVisible };
}

export async function getGlobalPromoProducts(lastDoc: DocumentSnapshot | null = null, pageSize = 24): Promise<PaginatedProductsResult> {
  assertDb();
  try {
    const productsRef = collectionGroup(db, 'products');
    let q = query(
      productsRef,
      where('originalPrice', '>', 0),
      orderBy('views', 'desc'),
      limit(pageSize)
    );
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    return await executePaginatedQuery(q);
  } catch (error) {
    console.error("Error fetching global promo products:", error);
    return { products: [], lastVisible: null };
  }
}

export async function getAllProductsByCategory(categoryName: string, lastDoc: DocumentSnapshot | null = null, pageSize = 24): Promise<PaginatedProductsResult> {
  assertDb();
  try {
    const productsRef = collectionGroup(db, 'products');
    let q = query(
      productsRef,
      where('category', '==', categoryName),
      orderBy('views', 'desc'),
      limit(pageSize)
    );
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    return await executePaginatedQuery(q);
  } catch (error) {
    console.error(`Error fetching global products for category ${categoryName}:`, error);
    return { products: [], lastVisible: null };
  }
}

export async function getGlobalNewestProducts(lastDoc: DocumentSnapshot | null = null, pageSize = 24): Promise<PaginatedProductsResult> {
  assertDb();
  try {
    const productsRef = collectionGroup(db, 'products');
    let q = query(
      productsRef,
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    return await executePaginatedQuery(q);
  } catch (error) {
    console.error('Error fetching global newest products:', error);
    return { products: [], lastVisible: null };
  }
}

export async function getGlobalPopularProducts(lastDoc: DocumentSnapshot | null = null, pageSize = 24): Promise<PaginatedProductsResult> {
  assertDb();
  try {
    const productsRef = collectionGroup(db, 'products');
    let q = query(
      productsRef,
      orderBy('views', 'desc'),
      limit(pageSize)
    );
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    return await executePaginatedQuery(q);
  } catch (error) {
    console.error('Error fetching global popular products:', error);
    return { products: [], lastVisible: null };
  }
}

export async function getStorePopularProducts(storeId: string, lastDoc: DocumentSnapshot | null = null, pageSize = 24): Promise<PaginatedProductsResult> {
  if (!storeId) return { products: [], lastVisible: null };
  assertDb();
  try {
    const productsRef = collection(db, 'stores', storeId, 'products');
    let q = query(
      productsRef,
      orderBy('views', 'desc'),
      limit(pageSize)
    );
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    return await executePaginatedQuery(q);
  } catch (error) {
    console.error(`Error fetching popular products for store ${storeId}:`, error);
    return { products: [], lastVisible: null };
  }
}


/**
 * Aggregates all unique categories across all stores and sorts them by popularity (sum of product views).
 */
export async function getPopularCategories(): Promise<{ id: string; name: string }[]> {
  assertDb();
  try {
    const productsRef = collectionGroup(db, 'products');
    const snapshot = await getDocs(productsRef);
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return transformProductData(data) as Product;
    });

    const categoryViews: { [key: string]: number } = {};

    products.forEach(product => {
      const typedProduct = ensureProductType(product);
      if (isGeneralProduct(typedProduct) && typedProduct.category) {
        if (!categoryViews[typedProduct.category]) {
          categoryViews[typedProduct.category] = 0;
        }
        categoryViews[typedProduct.category] += typedProduct.views || 0;
      }
    });

    const sortedCategories = Object.entries(categoryViews)
      .sort(([, viewsA], [, viewsB]) => viewsB - viewsA)
      .map(([name]) => ({ id: name, name: name }));

    return sortedCategories;
  } catch (error) {
    console.error("Error fetching popular categories:", error);
    return [];
  }
}

export async function saveSharedWishlist(items: any[]): Promise<string> {
  assertDb();
  try {
    const sharedRef = collection(db, 'sharedWishlists');
    const sanitizedItems = stripUndefined(items);
    const docRef = await addDoc(sharedRef, {
      items: sanitizedItems,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving shared wishlist:', error);
    throw error;
  }
}

export async function getSharedWishlist(id: string): Promise<{ items: any[]; createdAt: Timestamp } | null> {
  assertDb();
  try {
    const docRef = doc(db, 'sharedWishlists', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as { items: any[]; createdAt: Timestamp };
  } catch (error) {
    console.error('Error fetching shared wishlist:', error);
    return null;
  }
}
