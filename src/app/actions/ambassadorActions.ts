'use server';

import { db } from '@/lib/db';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

export interface AmbassadorProfile {
    referralCode: string;
    name: string;
    email: string;
    whatsapp: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankName?: string;
    bankCode?: string;
    paystackSubaccountCode?: string;
    createdAt: string;
    updatedAt: string;
}

export async function getAmbassadorProfile(referralCode: string): Promise<AmbassadorProfile | null> {
    try {
        const ambassadorsRef = collection(db, 'ambassadors');
        const q = query(ambassadorsRef, where('referralCode', '==', referralCode));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return null;
        
        const data = snapshot.docs[0].data();
        return {
            referralCode: data.referralCode,
            name: data.name || '',
            email: data.email || '',
            whatsapp: data.whatsapp || '',
            bankAccountName: data.bankAccountName,
            bankAccountNumber: data.bankAccountNumber,
            bankName: data.bankName,
            bankCode: data.bankCode,
            paystackSubaccountCode: data.paystackSubaccountCode,
            createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString()
        };
    } catch (error) {
        console.error('Error fetching ambassador profile:', error);
        return null;
    }
}

export async function updateAmbassadorProfile(
    referralCode: string,
    profileData: Partial<AmbassadorProfile>
) {
    try {
        // Validate bank details if provided
        if (profileData.bankAccountNumber) {
            const validationError = validateBankDetails({
                accountNumber: profileData.bankAccountNumber,
                accountName: profileData.bankAccountName || '',
                bankCode: profileData.bankCode || ''
            });
            
            if (validationError) {
                throw new Error(validationError);
            }
        }

        const ambassadorsRef = collection(db, 'ambassadors');
        const q = query(ambassadorsRef, where('referralCode', '==', referralCode));
        const snapshot = await getDocs(q);
        
        const docRef = snapshot.docs[0]?.ref || doc(ambassadorsRef, referralCode);
        
        const updateData: any = {
            referralCode,
            name: profileData.name || '',
            email: profileData.email || '',
            whatsapp: profileData.whatsapp || '',
            bankAccountName: profileData.bankAccountName || null,
            bankAccountNumber: profileData.bankAccountNumber || null,
            bankName: profileData.bankName || null,
            bankCode: profileData.bankCode || null,
            paystackSubaccountCode: profileData.paystackSubaccountCode || null,
            updatedAt: Timestamp.now(),
        };

        // Only set createdAt if this is a new document
        if (snapshot.empty) {
            updateData.createdAt = Timestamp.now();
        } else {
            updateData.createdAt = snapshot.docs[0].data().createdAt;
        }

        await setDoc(docRef, updateData, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating ambassador profile:', error);
        throw error;
    }
}

export async function createPaystackSubaccount(ambassadorProfile: AmbassadorProfile) {
    try {
        // Validate bank details
        const validationError = validateBankDetails({
            accountNumber: ambassadorProfile.bankAccountNumber || '',
            accountName: ambassadorProfile.bankAccountName || '',
            bankCode: ambassadorProfile.bankCode || ''
        });

        if (validationError) {
            return { success: false, error: validationError };
        }

        // Call your backend API endpoint to create Paystack subaccount
        const response = await fetch('/api/paystack/create-subaccount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                business_name: ambassadorProfile.name,
                settlement_bank: ambassadorProfile.bankCode,
                account_number: ambassadorProfile.bankAccountNumber,
                subaccount_type: 'individual',
                first_name: ambassadorProfile.name.split(' ')[0],
                last_name: ambassadorProfile.name.split(' ')[1] || '',
                phone: ambassadorProfile.whatsapp,
                email: ambassadorProfile.email
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return { success: false, error: data.message || 'Failed to create subaccount' };
        }

        if (data.subaccount_code) {
            // Update ambassador profile with subaccount code
            await updateAmbassadorProfile(ambassadorProfile.referralCode, {
                paystackSubaccountCode: data.subaccount_code
            });
            return { success: true, subaccountCode: data.subaccount_code };
        }
        
        return { success: false, error: data.message || 'No subaccount code returned' };
    } catch (error: any) {
        console.error('Error creating Paystack subaccount:', error);
        return { success: false, error: error.message || 'Failed to create subaccount' };
    }
}

function validateBankDetails(details: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
}): string | null {
    if (!details.accountNumber || !details.accountName || !details.bankCode) {
        return 'Bank details are incomplete. Please provide account number, name, and bank code.';
    }

    // Validate Nigerian bank account (10 digits)
    if (!/^\d{10}$/.test(details.accountNumber)) {
        return 'Bank account number must be 10 digits.';
    }

    if (details.accountName.trim().length < 3) {
        return 'Account name must be at least 3 characters.';
    }

    if (!/^\d{3}$/.test(details.bankCode)) {
        return 'Bank code must be 3 digits.';
    }

    return null;
}
