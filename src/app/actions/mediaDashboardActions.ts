'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface MediaStoreStats {
    storeId: string;
    storeName: string;
    ownerName: string;
    // Revenue
    totalGMV: number;             // all sales combined
    serviceGMV: number;           // PR/Collab service orders only
    physicalGMV: number;          // fashion/general product orders
    bookingFeeRevenue: number;    // total booking fees collected
    // Platform Cuts (BizConNet's share)
    platformBookingCut: number;   // 20% of booking fees
    platformEscrowCut: number;    // 10% of service GMV
    totalPlatformRevenue: number; // sum of the above two cuts
    // Escrow Health
    escrowHeldBalance: number;    // funds currently in escrow (not yet released)
    escrowReleasedTotal: number;  // funds released so far
    // Order Counts
    totalOrders: number;
    serviceOrders: number;
    pendingReviewOrders: number;  // awaiting brand approval
}

/**
 * Fetches analytics for all media-influencer stores.
 * Aggregates order data per store to compute revenue and escrow breakdowns.
 */
export async function getMediaDashboardStats(): Promise<{
    success: boolean;
    stores: MediaStoreStats[];
    totals: {
        totalPlatformRevenue: number;
        totalEscrowHeld: number;
        totalBookingCuts: number;
        totalEscrowCuts: number;
        storeCount: number;
    };
    error?: string;
}> {
    try {
        // 1. Fetch all media-influencer stores
        const storesSnap = await getDocs(
            query(collection(db, 'stores'), where('storeType', '==', 'media-influencer'))
        );

        const storeStats: MediaStoreStats[] = [];

        for (const storeDoc of storesSnap.docs) {
            const storeData = storeDoc.data();
            const storeId = storeDoc.id;

            // 2. Fetch all orders for this store
            const ordersSnap = await getDocs(collection(db, 'stores', storeId, 'orders'));

            let totalGMV = 0;
            let serviceGMV = 0;
            let physicalGMV = 0;
            let bookingFeeRevenue = 0;
            let escrowHeldBalance = 0;
            let escrowReleasedTotal = 0;
            let serviceOrders = 0;
            let pendingReviewOrders = 0;

            for (const orderDoc of ordersSnap.docs) {
                const order = orderDoc.data();
                const products: any[] = order.products || [];

                // Aggregate per-product revenue
                for (const product of products) {
                    const price = (product.price || 0) * (product.quantity || 1);

                    if (product.productType === 'media-influencer') {
                        if (product.subtype === 'booking-fee') {
                            bookingFeeRevenue += price;
                        } else if (product.subtype === 'service') {
                            serviceGMV += price;
                            serviceOrders++;
                        }
                    } else {
                        physicalGMV += price;
                    }

                    totalGMV += price;
                }

                // Escrow balance tracking
                if (order.paymentStatus === 'escrow-held') {
                    // Sum of service product prices in this order
                    const escrowValue = products
                        .filter((p: any) => p.productType === 'media-influencer' && p.subtype === 'service')
                        .reduce((s: number, p: any) => s + (p.price || 0) * (p.quantity || 1), 0);
                    escrowHeldBalance += escrowValue;
                }

                if (order.paymentStatus === 'escrow-released') {
                    const releasedValue = products
                        .filter((p: any) => p.productType === 'media-influencer' && p.subtype === 'service')
                        .reduce((s: number, p: any) => s + (p.price || 0) * (p.quantity || 1), 0);
                    escrowReleasedTotal += releasedValue;
                }

                if (order.orderStatus === 'pending-review') {
                    pendingReviewOrders++;
                }
            }

            const platformBookingCut = bookingFeeRevenue * 0.20;
            const platformEscrowCut = serviceGMV * 0.10;

            storeStats.push({
                storeId,
                storeName: storeData.name || 'Unnamed Store',
                ownerName: storeData.ownerName || storeData.phoneNumber || 'Unknown',
                totalGMV,
                serviceGMV,
                physicalGMV,
                bookingFeeRevenue,
                platformBookingCut,
                platformEscrowCut,
                totalPlatformRevenue: platformBookingCut + platformEscrowCut,
                escrowHeldBalance,
                escrowReleasedTotal,
                totalOrders: ordersSnap.size,
                serviceOrders,
                pendingReviewOrders,
            });
        }

        // Sort by total platform revenue descending
        storeStats.sort((a, b) => b.totalPlatformRevenue - a.totalPlatformRevenue);

        const totals = storeStats.reduce(
            (acc, s) => ({
                totalPlatformRevenue: acc.totalPlatformRevenue + s.totalPlatformRevenue,
                totalEscrowHeld: acc.totalEscrowHeld + s.escrowHeldBalance,
                totalBookingCuts: acc.totalBookingCuts + s.platformBookingCut,
                totalEscrowCuts: acc.totalEscrowCuts + s.platformEscrowCut,
                storeCount: acc.storeCount + 1,
            }),
            { totalPlatformRevenue: 0, totalEscrowHeld: 0, totalBookingCuts: 0, totalEscrowCuts: 0, storeCount: 0 }
        );

        return { success: true, stores: storeStats, totals };
    } catch (error) {
        console.error('mediaDashboard error:', error);
        return {
            success: false,
            stores: [],
            totals: { totalPlatformRevenue: 0, totalEscrowHeld: 0, totalBookingCuts: 0, totalEscrowCuts: 0, storeCount: 0 },
            error: String(error),
        };
    }
}
