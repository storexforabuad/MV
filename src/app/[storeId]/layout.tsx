import StoreNotificationListener from '@/components/listeners/StoreNotificationListener';

export default function StoreLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { storeId: string };
}) {
    return (
        <>
            <StoreNotificationListener storeId={params.storeId} />
            {children}
        </>
    );
}
