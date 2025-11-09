
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin'; // Corrected import path

// Tiers based on active referrals count
const TIERS = {
  PLATINUM: { min: 20, name: 'platinum' },
  GOLD: { min: 15, name: 'gold' },
  SILVER: { min: 5, name: 'silver' },
  BRONZE: { min: 0, name: 'bronze' },
};

const getTier = (referralCount: number): string => {
  if (referralCount >= TIERS.PLATINUM.min) return TIERS.PLATINUM.name;
  if (referralCount >= TIERS.GOLD.min) return TIERS.GOLD.name;
  if (referralCount >= TIERS.SILVER.min) return TIERS.SILVER.name;
  return TIERS.BRONZE.name;
};

export async function POST(request: Request) {
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { referrerStoreId, referralId, newRefereeStoreId } = body;

    if (!referrerStoreId || !referralId || !newRefereeStoreId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Update the referral document
    const referralRef = adminDb.doc(`stores/${referrerStoreId}/referrals/${referralId}`);
    
    const now = new Date();
    const commissionEndDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    await referralRef.update({
      status: 'activated',
      refereeStoreId: newRefereeStoreId,
      activatedAt: FieldValue.serverTimestamp(),
      commissionEndDate: commissionEndDate,
    });

    // 2. Update the referrer's store document
    const referrerStoreRef = adminDb.doc(`stores/${referrerStoreId}`);
    
    // Get the current referral count before incrementing
    const storeSnap = await referrerStoreRef.get();
    if (!storeSnap.exists) {
        throw new Error(`Referrer store with ID ${referrerStoreId} not found.`);
    }
    const currentReferrals = storeSnap.data()?.activeReferrals || 0;
    const newReferralCount = currentReferrals + 1;

    // Determine the new tier
    const newTier = getTier(newReferralCount);

    await referrerStoreRef.update({
      activeReferrals: FieldValue.increment(1),
      ambassadorTier: newTier,
    });

    return NextResponse.json({ message: 'Referral activated successfully', newTier: newTier });

  } catch (error) {
    console.error('Error activating referral:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
