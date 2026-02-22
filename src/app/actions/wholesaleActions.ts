'use server';

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  Timestamp,
  writeBatch,
  QueryConstraint,
  orderBy,
  limit,
  increment,
  collectionGroup,
} from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';
import {
  WholesaleRequest,
  WholesalePartner,
  WholesaleOrder,
  WholesaleInvoice,
  WholesaleOrderItem,
} from '@/types/wholesale';
import { StoreMeta } from '@/types/store';
import { sendWholesaleRequestEmail } from '@/lib/resendEmail';

const db = getFirestore(firebaseApp);

/**
 * DEFAULT CONFIGURATIONS FOR BACKWARD COMPATIBILITY
 * These defaults are used when initializing wholesaleConfig for stores
 * created before the wholesale feature implementation.
 */
const DEFAULT_WHOLESALE_CONFIG = {
  isVisible: true,
  globalDiscount: 0,
  minOrderValue: 0,
  defaultPaymentTermsDays: 0 as const,
};

const DEFAULT_WHOLESALE_STATS = {
  activePartners: 0,
  monthlyWholesaleRevenue: 0,
  totalWholesaleOrders: 0,
  pendingSettlements: 0,
};

/**
 * Ensure store has wholesaleConfig (lazy initialization)
 * 
 * BACKWARD COMPATIBILITY:
 * Stores created before the wholesale feature may not have wholesaleConfig.
 * This function initializes it with defaults on first access if missing.
 * 
 * Called automatically by wholesale functions as a safety net.
 * Migration script (scripts/migrate-wholesale.mjs) should be run to bulk-initialize all stores.
 * 
 * @param storeId - The store ID to ensure has config
 * @returns true if store has config (was already there or just created), false on error
 */
async function ensureWholesaleConfig(storeId: string): Promise<boolean> {
  try {
    const storeRef = doc(db, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);

    if (!storeSnap.exists()) {
      return false;
    }

    const store = storeSnap.data() as StoreMeta;

    // Already has config - nothing to do
    if (store.wholesaleConfig) {
      return true;
    }

    // Initialize missing config
    console.warn(
      `⚠️ Lazy-initializing wholesaleConfig for store ${storeId}. ` +
      `Run: npm run migrate:wholesale`
    );

    await updateDoc(storeRef, {
      wholesaleConfig: DEFAULT_WHOLESALE_CONFIG,
      wholesaleStats: store.wholesaleStats || DEFAULT_WHOLESALE_STATS,
    });

    return true;
  } catch (error) {
    console.error(`Failed to ensure wholesaleConfig for ${storeId}:`, error);
    return false;
  }
}

/**
 * Send a wholesale request from one store to another (same storeType only)
 * 
 * Creates a partnership request that must be accepted by the receiving store.
 * Only stores of the same storeType can trade wholesale with each other.
 * 
 * @param fromStoreId - ID of store sending the request
 * @param toStoreId - ID of store receiving the request  
 * @param message - Optional message to include in the request
 * @returns {success: boolean, error?: string, requestId?: string}
 */
