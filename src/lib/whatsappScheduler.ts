
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { app as firebaseApp } from './firebase';
import { WholesaleData } from './db';

const db = getFirestore(firebaseApp);

export const scheduleWhatsappMessage = async (
    storeId: string, 
    message: string, 
    imageUrl: string, 
    contacts: WholesaleData[], 
    scheduledTime: Date, 
    recurrence: 'none' | 'daily' | 'weekly'
) => {
    try {
        await addDoc(collection(db, 'stores', storeId, 'whatsappSchedules'), {
            storeId,
            message,
            imageUrl,
            contacts,
            scheduledTime: Timestamp.fromDate(scheduledTime),
            status: 'scheduled',
            recurrence,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to schedule WhatsApp message:", error);
        return { success: false, error };
    }
};
