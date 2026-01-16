'use server';

import { db } from '@/lib/db';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    Timestamp,
    doc,
    getDoc,
    limit
} from 'firebase/firestore';
import { StoreMeta } from '@/types/store';
import { TIER_DETAILS } from '@/types/subscription';
import { subDays, startOfDay, endOfDay, isWithinInterval, addYears } from 'date-fns';

export interface ReferralStoreStats {
    id: string;
    name: string;
    logo?: string;
    status: string;
    subscriptionTier: string;
    referralDate: string;
    weeklyPerformance: {
        views: { current: number; previous: number; trend: number };
        orders: { current: number; previous: number; trend: number };
    };
    commission: {
        weeklyAmount: number;
        totalEarned: number; // This would ideally be fetched from a log, but for now we calculate current weekly
        isEligible: boolean;
    };
    whatsapp: string;
}

export interface ReferralDashboardData {
    referralCode: string;
    summary: {
        totalRegistrations: number;
        activeStores: number;
        totalViews: number;
        totalWeeklyCommission: number;
    };
    registrations: any[];
    stores: ReferralStoreStats[];
}

export async function getReferralDashboardData(referralCode: string): Promise<ReferralDashboardData> {
    try {
        // 1. Fetch Registrations
        // We remove orderBy to avoid needing a composite index for (referralCode, createdAt)
        // We will sort in memory instead.
        const regsQuery = query(
            collection(db, 'registrations'),
            where('referralCode', '==', referralCode)
        );
        const regsSnapshot = await getDocs(regsQuery);
        const registrations = regsSnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString()
            }))
            .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

        // 2. Fetch Stores
        const storesQuery = query(
            collection(db, 'stores'),
            where('referralCode', '==', referralCode)
        );
        const storesSnapshot = await getDocs(storesQuery);

        const now = new Date();
        const startOfThisWeek = subDays(now, 7);
        const startOfLastWeek = subDays(now, 14);

        const stores: ReferralStoreStats[] = await Promise.all(storesSnapshot.docs.map(async (storeDoc) => {
            const data = storeDoc.data();
            const storeId = storeDoc.id;

            // Fetch Metrics for last 14 days
            const metricsRef = collection(db, 'stores', storeId, 'dailyMetrics');
            const metricsQuery = query(
                metricsRef,
                where('date', '>=', startOfLastWeek.toISOString().split('T')[0]),
                orderBy('date', 'desc')
            );
            const metricsSnapshot = await getDocs(metricsQuery);
            const metrics = metricsSnapshot.docs.map(d => d.data());

            const thisWeekMetrics = metrics.filter(m => m.date >= startOfThisWeek.toISOString().split('T')[0]);
            const lastWeekMetrics = metrics.filter(m => m.date < startOfThisWeek.toISOString().split('T')[0]);

            const thisWeekViews = thisWeekMetrics.reduce((sum, m) => sum + (m.views || 0), 0);
            const lastWeekViews = lastWeekMetrics.reduce((sum, m) => sum + (m.views || 0), 0);
            const thisWeekOrders = thisWeekMetrics.reduce((sum, m) => sum + (m.ordersCompleted || 0), 0);
            const lastWeekOrders = lastWeekMetrics.reduce((sum, m) => sum + (m.ordersCompleted || 0), 0);

            const calculateTrend = (curr: number, prev: number) => {
                if (prev === 0) return curr > 0 ? 100 : 0;
                return ((curr - prev) / prev) * 100;
            };

            // Commission Calculation
            const tier = data.subscriptionTier as keyof typeof TIER_DETAILS;
            const tierInfo = TIER_DETAILS[tier];
            const weeklyFee = tierInfo ? (tierInfo.price / 2) : 0; // Halved price as per logic in registration
            const referralDate = (data.referralDate as Timestamp)?.toDate() || new Date();
            const isEligible = isWithinInterval(now, {
                start: referralDate,
                end: addYears(referralDate, 1)
            });
            const weeklyCommission = isEligible ? (weeklyFee * 0.2) : 0;

            return {
                id: storeId,
                name: data.name,
                logo: data.logo,
                status: data.subscriptionStatus || 'trial',
                subscriptionTier: data.subscriptionTier || 'basic',
                referralDate: referralDate.toISOString(),
                weeklyPerformance: {
                    views: { current: thisWeekViews, previous: lastWeekViews, trend: calculateTrend(thisWeekViews, lastWeekViews) },
                    orders: { current: thisWeekOrders, previous: lastWeekOrders, trend: calculateTrend(thisWeekOrders, lastWeekOrders) }
                },
                commission: {
                    weeklyAmount: weeklyCommission,
                    totalEarned: 0, // Placeholder for now
                    isEligible
                },
                whatsapp: data.whatsapp || ''
            };
        }));

        // 3. Summary
        const summary = {
            totalRegistrations: registrations.length,
            activeStores: stores.filter(s => s.status === 'active').length,
            totalViews: stores.reduce((sum, s) => sum + s.weeklyPerformance.views.current, 0),
            totalWeeklyCommission: stores.reduce((sum, s) => sum + s.commission.weeklyAmount, 0)
        };

        return {
            referralCode,
            summary,
            registrations,
            stores
        };

    } catch (error: any) {
        console.error('Error fetching referral dashboard data:', error);
        // Throw a more descriptive error if it's an index issue
        if (error.message?.includes('index')) {
            throw new Error(`Firestore Index Required: ${error.message}`);
        }
        throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }
}