export async function sendWholesaleRequest(
  fromStoreId: string,
  toStoreId: string,
  message?: string
) {
  try {
    // Validate: not sending to self
    if (fromStoreId === toStoreId) {
      return { success: false, error: 'Cannot send request to your own store' };
    }

    // Get both stores to verify storeType and check visibility
    const fromStoreRef = doc(db, 'stores', fromStoreId);
    const toStoreRef = doc(db, 'stores', toStoreId);

    const [fromStoreSnap, toStoreSnap] = await Promise.all([
      getDoc(fromStoreRef),
      getDoc(toStoreRef),
    ]);

    if (!fromStoreSnap.exists() || !toStoreSnap.exists()) {
      return { success: false, error: 'One or both stores not found' };
    }

    const fromStore = fromStoreSnap.data() as StoreMeta;
    const toStore = toStoreSnap.data() as StoreMeta;

    // Validate: same storeType
    if (fromStore.storeType !== toStore.storeType) {
      return { success: false, error: 'Can only trade with stores of the same type' };
    }

    // Validate: target store must be wholesale vendor
    if (!toStore.isWholesaleVendor) {
      return { success: false, error: 'This store is not accepting wholesale orders' };
    }

    // Check for existing pending request
    const existingReq = await getDocs(
      query(
        collection(db, 'stores', fromStoreId, 'wholesaleRequests'),
        where('toStoreId', '==', toStoreId),
        where('status', '==', 'pending')
      )
    );

    if (!existingReq.empty) {
      return { success: false, error: 'You already have a pending request to this store' };
    }

    // Check if blocked (within 30 days)
    const blockedReq = await getDocs(
      query(
        collection(db, 'stores', fromStoreId, 'wholesaleRequests'),
        where('toStoreId', '==', toStoreId),
        where('status', '==', 'blocked')
      )
    );

    if (!blockedReq.empty) {
      const blocked = blockedReq.docs[0].data() as WholesaleRequest;
      if (blocked.blockedUntil && Timestamp.now() < blocked.blockedUntil) {
        return {
          success: false,
          error: `This store has blocked you until ${blocked.blockedUntil.toDate().toLocaleDateString()}`,
        };
      }
    }

    // Create request IDs
    const requestId = `${fromStoreId}_${toStoreId}_${Date.now()}`;

    const requestData = {
      id: requestId,
      fromStoreId,
      toStoreId,
      status: 'pending',
      message: message || '',
      createdAt: Timestamp.now(),
      respondedAt: null,
      blockedUntil: null,
    };

    // Write request in both stores (outgoing in from, incoming in to)
    const batch = writeBatch(db);

    batch.set(
      doc(db, 'stores', fromStoreId, 'wholesaleRequests', requestId),
      { ...requestData, direction: 'outgoing' }
    );

    batch.set(
      doc(db, 'stores', toStoreId, 'wholesaleRequests', requestId),
      { ...requestData, direction: 'incoming' }
    );

    await batch.commit();

    // Email feature disabled until API keys configured
    // Send email notification to recipient (async, non-blocking)
    // if (toStore.ceoEmail) {
    //   sendWholesaleRequestEmail({
    //     recipientEmail: toStore.ceoEmail,
    //     recipientName: toStore.name || 'Vendor',
    //     requesterName: fromStore.name || 'Unknown Store',
    //     requesterStoreType: fromStore.storeType || 'Unknown',
    //     requesterLocation: fromStore.streetAddress,
    //     message,
    //     requestId,
    //   }).catch((error) => {
    //     console.error('Error sending wholesale request email:', error);
    //     // Don't fail the request creation if email fails
    //   });
    // }

    return { success: true, requestId };
  } catch (error) {
    console.error('Error sending wholesale request:', error);
    return { success: false, error: 'Failed to send request' };
  }
}

/**
 * Accept a wholesale request - creates partnership
 */
