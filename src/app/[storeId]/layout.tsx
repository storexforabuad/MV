'use client';

import { useEffect, useState } from 'react';
import StoreNotificationListener from '@/components/listeners/StoreNotificationListener';
import { OrderReadyNotificationProvider } from '@/context/OrderReadyNotificationContext';
import { ReadyOrdersNotificationModal } from '@/components/modals/ReadyOrdersNotificationModal';
import { getSubscriptionStatus } from '@/app/actions/subscriptionActions';
import { isTrialExpired } from '@/types/subscription';
import { Loader2, Store, Lock } from 'lucide-react';

export default function StoreLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { storeId: string };
}) {
    const [isStoreAvailable, setIsStoreAvailable] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStoreStatus = async () => {
            try {
                const subData = await getSubscriptionStatus(params.storeId);

                if (!subData) {
                    // Store doesn't exist or error
                    setIsStoreAvailable(false);
                    setIsLoading(false);
                    return;
                }

                const { status, trialEndsAt } = subData;

                // Check for expired trial
                if (status === 'trial' && trialEndsAt) {
                    // Convert Firestore timestamp to Date if needed
                    const endDate = trialEndsAt.toDate ? trialEndsAt.toDate() : new Date(trialEndsAt);
                    if (isTrialExpired(endDate)) {
                        setIsStoreAvailable(false);
                        setIsLoading(false);
                        return;
                    }
                }

                // Check for expired subscription
                if (status === 'expired' || status === 'cancelled') {
                    setIsStoreAvailable(false);
                    setIsLoading(false);
                    return;
                }

                setIsStoreAvailable(true);
            } catch (error) {
                console.error('Error checking store status:', error);
                // In case of error, we might want to default to available or show error
                // For now, let's assume available to not block valid stores on transient errors
                setIsStoreAvailable(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkStoreStatus();
    }, [params.storeId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isStoreAvailable) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
                <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                    <Store className="w-10 h-10 text-zinc-400" />
                    <div className="absolute bg-red-500 rounded-full p-1.5 translate-x-6 translate-y-6 border-4 border-zinc-50 dark:border-zinc-950">
                        <Lock className="w-4 h-4 text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Store Unavailable</h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
                    This store is currently unavailable. Please check back later or contact the store owner.
                </p>
            </div>
        );
    }

    return (
        <OrderReadyNotificationProvider>
            <StoreNotificationListener storeId={params.storeId} />
            <ReadyOrdersNotificationModal />
            {children}
        </OrderReadyNotificationProvider>
    );
}
