'use client';

import ProductDetailSkeleton from '../../../../components/ProductDetailSkeleton';
import Navbar from '../../../../components/layout/navbar';
import { useParams } from 'next/navigation';

export default function Loading() {
    const params = useParams();
    const storeId = typeof params?.storeId === 'string' ? params.storeId : Array.isArray(params?.storeId) ? params.storeId[0] : undefined;

    return (
        <>
            <Navbar storeId={storeId} storeName="Loading..." />
            <ProductDetailSkeleton />
        </>
    );
}
