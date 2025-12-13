'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { OrderUpdateModal } from '@/components/modals/OrderUpdateModal';
import toast from 'react-hot-toast';

export default function StoreNotificationListener({ storeId }: { storeId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notificationData, setNotificationData] = useState<{
        orderId: string;
        status: 'shipped' | 'ready' | 'partially-ready';
        storeName?: string;
    } | null>(null);
    const router = useRouter();

    useEffect(() => {
        console.log('[StoreListener] Mounted for store:', storeId);
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            try {
                const messaging = getMessaging(app);
                const unsubscribe = onMessage(messaging, (payload) => {
                    console.log('[StoreListener] Message received:', payload);
                    console.log('[StoreListener] Data:', payload.data);

                    if (payload.data?.type === 'order_status_update') {
                        const { orderId, newStatus, storeId: msgStoreId } = payload.data;
                        console.log(`[StoreListener] Comparing storeId: ${storeId} with msgStoreId: ${msgStoreId}`);

                        // Only show if it matches the current store context or if we want global notifications
                        // For now, let's show it if we are in the store context
                        if (msgStoreId === storeId) {
                            console.log('[StoreListener] Match found! Opening modal.');
                            setNotificationData({
                                orderId,
                                status: newStatus as 'shipped' | 'ready' | 'partially-ready',
                                storeName: payload.notification?.title?.includes('from')
                                    ? payload.notification.title.split('from')[1].trim()
                                    : undefined
                            });
                            setIsOpen(true);
                        } else {
                            console.log('[StoreListener] Store ID mismatch.');
                        }
                    }
                });
                return () => unsubscribe();
            } catch (error) {
                console.error('[StoreListener] Error setting up listener:', error);
            }
        }
    }, [storeId]);

    const handleViewOrder = () => {
        if (notificationData) {
            setIsOpen(false);
            router.push(`/${storeId}?open=orders&orderId=${notificationData.orderId}`);
        }
    };

    if (!notificationData) return null;

    return (
        <OrderUpdateModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onViewOrder={handleViewOrder}
            orderId={notificationData.orderId}
            status={notificationData.status}
            storeName={notificationData.storeName}
        />
    );
}
