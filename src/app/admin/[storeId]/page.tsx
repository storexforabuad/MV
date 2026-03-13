import { Metadata } from 'next';
import {
    getStoreMetaAdmin,
    getProductsAdmin,
    getCategoriesAdmin,
    getContactsAdmin,
    getReferralsAdmin
} from '../../../lib/db-admin';
import {
    fetchStoreOrders,
    getRevenueAnalytics,
    getReadyForDeliveryOrders
} from '@/app/actions/orderActions';
import { getCommissionAnalytics } from '@/app/actions/commissionActions';
import AdminStorePageClient from './AdminStorePageClient';

type PageProps = {
    params: Promise<{ storeId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { storeId } = await params;
    const store = await getStoreMetaAdmin(storeId);
    return {
        title: `Admin: ${store?.name || 'Dashboard'}`,
        description: `Admin dashboard for ${store?.name || 'your store'}`,
        manifest: `/api/manifest?storeId=${storeId}&context=admin`,
    };
}

export default async function AdminStorePage({ params }: PageProps) {
    const { storeId } = await params;

    // Parallel data fetching for maximum performance
    const [
        products,
        categories,
        contacts,
        storeMeta,
        referrals,
        commissionAnalytics,
        revenueAnalytics,
        deliveryOrders,
        orders
    ] = await Promise.all([
        getProductsAdmin(storeId),
        getCategoriesAdmin(storeId),
        getContactsAdmin(storeId),
        getStoreMetaAdmin(storeId),
        getReferralsAdmin(storeId),
        getCommissionAnalytics(storeId),
        getRevenueAnalytics(storeId),
        getReadyForDeliveryOrders(storeId),
        fetchStoreOrders(storeId)
    ]);

    // Helper to serialize objects with hidden methods/prototypes (like Firestore Timestamps)
    // so they can be safely passed to Client Components
    const serializeData = <T,>(data: T): T => {
        if (!data) return data;
        return JSON.parse(JSON.stringify(data));
    };

    return (
        <AdminStorePageClient
            storeId={storeId}
            initialProducts={serializeData(products)}
            initialCategories={serializeData(categories)}
            initialContacts={serializeData(contacts)}
            initialStoreMeta={serializeData(storeMeta)}
            initialReferrals={serializeData(referrals)}
            initialCommissionAnalytics={serializeData(commissionAnalytics)}
            initialRevenueAnalytics={serializeData(revenueAnalytics)}
            initialDeliveryOrders={serializeData(deliveryOrders)}
            initialOrders={serializeData(orders)}
        />
    );
}
