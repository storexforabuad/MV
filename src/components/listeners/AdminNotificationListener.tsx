'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { NewOrderModal } from '@/components/admin/modals/NewOrderModal';

export default function AdminNotificationListener({ storeId }: { storeId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notificationData, setNotificationData] = useState<{
        orderId: string;
        customerName: string;
    } | null>(null);
    const router = useRouter();

    useEffect(() => {
        console.log('[AdminListener] Mounted for store:', storeId);
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const setupNotifications = async () => {
                try {
                    // Request permission
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        console.log('[AdminListener] Permission denied');
                        return;
                    }

                    const messaging = getMessaging(app);

                    // Get Token
                    const token = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                    });

                    if (token) {
                        console.log('[AdminListener] Got FCM token:', token);
                        // Save token to store
                        const { getFirestore, doc, updateDoc, arrayUnion } = await import('firebase/firestore');
                        const db = getFirestore(app);
                        const storeRef = doc(db, 'stores', storeId);
                        await updateDoc(storeRef, {
                            adminTokens: arrayUnion(token)
                        });
                        console.log('[AdminListener] Token saved to store');
                    }

                    // Listen for messages
                    const unsubscribe = onMessage(messaging, (payload) => {
                        console.log('[AdminListener] Message received:', payload);

                        if (payload.data?.type === 'new_order') {
                            const { orderId, storeId: msgStoreId } = payload.data;
                            const customerName = payload.notification?.body?.split(' placed')[0] || 'A customer';

                            // Only show if it matches the current store context
                            if (msgStoreId === storeId) {
                                setNotificationData({
                                    orderId,
                                    customerName
                                });
                                setIsOpen(true);
                            }
                        }
                    });
                    return () => unsubscribe();
                } catch (error) {
                    console.error('[AdminListener] Error setting up listener:', error);
                }
            };

            setupNotifications();
        }
    }, [storeId]);

    const handleViewOrder = () => {
        if (notificationData) {
            setIsOpen(false);
            router.push(`/admin/${storeId}?open=orders&orderId=${notificationData.orderId}`);
        }
    };

    if (!notificationData) return null;

    return (
        <NewOrderModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onViewOrder={handleViewOrder}
            orderId={notificationData.orderId}
            customerName={notificationData.customerName}
        />
    );
}
