'use server';

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

export interface MediaRegistrationData {
    id?: string;
    name: string;
    email: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    paymentType: 'paid' | 'free';
    discountCode?: string | null;
    paystackRef?: string | null;
    source?: 'media' | 'newmedia' | string; // New: track which landing page was used
    registeredAt?: Timestamp;
    whatsappNotified?: boolean;
}

/** Case-insensitive discount code check. */
export async function validateDiscountCode(code: string): Promise<boolean> {
    const validCodes = ['fatimahbcn', 'mgl10'];
    return validCodes.includes(code.trim().toLowerCase());
}

/** Check if email is already registered. */
export async function checkDuplicateEmail(email: string): Promise<boolean> {
    const snap = await getDocs(
        query(collection(db, 'mediaRegistrations'), where('email', '==', email.toLowerCase().trim()))
    );
    return !snap.empty;
}

/** Save a new influencer registration to Firestore. */
export async function saveMediaRegistration(
    data: Omit<MediaRegistrationData, 'id' | 'registeredAt' | 'whatsappNotified'>
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        // Duplicate guard
        const isDuplicate = await checkDuplicateEmail(data.email);
        if (isDuplicate) {
            return { success: false, error: 'This email is already registered.' };
        }

        const docRef = await addDoc(collection(db, 'mediaRegistrations'), {
            name: data.name.trim(),
            email: data.email.toLowerCase().trim(),
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
            paymentType: data.paymentType,
            discountCode: data.discountCode || null,
            paystackRef: data.paystackRef || null,
            source: data.source || 'media',
            registeredAt: Timestamp.now(),
            whatsappNotified: true,
        });

        return { success: true, id: docRef.id };
    } catch (err) {
        console.error('[saveMediaRegistration] error:', err);
        return { success: false, error: 'Failed to save registration. Please try again.' };
    }
}

/** Fetch all registrations for /mediadashboard, newest first. */
export async function getMediaRegistrations(): Promise<MediaRegistrationData[]> {
    try {
        const snap = await getDocs(
            query(collection(db, 'mediaRegistrations'), orderBy('registeredAt', 'desc'))
        );
        return snap.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<MediaRegistrationData, 'id'>),
        }));
    } catch (err) {
        console.error('[getMediaRegistrations] error:', err);
        return [];
    }
}

/** Get a simple count of registrations by type. */
export async function getRegistrationStats(): Promise<{ total: number; paid: number; free: number }> {
    const all = await getMediaRegistrations();
    return {
        total: all.length,
        paid: all.filter(r => r.paymentType === 'paid').length,
        free: all.filter(r => r.paymentType === 'free').length,
    };
}
