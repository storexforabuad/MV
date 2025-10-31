import { Metadata } from 'next';
import { getStoreMetaAdmin } from '@/lib/db-admin';
import StorefrontPageClient from './StorefrontPageClient';

type PageProps = {
  params: { storeId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const store = await getStoreMetaAdmin(params.storeId);
    return {
        title: store?.name || 'Store',
        description: store?.description || 'Welcome to our store',
        manifest: `/api/manifest?storeId=${params.storeId}&context=customer`,
    };
}

export default function StorefrontPage({ params }: PageProps) {
    return <StorefrontPageClient storeId={params.storeId} />;
}
