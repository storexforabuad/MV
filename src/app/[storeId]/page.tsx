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

import {
    getStoreMetaAdminCached,
    getCategoriesAdminCached,
    getPromoProductsAdmin
} from '@/lib/db-admin';

// ... imports

export default async function StorefrontPage({ params, searchParams }: PageProps) {
    const [storeMeta, categories, promoProducts] = await Promise.all([
        getStoreMetaAdminCached(params.storeId),
        getCategoriesAdminCached(params.storeId),
        getPromoProductsAdmin(params.storeId)
    ]);

    const searchParamsObj = await searchParams;
    const initialCategory = (searchParamsObj?.category as string) || 'promo';

    return (
        <StorefrontPageClient
            storeId={params.storeId}
            initialStoreMeta={storeMeta}
            initialCategories={categories}
            initialProducts={promoProducts}
            initialCategory={initialCategory}
        />
    );
}