export async function acceptWholesaleRequest(requestId: string, storeId: string) {
  try {
    const reqRef = doc(db, 'stores', storeId, 'wholesaleRequests', requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return { success: false, error: 'Request not found' };
    }

    const request = reqSnap.data() as WholesaleRequest;

    if (request.direction !== 'incoming') {
      return { success: false, error: 'You can only accept incoming requests' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: `Request is already ${request.status}` };
    }

    const batch = writeBatch(db);

    // Update request to accepted in both stores
    const acceptedData = {
      status: 'accepted' as const,
      respondedAt: Timestamp.now(),
    };

    batch.update(
      doc(db, 'stores', storeId, 'wholesaleRequests', requestId),
      acceptedData
    );

    batch.update(
      doc(db, 'stores', request.fromStoreId, 'wholesaleRequests', requestId),
      acceptedData
    );

    // Create partnership in both stores
    const partnershipId = `${request.fromStoreId}_${request.toStoreId}`;

    // Get both stores' data for enriching partnership records
    const [fromStoreSnap, toStoreSnap] = await Promise.all([
      getDoc(doc(db, 'stores', request.fromStoreId)),
      getDoc(doc(db, 'stores', storeId)),
    ]);

    const fromStore = fromStoreSnap.data() as StoreMeta | undefined;
    const toStore = toStoreSnap.data() as StoreMeta | undefined;

    // For receiver (toStoreId) - fromStoreId becomes a partner buying from them
    const toStorePartnerRef = doc(
      db,
      'stores',
      storeId,
      'wholesalePartners',
      request.fromStoreId
    );
    batch.set(toStorePartnerRef, {
      id: request.fromStoreId,
      partnerId: request.fromStoreId,
      partnerStoreId: request.fromStoreId,
      partnerStoreName: fromStore?.name || 'Store',
      storeType: fromStore?.storeType || fromStore?.category?.[0],
      status: 'active',
      connectedAt: Timestamp.now(),
      totalOrders: 0,
      totalRevenue: 0,
      lastOrderDate: null,
      wholesaleConfig: fromStore?.wholesaleConfig,
    });

    // For requester (fromStoreId) - toStoreId becomes their wholesale supplier
    const fromStorePartnerRef = doc(
      db,
      'stores',
      request.fromStoreId,
      'wholesalePartners',
      storeId
    );

    batch.set(fromStorePartnerRef, {
      id: storeId,
      partnerId: storeId,
      partnerStoreId: storeId,
      partnerStoreName: toStore?.name || 'Store',
      storeType: toStore?.storeType || toStore?.category?.[0],
      status: 'active',
      connectedAt: Timestamp.now(),
      totalOrders: 0,
      totalRevenue: 0,
      lastOrderDate: null,
      wholesaleConfig: toStore?.wholesaleConfig,
    });

    await batch.commit();

    return { success: true, partnerId: request.fromStoreId };
  } catch (error) {
    console.error('Error accepting wholesale request:', error);
    return { success: false, error: 'Failed to accept request' };
  }
}

/**
 * Reject a wholesale request
 */
export async function rejectWholesaleRequest(requestId: string, storeId: string) {
  try {
    const reqRef = doc(db, 'stores', storeId, 'wholesaleRequests', requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return { success: false, error: 'Request not found' };
    }

    const request = reqSnap.data() as WholesaleRequest;

    if (request.direction !== 'incoming') {
      return { success: false, error: 'You can only reject incoming requests' };
    }

    const batch = writeBatch(db);

    const rejectedData = {
      status: 'rejected' as const,
      respondedAt: Timestamp.now(),
    };

    batch.update(
      doc(db, 'stores', storeId, 'wholesaleRequests', requestId),
      rejectedData
    );

    batch.update(
      doc(db, 'stores', request.fromStoreId, 'wholesaleRequests', requestId),
      rejectedData
    );

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error rejecting wholesale request:', error);
    return { success: false, error: 'Failed to reject request' };
  }
}

/**
 * Block a wholesale request and prevent future requests for 30 days
 */
export async function blockWholesaleRequest(requestId: string, storeId: string) {
  try {
    const reqRef = doc(db, 'stores', storeId, 'wholesaleRequests', requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return { success: false, error: 'Request not found' };
    }

    const request = reqSnap.data() as WholesaleRequest;

    if (request.direction !== 'incoming') {
      return { success: false, error: 'You can only block incoming requests' };
    }

    const blockedUntil = Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    const batch = writeBatch(db);

    const blockedData = {
      status: 'blocked' as const,
      blockedUntil,
      respondedAt: Timestamp.now(),
    };

    batch.update(
      doc(db, 'stores', storeId, 'wholesaleRequests', requestId),
      blockedData
    );

    batch.update(
      doc(db, 'stores', request.fromStoreId, 'wholesaleRequests', requestId),
      blockedData
    );

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error blocking wholesale request:', error);
    return { success: false, error: 'Failed to block request' };
  }
}

/**
 * Get all discoverable stores for wholesale (same storeType, visible, not partners)
 * 
 * BACKWARD COMPATIBILITY:
 * Query only fetches stores with storeType and isWholesaleVendor=true.
 * Visibility filtering happens client-side with defaults (isVisible ?? true)
 * to support stores created before wholesaleConfig existed.
 * 
 * FIRESTORE INDEXES REQUIRED:
 * 1. Composite Index: storeType (Asc) + isWholesaleVendor (Asc)
 *    - Created via migration script: npm run migrate:wholesale
 * 2. Optional: storeType (Asc) + isWholesaleVendor (Asc) + wholesaleConfig.isVisible (Asc)
 *    - Only needed if we switch to server-side visibility filtering
 * 
 * Migration script outputs clickable Firebase Console links to auto-generate indexes.
 */
