import { Product, GeneralProduct, VehicleProduct } from '../types/product';

// Migration Helper for Legacy Products
export function ensureProductType(product: any): Product {
    // If product doesn't have productType, treat as 'general'
    if (!product.productType) {
        return { ...product, productType: 'general' } as GeneralProduct;
    }
    return product as Product;
}

// Type Guard Helpers
export function isGeneralProduct(product: Product): product is GeneralProduct {
    return product.productType === 'general' || !product.productType;
}

export function isVehicleProduct(product: Product): product is VehicleProduct {
    return product.productType === 'vehicle';
}
