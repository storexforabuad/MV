'use server';

import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';
import { WholesaleInvoice, WholesaleOrder } from '@/types/wholesale';
import { StoreMeta } from '@/types/store';

interface InvoiceData {
  invoice: WholesaleInvoice & { id: string };
  sellerStore: StoreMeta | null;
  buyerStore: StoreMeta | null;
  orders: (WholesaleOrder & { id: string })[];
  error?: string;
}

/**
 * Fetch invoice data including related store info and orders
 */
export async function getInvoiceData(invoiceId: string, storeId: string): Promise<InvoiceData> {
  try {
    const db = getFirestore(firebaseApp);

    // Fetch invoice
    const invoiceRef = doc(db, 'stores', storeId, 'wholesaleInvoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return {
        invoice: null as any,
        sellerStore: null,
        buyerStore: null,
        orders: [],
        error: 'Invoice not found'
      };
    }

    const invoiceData = invoiceSnap.data() as WholesaleInvoice;
    const invoice = { ...invoiceData, id: invoiceId };

    // Fetch seller store
    const sellerStoreRef = doc(db, 'stores', invoice.sellerStoreId);
    const sellerStoreSnap = await getDoc(sellerStoreRef);
    const sellerStore = sellerStoreSnap.exists() ? (sellerStoreSnap.data() as StoreMeta) : null;

    // Fetch buyer store
    const buyerStoreRef = doc(db, 'stores', invoice.buyerStoreId);
    const buyerStoreSnap = await getDoc(buyerStoreRef);
    const buyerStore = buyerStoreSnap.exists() ? (buyerStoreSnap.data() as StoreMeta) : null;

    // Fetch orders in this invoice's period
    const ordersRef = collection(db, 'stores', invoice.sellerStoreId, 'wholesaleOrders');
    const ordersQuery = query(
      ordersRef,
      where('wholesaleToBuyerStoreId', '==', invoice.buyerStoreId),
      where('status', '==', 'delivered')
    );
    const ordersSnap = await getDocs(ordersQuery);

    const orders = ordersSnap.docs
      .map(doc => ({ ...doc.data() as WholesaleOrder, id: doc.id }))
      .filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date();
        const startDate = invoice.invoicePeriod?.startDate?.toDate?.() || new Date();
        const endDate = invoice.invoicePeriod?.endDate?.toDate?.() || new Date();
        return orderDate >= startDate && orderDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date();
        const dateB = b.createdAt?.toDate?.() || new Date();
        return dateB.getTime() - dateA.getTime();
      });

    return {
      invoice,
      sellerStore,
      buyerStore,
      orders
    };
  } catch (error) {
    console.error('Error fetching invoice data:', error);
    return {
      invoice: null as any,
      sellerStore: null,
      buyerStore: null,
      orders: [],
      error: error instanceof Error ? error.message : 'Failed to fetch invoice data'
    };
  }
}

/**
 * Mark invoice as settled and update seller stats
 */
export async function markInvoiceAsSettled(invoiceId: string, storeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getFirestore(firebaseApp);

    const invoiceRef = doc(db, 'stores', storeId, 'wholesaleInvoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoiceData = invoiceSnap.data() as WholesaleInvoice;

    // Update invoice status
    await (db as any).collection('stores').doc(storeId).collection('wholesaleInvoices').doc(invoiceId).update({
      status: 'settled',
      settledAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking invoice as settled:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark invoice as settled'
    };
  }
}