export async function getDiscoverableStores(
  storeId: string,
  searchQuery?: string,
  sortBy: 'rating' | 'products' | 'orders' | 'location' = 'products'
) {
  try {
    const storeRef = doc(db, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);

    if (!storeSnap.exists()) {
      return { success: false, error: 'Store not found' };
    }

    const store = storeSnap.data() as StoreMeta;

    // Ensure store has wholesaleConfig (lazy init safety net)
    await ensureWholesaleConfig(storeId);

    // BACKWARD COMPATIBLE QUERY:
    // Query only storeType and isWholesaleVendor (don't filter by wholesaleConfig.isVisible)
    // This allows old stores without wholesaleConfig to be discovered.
    // Visibility filtering happens below with safe defaults.
    const constraints: QueryConstraint[] = [
      where('storeType', '==', store.storeType),
      where('isWholesaleVendor', '==', true),
    ];

    const storesSnap = await getDocs(query(collection(db, 'stores'), ...constraints));

    // Map with ID field for React key stability, and ensure ID exists
    let stores = storesSnap.docs
      .map((docSnap) => {
        const data = docSnap.data() as StoreMeta;
        return {
          ...data,
          id: docSnap.id, // Ensure ID is set from document reference
        };
      })
      .filter((s) => {
        // Exclude self
        if (s.id === storeId) return false;

        // BACKWARD COMPATIBILITY: Default to visible if wholesaleConfig doesn't exist
        // This allows stores created before the feature to appear in discovery
        const isVisible = s.wholesaleConfig?.isVisible ?? true;
        return isVisible;
      });

    // Get existing partners to filter out
    const partnersSnap = await getDocs(
      collection(db, 'stores', storeId, 'wholesalePartners')
    );
    const partnerIds = new Set(partnersSnap.docs.map((doc) => doc.id));

    stores = stores.filter((s) => !partnerIds.has(s.id));

    // Get blocked vendors (within 30 days)
    const blockedSnap = await getDocs(
      query(
        collection(db, 'stores', storeId, 'wholesaleRequests'),
        where('status', '==', 'blocked')
      )
    );

    const blockedIds = new Set(
      blockedSnap.docs
        .map((doc) => doc.data() as WholesaleRequest)
        .filter((req) => req.blockedUntil && Timestamp.now() < req.blockedUntil)
        .map((req) => req.toStoreId)
    );

    stores = stores.filter((s) => !blockedIds.has(s.id));

    // Filter by search query (with null-safety for optional fields)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      stores = stores.filter(
        (s) =>
          (s.name?.toLowerCase() || '').includes(q) ||
          (s.businessDescription?.toLowerCase() || '').includes(q) ||
          (s.state?.toLowerCase() || '').includes(q)
      );
    }

    // Sort by specified criteria
    switch (sortBy) {
      case 'rating':
        // TODO: Implement actual rating logic when rating system is available
        break;
      case 'products':
        stores.sort((a, b) => (b.products?.length || 0) - (a.products?.length || 0));
        break;
      case 'orders':
        stores.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
        break;
      case 'location':
        stores.sort((a, b) => (a.state || '').localeCompare(b.state || ''));
        break;
    }

    return { success: true, stores };
  } catch (error) {
    console.error('Error getting discoverable stores:', error);
    return { success: false, error: 'Failed to fetch stores' };
  }
}
/**
 * Get all wholesale partners for a store
 * 
 * Fetches the list of stores this store has active wholesale partnerships with.
 * Partnerships are bilateral (both stores have partnership records).
 * 
 * NOTE: No indexes required - simple subcollection scan
 * 
 * @param storeId - ID of store to fetch partners for
 * @returns {success: boolean, partners?: WholesalePartner[], error?: string}
 */
