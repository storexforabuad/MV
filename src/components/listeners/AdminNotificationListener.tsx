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
            try {
                const messaging = getMessaging(app);
                const unsubscribe = onMessage(messaging, (payload) => {
                    console.log('[AdminListener] Message received:', payload);

                    if (payload.data?.type === 'new_order') {
                        const { orderId, storeId: msgStoreId } = payload.data;
                        console.log(`[AdminListener] Comparing storeId: ${storeId} with msgStoreId: ${msgStoreId}`);
                        const customerName = payload.notification?.body?.split(' placed')[0] || 'A customer';

                        // Only show if it matches the current store context
                        if (msgStoreId === storeId) {
                            console.log('[AdminListener] Match found! Opening modal.');
                            setNotificationData({
                                orderId,
                                customerName
                            });
                            setIsOpen(true);
                        } else {
                            console.log('[AdminListener] Store ID mismatch.');
                        }
                    }
                });
                return () => unsubscribe();
            } catch (error) {
                console.error('[AdminListener] Error setting up listener:', error);
            }
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
