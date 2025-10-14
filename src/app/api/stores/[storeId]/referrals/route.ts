import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

// POST new referral for a store
export async function POST(
  req: NextRequest, 
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  if (!storeId) {
    return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
  }

  try {
    const { businessName, businessNumber } = await req.json();

    if (!businessName || !businessNumber) {
      return NextResponse.json({ error: 'Business name and number are required' }, { status: 400 });
    }

    const referralData = {
      businessName,
      businessNumber,
      createdAt: Timestamp.now(),
    };

    const referralsCollectionRef = collection(db, 'stores', storeId, 'referrals');
    const docRef = await addDoc(referralsCollectionRef, referralData);

    return NextResponse.json({ message: 'Referral submitted successfully', id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error adding referral:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET all referrals for a store
export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  if (!storeId) {
    return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
  }

  try {
    const referralsCollectionRef = collection(db, 'stores', storeId, 'referrals');
    const querySnapshot = await getDocs(referralsCollectionRef);

    const referrals = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = (data.createdAt && data.createdAt.seconds !== undefined)
        ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
        : { seconds: 0, nanoseconds: 0 };

      return {
        id: doc.id,
        businessName: data.businessName,
        businessNumber: data.businessNumber,
        createdAt: createdAt,
      };
    });

    return NextResponse.json(referrals, { status: 200 });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}