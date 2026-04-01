'use server';

import { db } from '@/lib/db';
import { collection, addDoc, Timestamp, doc, setDoc, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { commissionEndDate, remainingWeeksUntil, projectedTotalFromWeekly } from '@/utils/commission';
import { addYears } from 'date-fns';

export async function createCommissionStore(data: any) {
    try {
        const {
            businessName,
            category,
            whatsapp,
            instagram,
            email,
            country,
            state,
            bankName,
            accountNumber,
            accountName,
            bankCode,
            referralCode
        } = data;

        // 1. Create Store Document
        const storeData = {
            name: businessName,
            storeType: category,
            whatsapp,
            instagram,
            email,
            country,
            state,
            bankDetails: {
                bankName,
                accountNumber,
                accountName,
                bankCode
            },
            referralCode,
            commissionMode: true,
            commissionRate: 4.5,
            status: 'active', // Commission stores are active immediately
            subscriptionStatus: 'active',
            subscriptionTier: 'commission',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            referralDate: Timestamp.now(),
            hasCompletedOnboarding: false,
            currency: 'NGN'
        };

        const storeRef = await addDoc(collection(db, 'stores'), storeData);
        const storeId = storeRef.id;

        // 2. Create Registration Record (for Referral Dashboard)
        await addDoc(collection(db, 'registrations'), {
            businessName,
            storeType: category,
            status: 'completed',
            referralCode,
            storeId,
            createdAt: Timestamp.now(),
            email
        });

        // 3. Create User Document (Simplified - assuming auth handles this or we link later)
        // For now, we just ensure the store exists. In a real app, we'd create a user auth record.

        // 4. Trigger Subaccount Creation (Async)
        // We would call the Paystack API here to create a subaccount.
        // For now, we assume this happens via a background trigger or we'd implement it here.

        return { success: true, storeId };

    } catch (error: any) {
        console.error('Error creating commission store:', error);
        return { success: false, error: error.message };
    }
}

export async function getCommissionDashboardData(referralCode: string) {
    try {
        // Fetch stores created with this referral code
        const storesQuery = query(collection(db, 'stores'), where('referralCode', '==', referralCode));
        const storesSnapshot = await getDocs(storesQuery);

        // Determine active stores count to derive ambassador tier
        const activeStoresCount = storesSnapshot.docs.filter(d => d.data().subscriptionStatus === 'active').length;
        let tierName: 'Novice' | 'Pro' | 'Elite' = 'Novice';
        let ambassadorPercent = 10;
        let nextTierThreshold: number | null = 3;
        let progress = 0;

        if (activeStoresCount >= 11) {
            tierName = 'Elite';
            ambassadorPercent = 30;
            nextTierThreshold = null;
            progress = 100;
        } else if (activeStoresCount >= 3) {
            tierName = 'Pro';
            ambassadorPercent = 20;
            nextTierThreshold = 11;
            progress = Math.round(((activeStoresCount - 3) / (11 - 3)) * 100);
        } else {
            tierName = 'Novice';
            ambassadorPercent = 10;
            nextTierThreshold = 3;
            progress = Math.round((activeStoresCount / 3) * 100);
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const sevenTs = Timestamp.fromDate(sevenDaysAgo);

        const stores = await Promise.all(storesSnapshot.docs.map(async (sDoc) => {
            const data: any = sDoc.data();
            const storeId = sDoc.id;

            // Sum gross revenue from stores/{storeId}/commissionPayments in the last 7 days
            let sumRevenueLast7Days = 0;
            try {
                const paymentsRef = collection(db, 'stores', storeId, 'commissionPayments');
                const paymentsQuery = query(paymentsRef, where('uploadedAt', '>=', sevenTs));
                const paymentsSnapshot = await getDocs(paymentsQuery);

                if (paymentsSnapshot.size > 0) {
                    paymentsSnapshot.forEach(p => {
                        const pd: any = p.data();
                        sumRevenueLast7Days += (pd.grossRevenue || pd.amount || 0);
                    });
                } else {
                    // Fallback: try collectionGroup if documents store a storeId field
                    try {
                        const cgQuery = query(collectionGroup(db, 'commissionPayments'), where('uploadedAt', '>=', sevenTs), where('storeId', '==', storeId));
                        const cgSnap = await getDocs(cgQuery);
                        cgSnap.forEach(p => {
                            const pd: any = p.data();
                            sumRevenueLast7Days += (pd.grossRevenue || pd.amount || 0);
                        });
                    } catch (innerErr) {
                        // ignore fallback errors, leave sum as 0
                    }
                }
            } catch (err) {
                console.error('Error reading commissionPayments for store', storeId, err);
            }

            // Ambassador earns ambassadorPercent of Compass ??'s 4.5% fee
            const weeklyCommission = sumRevenueLast7Days * 0.045 * (ambassadorPercent / 100);

            // Commission period: 5 years from referralDate
            const referralDate = data.referralDate && (data.referralDate as Timestamp).toDate ? (data.referralDate as Timestamp).toDate() : new Date();
            const periodEnd = commissionEndDate(referralDate, 5);
            const remainingWeeks = remainingWeeksUntil(referralDate, 5);
            const projected5YearTotal = projectedTotalFromWeekly(weeklyCommission, 5);
            const totalRemainingCommission = weeklyCommission * remainingWeeks;

            return {
                id: storeId,
                name: data.name || '',
                logo: data.logo || '',
                status: data.subscriptionStatus || 'trial',
                subscriptionTier: data.subscriptionTier || 'basic',
                referralDate: data.referralDate && (data.referralDate as Timestamp).toDate ? (data.referralDate as Timestamp).toDate().toISOString() : new Date().toISOString(),
                trialEndsAt: data.trialEndsAt && (data.trialEndsAt as Timestamp).toDate ? (data.trialEndsAt as Timestamp).toDate().toISOString() : undefined,
                weeklyPerformance: {
                    views: { current: 0, previous: 0, trend: 0 },
                    orders: { current: 0, previous: 0, trend: 0 }
                },
                commission: {
                    weeklyAmount: Math.round(weeklyCommission),
                    totalEarned: 0,
                    isEligible: true,
                    projected5YearTotal: Math.round(projected5YearTotal),
                    totalRemainingCommission: Math.round(totalRemainingCommission),
                    periodEnd: periodEnd.toISOString()
                },
                whatsapp: data.whatsapp || ''
            };
        }));

        const summary = {
            totalRegistrations: 0,
            activeStores: activeStoresCount,
            totalViews: stores.reduce((s, st) => s + (st.weeklyPerformance.views.current || 0), 0),
            totalWeeklyCommission: stores.reduce((s, st) => s + (st.commission.weeklyAmount || 0), 0),
            total5YearProjection: stores.reduce((s, st) => s + (st.commission.projected5YearTotal || 0), 0),
            totalRemainingCommission: stores.reduce((s, st) => s + (st.commission.totalRemainingCommission || 0), 0)
        };

        return {
            referralCode,
            summary,
            tier: {
                name: tierName,
                commissionPercentage: ambassadorPercent,
                nextTierThreshold,
                progress
            },
            registrations: [],
            stores,
            notifications: []
        };
    } catch (error: any) {
        console.error('Error building commission dashboard:', error);
        return {
            referralCode,
            summary: { totalRegistrations: 0, activeStores: 0, totalViews: 0, totalWeeklyCommission: 0 },
            tier: { name: 'Novice', commissionPercentage: 10, nextTierThreshold: 3, progress: 0 },
            registrations: [],
            stores: [],
            notifications: []
        };
    }
}
