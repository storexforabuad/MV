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

export interface ReferralNotification {
    id: string;
    type: 'registration' | 'subscription' | 'milestone';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

export interface ReferralStoreStats {
    id: string;
    name: string;
    logo?: string;
    status: string;
    subscriptionTier: string;
    referralDate: string;
    trialEndsAt?: string;
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

export interface ReferralRegistration {
    id: string;
    businessName: string;
    storeType: string;
    status: string;
    createdAt: string;
    referralCode: string;
}

export interface ReferralDashboardData {
    referralCode: string;
    summary: {
        totalRegistrations: number;
        activeStores: number;
        totalViews: number;
        totalWeeklyCommission: number;
    };
    tier: {
        name: 'Novice' | 'Pro' | 'Elite';
        commissionPercentage: number;
        nextTierThreshold: number | null;
        progress: number; // 0 to 100
    };
    registrations: ReferralRegistration[];
    stores: ReferralStoreStats[];
    notifications: ReferralNotification[];
}

export async function getReferralDashboardData(referralCode: string): Promise<ReferralDashboardData> {
    try {
        // 1. Fetch Registrations
        const regsQuery = query(
            collection(db, 'registrations'),
            where('referralCode', '==', referralCode)
        );
        const regsSnapshot = await getDocs(regsQuery);
        const registrations: ReferralRegistration[] = regsSnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    businessName: data.businessName || 'Unknown Business',
                    storeType: data.storeType || 'General',
                    status: data.status || 'pending',
                    referralCode: data.referralCode || '',
                    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
                };
            })
            .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            });

        // 2. Fetch Stores
        const storesQuery = query(
            collection(db, 'stores'),
            where('referralCode', '==', referralCode)
        );
        const storesSnapshot = await getDocs(storesQuery);

        const activeStoresCount = storesSnapshot.docs.filter(d => d.data().subscriptionStatus === 'active').length;

        // Calculate Tier
        let tierName: 'Novice' | 'Pro' | 'Elite' = 'Novice';
        let commissionPercentage = 10;
        let nextTierThreshold: number | null = 3;
        let progress = (activeStoresCount / 3) * 100;

        if (activeStoresCount >= 11) {
            tierName = 'Elite';
            commissionPercentage = 30;
            nextTierThreshold = null;
            progress = 100;
        } else if (activeStoresCount >= 3) {
            tierName = 'Pro';
            commissionPercentage = 20;
            nextTierThreshold = 11;
            progress = ((activeStoresCount - 3) / (11 - 3)) * 100;
        }

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
            const status = data.subscriptionStatus || 'trial';
            const tier = data.subscriptionTier as keyof typeof TIER_DETAILS;
            const tierInfo = TIER_DETAILS[tier];
            const weeklyFee = tierInfo ? (tierInfo.price / 2) : 0; // Halved price as per logic in registration
            const referralDate = (data.referralDate as Timestamp)?.toDate() || new Date();
            const isEligible = isWithinInterval(now, {
                start: referralDate,
                end: addYears(referralDate, 1)
            });

            // Only calculate commission if store is active (subscribed)
            const weeklyCommission = (isEligible && status === 'active') ? (weeklyFee * (commissionPercentage / 100)) : 0;

            return {
                id: storeId,
                name: data.name,
                logo: data.logo,
                status: status,
                subscriptionTier: data.subscriptionTier || 'basic',
                referralDate: referralDate.toISOString(),
                trialEndsAt: (data.trialEndsAt as Timestamp)?.toDate().toISOString(),
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
            activeStores: activeStoresCount,
            totalViews: stores.reduce((sum, s) => sum + s.weeklyPerformance.views.current, 0),
            totalWeeklyCommission: stores.reduce((sum, s) => sum + s.commission.weeklyAmount, 0)
        };

        // 4. Notifications (Placeholder for now, could be fetched from a collection)
        const notifications: ReferralNotification[] = [];

        // Auto-generate some notifications based on recent activity for "Magic" feel
        registrations.slice(0, 5).forEach(reg => {
            notifications.push({
                id: `reg-${reg.id}`,
                type: 'registration',
                title: 'New Registration',
                message: `${reg.businessName} just joined using your link!`,
                timestamp: reg.createdAt,
                read: false
            });
        });

        return {
            referralCode,
            summary,
            tier: {
                name: tierName,
                commissionPercentage,
                nextTierThreshold,
                progress
            },
            registrations,
            stores,
            notifications: notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
