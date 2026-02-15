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
 * Send a wholesale request from one store to another (same storeType only)
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
      partnerStoreName: (await getDoc(doc(db, 'stores', request.fromStoreId)))
        .data()?.name || 'Store',
      status: 'active',
      connectedAt: Timestamp.now(),
      totalOrders: 0,
      totalRevenue: 0,
      lastOrderDate: null,
    });

    // For requester (fromStoreId) - toStoreId becomes their wholesale supplier
    const fromStorePartnerRef = doc(
      db,
      'stores',
      request.fromStoreId,
      'wholesalePartners',
      storeId
    );
    const toStoreName = (await getDoc(doc(db, 'stores', storeId))).data()
      ?.name || 'Store';

    batch.set(fromStorePartnerRef, {
      id: storeId,
      partnerId: storeId,
      partnerStoreName: toStoreName,
      status: 'active',
      connectedAt: Timestamp.now(),
      totalOrders: 0,
      totalRevenue: 0,
      lastOrderDate: null,
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

    // Get all stores with same storeType that are wholesale vendors
    const constraints: QueryConstraint[] = [
      where('storeType', '==', store.storeType),
      where('isWholesaleVendor', '==', true),
      where('wholesaleConfig.isVisible', '==', true),
    ];

    const storesSnap = await getDocs(query(collection(db, 'stores'), ...constraints));

    let stores = storesSnap.docs
      .map((doc) => doc.data() as StoreMeta)
      .filter((s) => s.id !== storeId); // Exclude self

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

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      stores = stores.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.businessDescription?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q)
      );
    }

    // TODO: Sort by the specified criteria
    // For now, return as-is

    return { success: true, stores };
  } catch (error) {
    console.error('Error getting discoverable stores:', error);
    return { success: false, error: 'Failed to fetch stores' };
  }
}

/**
 * Get all wholesale partners for a store
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
