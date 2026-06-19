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
        description: store?.description || 'Your one-stop destination for curated collections on Compass 🧭',
        manifest: `/api/manifest?storeId=${params.storeId}&context=customer`,
    };
}

import {
    getStoreMetaAdminCached,
    getCategoriesAdminCached,
    getProductsAdmin
} from '@/lib/db-admin';

// ... imports

export default async function StorefrontPage({ params, searchParams }: PageProps) {
    const [storeMeta, categories, allProducts] = await Promise.all([
        getStoreMetaAdminCached(params.storeId),
        getCategoriesAdminCached(params.storeId),
        getProductsAdmin(params.storeId)
    ]);

    const searchParamsObj = await searchParams;
    const initialCategory = (searchParamsObj?.category as string) || 'all';

    return (
        <StorefrontPageClient
            storeId={params.storeId}
            initialStoreMeta={storeMeta}
            initialCategories={categories}
            initialProducts={allProducts}
            initialCategory={initialCategory}
        />
    );
}
