'use server';

import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    writeBatch,
    collectionGroup
} from 'firebase/firestore';
import { calculateTrialEndDate } from '@/types/subscription';

/**
 * Slugify a business name for Store ID
 */
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};

/**
 * Automated One-Click Fulfillment
 * Converts a registration into a live store and activates plan.
 */
export async function fulfillRegistration(registrationId: string) {
    try {
        const regRef = doc(db, 'registrations', registrationId);
        const regSnap = await getDoc(regRef);

        if (!regSnap.exists()) {
            throw new Error('Registration not found');
        }

        const regData = regSnap.data();

        // 1. Generate Unique Store ID
        const baseId = slugify(regData.businessName || "new-store");
        let storeId = baseId;
        const storeDoc = await getDocs(query(collection(db, 'stores'), where('id', '==', storeId)));
        if (!storeDoc.empty) {
            storeId = `${baseId}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const storeRef = doc(db, 'stores', storeId);

        // 2. Determine Subscription Status
        const isPaid = (regData.amountPaid || 0) > 0;
        const subscriptionStatus = isPaid ? 'active' : 'trial';
        const trialEndsAt = !isPaid ? calculateTrialEndDate() : null;

        // 3. Prepare Store Meta
        const storeMeta = {
            id: storeId,
            name: regData.businessName,
            whatsapp: regData.whatsapp || regData.ceoPhone || "",
            ceoName: regData.ceoName || "",
            ceoEmail: regData.ceoEmail || "",
            ceoPhone: regData.ceoPhone || "",
            storeType: (regData.storeType || 'general').toLowerCase(),
            businessDescription: regData.businessDescription || "",
            country: regData.country || "Nigeria",
            state: regData.state || "",

            // Feature Stats
            totalViews: 0,
            totalOrders: 0,
            totalCommissionEarned: 0,
            hasCompletedOnboarding: true,
            createdAt: serverTimestamp(),

            // Subscription Data
            subscriptionStatus,
            subscriptionTier: regData.subscriptionTier || (regData.storeType === 'general' ? 'general' : 'basic'),
            subscriptionStartDate: serverTimestamp(),
            subscriptionPlanCode: isPaid ? 'auto_fulfilled' : 'manual_trial',
            trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,

            // Link back to registration
            registrationRef: registrationId,
            paymentReference: regData.paymentReference || null
        };

        // 4. Create Store Doc
        await setDoc(storeRef, storeMeta);

        // 5. Seed Default Categories (Promo/New)
        const batch = writeBatch(db);
        const categories = ['New Arrivals', 'Promo'];
        categories.forEach((cat) => {
            const catRef = doc(collection(db, `stores/${storeId}/categories`));
            batch.set(catRef, { name: cat, createdAt: serverTimestamp() });
        });

        // 6. Complete Registration
        batch.update(regRef, {
            status: 'completed',
            fulfilledStoreId: storeId,
            fulfilledAt: serverTimestamp()
        });

        await batch.commit();

        return {
            success: true,
            storeId,
            message: `Store ${regData.businessName} successfully created and activated!`
        };

    } catch (error: any) {
        console.error('[superadminActions] Fulfillment failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reject a registration
 */
export async function rejectRegistration(registrationId: string, reason: string) {
    try {
        const regRef = doc(db, 'registrations', registrationId);
        await updateDoc(regRef, {
            status: 'rejected',
            rejectionReason: reason,
            rejectedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Global Platform Stats (GMV, Stores, Products, Regs)
 */
export async function getPlatformStats() {
    try {
        // 1. Total Stores & Active Count
        const storesSnap = await getDocs(collection(db, 'stores'));
        const totalStores = storesSnap.size;
        const activeStores = storesSnap.docs.filter(d => d.data().subscriptionStatus === 'active').length;

        // 2. Pending Registrations
        const regsSnap = await getDocs(query(collection(db, 'registrations'), where('status', 'in', ['pending', 'active'])));
        const pendingRegs = regsSnap.size;

        // 3. Global GMV (Optimized for small-medium scale)
        const ordersSnap = await getDocs(collectionGroup(db, 'orders'));
        let totalGMV = 0;
        ordersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.status !== 'cancelled') {
                totalGMV += (data.totalAmount || 0);
            }
        });

        // 4. Total Products
        const productsSnap = await getDocs(collectionGroup(db, 'products'));
        const totalProducts = productsSnap.size;

        return {
            success: true,
            stats: {
                totalGMV,
                totalStores,
                activeStores,
                totalProducts,
                pendingRegs,
                lastUpdated: new Date().toISOString()
            }
        };
    } catch (error: any) {
        console.error('[superadminActions] Stats fetch failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Billing watchdog data
 */
export async function getBillingStats() {
    try {
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const storesSnap = await getDocs(collection(db, 'stores'));

        // 1. Expiry Watchlist
        const expiringSoon = storesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as any))
            .filter(s => {
                if (!s.subscriptionTrialEndsAt && !s.subscriptionNextBillingDate) return false;
                const date = (s.subscriptionTrialEndsAt || s.subscriptionNextBillingDate).toDate();
                return date > now && date <= next7Days;
            })
            .sort((a, b) => (a.subscriptionTrialEndsAt || a.subscriptionNextBillingDate).toDate() - (b.subscriptionTrialEndsAt || b.subscriptionNextBillingDate).toDate());

        // 2. Revenue Breakdown Mock (Since we don't track sub revenue docs yet)
        const activeSubs = storesSnap.docs.filter(d => d.data().subscriptionStatus === 'active').length;
        const estMonthlyRev = activeSubs * 10000; // Average across tiers

        return {
            success: true,
            expiringSoon,
            estMonthlyRev,
            activeSubs
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
