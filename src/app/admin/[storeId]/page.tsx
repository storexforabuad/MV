import { Metadata } from 'next';
import { getStoreMetaAdmin } from '../../../lib/db-admin';
import AdminStorePageClient from './AdminStorePageClient';

type PageProps = {
  params: { storeId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const store = await getStoreMetaAdmin(params.storeId);
    return {
        title: `Admin: ${store?.name || 'Dashboard'}`,
        description: `Admin dashboard for ${store?.name || 'your store'}`,
        manifest: `/api/manifest?storeId=${params.storeId}&context=admin`,
    };
}

export default function AdminStorePage({ params }: PageProps) {
    return <AdminStorePageClient storeId={params.storeId} />;
}