export async function getWholesalePartners(storeId: string) {
  try {
    const partnersSnap = await getDocs(
      collection(db, 'stores', storeId, 'wholesalePartners')
    );

    const partners = partnersSnap.docs.map((doc) => doc.data() as WholesalePartner);

    return { success: true, partners };
  } catch (error) {
    console.error('Error getting wholesale partners:', error);
    return { success: false, error: 'Failed to fetch partners' };
  }
}

/**
 * Get wholesale requests for a store (incoming and outgoing)
 * 
 * Fetches partnership requests with optional direction filtering.
 * Automatically filters out expired blocks (30-day blocks expire automatically).
 * 
 * NOTE: No indexes required for subcollection query with optional status filter
 * Firestore handles this efficiently without composite indexes
 * 
 * @param storeId - ID of store to fetch requests for
 * @param direction - 'incoming' (requests FROM others), 'outgoing' (requests TO others), or 'all'
 * @returns {success: boolean, requests?: WholesaleRequest[], error?: string}
 */
export async function getWholesaleRequests(
  storeId: string,
  direction: 'incoming' | 'outgoing' | 'all' = 'all'
) {
  try {
    const constraints: QueryConstraint[] = [];

    if (direction !== 'all') {
      constraints.push(where('direction', '==', direction));
    }

    const requestsSnap = await getDocs(
      query(collection(db, 'stores', storeId, 'wholesaleRequests'), ...constraints)
    );

    const requests = requestsSnap.docs.map((doc) => doc.data() as WholesaleRequest);

    // Filter out expired blocks
    const validRequests = requests.filter((req) => {
      if (req.status === 'blocked' && req.blockedUntil) {
        return Timestamp.now() < req.blockedUntil;
      }
      return true;
    });

    return { success: true, requests: validRequests };
  } catch (error) {
    console.error('Error getting wholesale requests:', error);
    return { success: false, error: 'Failed to fetch requests' };
  }
}

/**
 * Pause a wholesale partnership (partner can still view but no new orders)
 */
export async function pauseWholesalePartner(
  storeId: string,
  partnerId: string
) {
  try {
    await updateDoc(
      doc(db, 'stores', storeId, 'wholesalePartners', partnerId),
      { status: 'paused' }
    );

    return { success: true };
  } catch (error) {
    console.error('Error pausing partner:', error);
    return { success: false, error: 'Failed to pause partnership' };
  }
}

/**
 * Resume a wholesale partnership
 */
export async function resumeWholesalePartner(
  storeId: string,
  partnerId: string
) {
  try {
    await updateDoc(
      doc(db, 'stores', storeId, 'wholesalePartners', partnerId),
      { status: 'active' }
    );

    return { success: true };
  } catch (error) {
    console.error('Error resuming partner:', error);
    return { success: false, error: 'Failed to resume partnership' };
  }
}

/**
 * Remove a wholesale partner
 */
export async function removeWholesalePartner(
  storeId: string,
  partnerId: string
) {
  try {
    const batch = writeBatch(db);

    batch.delete(
      doc(db, 'stores', storeId, 'wholesalePartners', partnerId)
    );

    batch.delete(
      doc(db, 'stores', partnerId, 'wholesalePartners', storeId)
    );

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error removing partner:', error);
    return { success: false, error: 'Failed to remove partnership' };
  }
}

/**
 * Update wholesale configuration for a store
 * 
 * Updates store-level wholesale settings like visibility, discount, minimum order value, etc.
 * All fields are optional - only provided fields will be updated.
 * Uses nested paths to update individual config fields without overwriting others.
 * 
 * NOTE: No indexes required - direct document update by ID
 * 
 * @param storeId - ID of store to update
 * @param config - Partial config object with fields to update
 * @returns {success: boolean, error?: string}
 */
