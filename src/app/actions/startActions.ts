'use server';

import { db } from '@/lib/db';
import { collection, addDoc, Timestamp, doc, setDoc } from 'firebase/firestore';

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
            category,
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
    // Mock implementation for now, reusing the structure of ReferralDashboardData
    // In a real app, this would fetch from DB and calculate based on 4.5% commission

    // We can reuse the existing getReferralDashboardData logic but override the commission calculation
    // For now, let's return a mock structure that matches ReferralDashboardData

    return {
        referralCode,
        summary: {
            totalRegistrations: 12,
            activeStores: 5,
            totalViews: 1250,
            totalWeeklyCommission: 45000 // Mocked
        },
        tier: {
            name: 'Pro',
            commissionPercentage: 20,
            nextTierThreshold: 11,
            progress: 45
        },
        registrations: [],
        stores: [],
        notifications: []
    };
}
