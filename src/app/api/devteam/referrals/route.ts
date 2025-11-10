
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjusted import path for app router
import { collectionGroup, getDocs, query } from 'firebase/firestore';

// Define the shape of a referral object for the response
interface Referral {
  id: string;
  status: 'pending' | 'activated';
  businessName: string;
  referrerStoreId: string; // The ID of the store that made the referral
  refereeStoreId?: string;
  activatedAt?: Date;
  createdAt?: Date;
}

// Handler for GET requests
export async function GET() {
  try {
    // This is the collection group query. It looks for all collections named 'referrals'.
    const referralsQuery = query(
      collectionGroup(db, 'referrals')
    );

    const querySnapshot = await getDocs(referralsQuery);

    const allReferrals: Referral[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // The parent of the 'referrals' subcollection is the store document.
      const referrerStoreId = doc.ref.parent.parent?.id;

      if (referrerStoreId) {
        allReferrals.push({
          id: doc.id,
          referrerStoreId: referrerStoreId,
          status: data.status || 'pending',
          businessName: data.businessName,
          refereeStoreId: data.refereeStoreId,
          // Convert Firestore Timestamps to JS Date objects for the API response
          activatedAt: data.activatedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        });
      }
    });

    // Sort referrals to show pending ones first, then by creation date
    allReferrals.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(allReferrals, { status: 200 });

  } catch (error) {
    console.error('Error fetching all referrals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// To prevent other methods from being used
export async function POST() {
    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
