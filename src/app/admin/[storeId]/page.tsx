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

    return (
        <AdminStorePageClient
            storeId={storeId}
            initialProducts={products}
            initialCategories={categories}
            initialContacts={contacts}
            initialStoreMeta={storeMeta}
            initialReferrals={referrals}
            initialCommissionAnalytics={commissionAnalytics}
            initialRevenueAnalytics={revenueAnalytics}
            initialDeliveryOrders={deliveryOrders}
            initialOrders={orders}
        />
    );
}