export async function updateWholesaleConfig(
  storeId: string,
  config: {
    isVisible?: boolean;
    globalDiscount?: number;
    minOrderValue?: number;
    defaultPaymentTermsDays?: 0 | 7 | 14 | 30;
  }
) {
  try {
    const storeRef = doc(db, 'stores', storeId);

    // Build update object with nested path
    const updateData: Record<string, any> = {};

    if (config.isVisible !== undefined) {
      updateData['wholesaleConfig.isVisible'] = config.isVisible;
    }
    if (config.globalDiscount !== undefined) {
      updateData['wholesaleConfig.globalDiscount'] = config.globalDiscount;
    }
    if (config.minOrderValue !== undefined) {
      updateData['wholesaleConfig.minOrderValue'] = config.minOrderValue;
    }
    if (config.defaultPaymentTermsDays !== undefined) {
      updateData['wholesaleConfig.defaultPaymentTermsDays'] = config.defaultPaymentTermsDays;
    }

    await updateDoc(storeRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating wholesale config:', error);
    return { success: false, error: 'Failed to update configuration' };
  }
}

/**
 * Get all products from a partner store with wholesale pricing applied
 * 
 * Fetches all products from partner's collection and applies their global discount.
 * Calculates wholesale prices server-side for consistency.
 * Includes inventory warnings if stock is low (< 10 units).
 * 
 * @param partnerId - ID of partner store to fetch products from
 * @param buyerStoreId - ID of buying store (for context, not strict validation)
 * @returns {success: boolean, products?: ProductWithWholesalePrice[], wholesaleConfig?, error?: string}
 */
export async function getPartnerProducts(partnerId: string, buyerStoreId: string) {
  try {
    console.log(`📦 [getPartnerProducts] Fetching products for partner: ${partnerId}`);

    // Get partner's store data and wholesale config
    const partnerStoreSnap = await getDoc(doc(db, 'stores', partnerId));
    if (!partnerStoreSnap.exists()) {
      console.error(`❌ [getPartnerProducts] Partner store not found: ${partnerId}`);
      return { success: false, error: 'Partner store not found' };
    }

    const partner = partnerStoreSnap.data() as StoreMeta;
    const wholesaleConfig = partner.wholesaleConfig || DEFAULT_WHOLESALE_CONFIG;

    console.log(`✅ [getPartnerProducts] Partner found: ${partner.name}`);
    console.log(`💰 [getPartnerProducts] Discount: ${wholesaleConfig.globalDiscount}%, Min Order: ₦${wholesaleConfig.minOrderValue}`);

    // Get all products from partner - NO EARLY VERIFICATION
    // Partnership is already verified by UI (user can only reach this modal if authenticated)
    const productsSnap = await getDocs(collection(db, 'stores', partnerId, 'products'));

    console.log(`📋 [getPartnerProducts] Found ${productsSnap.docs.length} products in collection`);

    // If no products, return empty array (not an error)
    if (productsSnap.docs.length === 0) {
      console.warn(`⚠️ [getPartnerProducts] No products found in stores/${partnerId}/products`);
      return {
        success: true,
        products: [],
        wholesaleConfig,
      };
    }

    const productsWithPricing = productsSnap.docs.map((doc) => {
      const product = doc.data();
      const originalPrice = product.price || 0;
      const discountPercent = wholesaleConfig.globalDiscount || 0;
      const wholesalePrice = originalPrice * (1 - discountPercent / 100);

      return {
        id: doc.id,
        ...product,
        originalPrice,
        wholesalePrice: Math.round(wholesalePrice * 100) / 100, // Round to 2 decimals
        discountApplied: discountPercent,
        stock: product.quantity || product.stock || 0,
        inventoryWarning: (product.quantity || product.stock || 0) < 10,
      };
    });

    // Log first few products for debugging
    console.log(`✅ [getPartnerProducts] Returning ${productsWithPricing.length} products with pricing:`);
    productsWithPricing.slice(0, 3).forEach((p: any) => {
      console.log(`   - ${p.name || 'Unknown'}: ₦${p.originalPrice} → ₦${p.wholesalePrice} (${p.discountPercent}% off)`);
    });

    return {
      success: true,
      products: productsWithPricing,
      wholesaleConfig,
    };
  } catch (error) {
    console.error('❌ [getPartnerProducts] Error getting partner products:', error);
    return { success: false, error: 'Failed to fetch partner products' };
  }
}

/**
 * Create a wholesale order between two stores
 * 
 * Validates minimum order value, creates order documents in both stores,
 * and updates wholesale statistics.
 * 
 * @param buyerStoreId - ID of store placing the order
 * @param sellerStoreId - ID of store receiving the order
 * @param orderItems - Array of {productId, name, quantity, wholesalePrice}
 * @param paymentTermsDays - Payment terms (0, 7, 14, or 30)
 * @param notes - Optional notes for the order
 * @returns {success: boolean, orderId?: string, total?: number, error?: string}
 */
export async function createWholesaleOrder(
  buyerStoreId: string,
  sellerStoreId: string,
  orderItems: Array<{
    productId: string;
    name: string;
    quantity: number;
    wholesalePrice: number;
  }>,
  paymentTermsDays: 0 | 7 | 14 | 30 = 0,
  notes?: string
) {
  try {
    // Validate: stores are partners
    const partnerSnap = await getDoc(doc(db, 'stores', sellerStoreId, 'wholesalePartners', buyerStoreId));
    if (!partnerSnap.exists()) {
      return { success: false, error: 'Stores are not partners' };
    }

    // Get seller's wholesale config
    const sellerStoreSnap = await getDoc(doc(db, 'stores', sellerStoreId));
    if (!sellerStoreSnap.exists()) {
      return { success: false, error: 'Seller store not found' };
    }

    const seller = sellerStoreSnap.data() as StoreMeta;
    const wholesaleConfig = seller.wholesaleConfig || DEFAULT_WHOLESALE_CONFIG;

    // Calculate order total
    const subtotal = orderItems.reduce((sum, item) => sum + item.wholesalePrice * item.quantity, 0);
    const discountAmount = orderItems.reduce((sum, item) => {
      const originalPrice = item.wholesalePrice / (1 - (wholesaleConfig.globalDiscount || 0) / 100);
      return sum + (originalPrice - item.wholesalePrice) * item.quantity;
    }, 0);
    const total = subtotal;

    // Validate: meets minimum order value
    if (total < (wholesaleConfig.minOrderValue || 0)) {
      return {
        success: false,
        error: `Order total ₦${total.toLocaleString()} is below minimum ₦${(wholesaleConfig.minOrderValue || 0).toLocaleString()}`,
      };
    }

    // Create order ID
    const orderId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Order document structure
    const orderData = {
      id: orderId,
      buyerStoreId,
      sellerStoreId,
      items: orderItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        wholesalePrice: item.wholesalePrice,
        subtotal: item.wholesalePrice * item.quantity,
      })),
      subtotal,
      discountAmount: Math.round(discountAmount * 100) / 100,
      total,
      paymentTermsDays,
      status: 'pending',
      createdAt: Timestamp.now(),
      notes: notes || null,
    };

    // Create order in both stores using batch
    const batch = writeBatch(db);

    // In buyer store
    batch.set(doc(db, 'stores', buyerStoreId, 'wholesaleOrders', orderId), orderData);

    // In seller store (mirrored)
    batch.set(doc(db, 'stores', sellerStoreId, 'wholesaleOrders', orderId), orderData);

    // Update seller's wholesale stats
    batch.update(doc(db, 'stores', sellerStoreId), {
      'wholesaleStats.totalWholesaleOrders': increment(1),
      'wholesaleStats.monthlyWholesaleRevenue': increment(total),
    });

    await batch.commit();

    return {
      success: true,
      orderId,
      total,
      paymentTermsDays,
    };
  } catch (error) {
    console.error('Error creating wholesale order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

/**
 * B2B Dropshipping: Copy a product from a supplier to a reseller's store
 * 
 * Creates a duplicate of the product in the reseller's products subcollection.
 * Adds dropshipping metadata (`isDropshipped`, `supplierId`, `sourceProductId`)
 * to track the origin and allow for future inventory syncs.
 * 
 * @param sourceProductId - ID of the product in the supplier's store
 * @param sourceStoreId - ID of the supplier's store
 * @param targetStoreId - ID of the reseller's store (where it will be copied to)
 * @param resellerCategoryId - (Optional) The category ID in the reseller's store to place the product
 */
export async function copyProductToDropshipStore(
  sourceProductId: string,
  sourceStoreId: string,
  targetStoreId: string,
  resellerCategoryId?: string
) {
  try {
    // 1. Fetch the original product
    const sourceProductRef = doc(db, 'stores', sourceStoreId, 'products', sourceProductId);
    const sourceProductSnap = await getDoc(sourceProductRef);

    if (!sourceProductSnap.exists()) {
      return { success: false, error: 'Source product not found' };
    }

    const sourceData = sourceProductSnap.data();

    // 2. Fetch the supplier's wholesale config to apply the default discount mapping (if desired)
    const supplierStoreSnap = await getDoc(doc(db, 'stores', sourceStoreId));
    let wholesaleDiscount = 0;
    if (supplierStoreSnap.exists()) {
      const supplierData = supplierStoreSnap.data() as StoreMeta;
      wholesaleDiscount = supplierData.wholesaleConfig?.globalDiscount || 0;
    }

    // 3. Create dropshipped clone data
    // Deep clone is simulated by destructuring and removing unnecessary fields
    const { id, createdAt, updatedAt, ...restData } = sourceData;

    // Determine the baseline cost for the reseller
    const originalPrice = sourceData.price || 0;
    const wholesalePrice = originalPrice * (1 - wholesaleDiscount / 100);

    // Create a new unique ID for the copied product
    const newProductId = `drop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const dropshippedProductData = {
      ...restData,
      id: newProductId,
      categoryId: resellerCategoryId || '', // User can assign this later if not provided
      price: originalPrice, // Default to selling at original MSRP (reseller can change this)
      wholesaleCost: wholesalePrice, // Keep track of what they owe the supplier
      isDropshipped: true,
      supplierId: sourceStoreId,
      sourceProductId: sourceProductId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      views: 0,
      sales: 0,
    };

    // 4. Save to the target store's products collection
    const targetProductRef = doc(db, 'stores', targetStoreId, 'products', newProductId);
    await setDoc(targetProductRef, dropshippedProductData);

    // 5. Increment product count on the target store
    await updateDoc(doc(db, 'stores', targetStoreId), {
      productCount: increment(1)
    });

    return { success: true, newProductId };
  } catch (error) {
    console.error('Error copying product for dropshipping:', error);
    return { success: false, error: 'Failed to copy product' };
  }
}

/**
 * B2B Dropshipping: Sync Inventory
 * 
 * Called when a supplier updates a product's inventory (e.g. quantity, soldOut, limitedStock)
 * This function locates all reseller stores that copied this product and updates their copies 
 * to ensure resellers don't sell out-of-stock items.
 * 
 * @param sourceProductId - ID of the product that was updated
 * @param inventoryUpdates - The fields to sync (e.g., { soldOut: true })
 */
export async function syncDropshippedProductsInventory(
  sourceProductId: string,
  inventoryUpdates: { soldOut?: boolean; limitedStock?: boolean; quantity?: number; stock?: number }
) {
  try {
    // Implementation Note:
    // To find all copied products, we use a collectionGroup query across all 'products' 
    // subcollections where sourceProductId matches.
    // Ensure you have a composite index on products: sourceProductId (ASC) 

    // CAUTION: Firebase requires a collection group index for this query.
    // If it fails, the console will log a direct link to create the index.
    const productsGroupQuery = query(
      collectionGroup(db, 'products'),
      where('sourceProductId', '==', sourceProductId)
    );

    const snapshot = await getDocs(productsGroupQuery);

    if (snapshot.empty) {
      return { success: true, count: 0 }; // No resellers copied this product
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((docSnap) => {
      // Because we are querying a collectionGroup, docSnap.ref points exactly 
      // to the reseller's product document.
      batch.update(docSnap.ref, {
        ...inventoryUpdates,
        updatedAt: Timestamp.now()
      });
      count++;
    });

    await batch.commit();

    return { success: true, count };
  } catch (error) {
    console.error('Error syncing dropshipped inventory:', error);
    return { success: false, error: 'Failed to sync inventory' };
  }
}

