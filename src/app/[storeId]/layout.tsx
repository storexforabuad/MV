'use client';

import StoreNotificationListener from '@/components/listeners/StoreNotificationListener';
import { OrderReadyNotificationProvider } from '@/context/OrderReadyNotificationContext';
import { ReadyOrdersNotificationModal } from '@/components/modals/ReadyOrdersNotificationModal';

export default function StoreLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { storeId: string };
}) {
    return (
        <OrderReadyNotificationProvider>
            <StoreNotificationListener storeId={params.storeId} />
            <ReadyOrdersNotificationModal />
            {children}
        </OrderReadyNotificationProvider>
    );
}
