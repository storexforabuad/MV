import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    where,
    Timestamp,
} from 'firebase/firestore';

export interface MediaRegistration {
    id?: string;
    name: string;
    email: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    paymentType: 'paid' | 'free';
    discountCode?: string;
    paystackRef?: string;
    registeredAt: Timestamp | Date;
    whatsappNotified: boolean;
}

/**
 * POST /api/media-registrations
 * Saves a new influencer registration after payment / discount code.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as Omit<MediaRegistration, 'id' | 'registeredAt' | 'whatsappNotified'>;

        const { name, email, bankName, accountNumber, accountName, paymentType } = body;
        if (!name || !email || !bankName || !accountNumber || !accountName || !paymentType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Duplicate email guard
        const registrationsRef = collection(db, 'mediaRegistrations');
        const existing = await getDocs(query(registrationsRef, where('email', '==', email.toLowerCase().trim())));
        if (!existing.empty) {
            return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
        }

        const docRef = await addDoc(registrationsRef, {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            bankName,
            accountNumber,
            accountName,
            paymentType,
            discountCode: body.discountCode || null,
            paystackRef: body.paystackRef || null,
            registeredAt: Timestamp.now(),
            whatsappNotified: true, // We open WhatsApp client-side
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (err) {
        console.error('[media-registrations POST] error:', err);
        return NextResponse.json({ error: 'Failed to save registration' }, { status: 500 });
    }
}

/**
 * GET /api/media-registrations
 * Returns all registrations ordered by most recent first.
 */
export async function GET() {
    try {
        const snap = await getDocs(
            query(collection(db, 'mediaRegistrations'), orderBy('registeredAt', 'desc'))
        );

        const registrations: MediaRegistration[] = snap.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<MediaRegistration, 'id'>),
        }));

        return NextResponse.json({ success: true, registrations });
    } catch (err) {
        console.error('[media-registrations GET] error:', err);
        return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }
}
