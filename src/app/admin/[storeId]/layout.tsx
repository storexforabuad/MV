import AdminNotificationListener from '@/components/listeners/AdminNotificationListener';

export default function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { storeId: string };
}) {
    return (
        <>
            <AdminNotificationListener storeId={params.storeId} />
            {children}
        </>
    );
}
