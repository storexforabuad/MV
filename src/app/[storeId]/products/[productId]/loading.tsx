'use client';

import ProductDetailSkeleton from '../../../../components/ProductDetailSkeleton';
import Navbar from '../../../../components/layout/navbar';

export default function Loading() {
    return (
        <>
            <Navbar storeName="Loading..." />
            <ProductDetailSkeleton />
        </>
    );
}
