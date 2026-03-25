import { Product, GeneralProduct, VehicleProduct, FashionProduct, LivestockProduct, FoodBeverageProduct, ElectronicsProduct, SolarProduct } from '../types/product';

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

export function isFashionProduct(product: Product): product is FashionProduct {
    return product.productType === 'fashion';
}

export function isLivestockProduct(product: Product): product is LivestockProduct {
    return product.productType === 'livestock';
}

export function isFoodBeverageProduct(product: Product): product is FoodBeverageProduct {
    return product.productType === 'food';
}

export function isElectronicsProduct(product: Product): product is ElectronicsProduct {
    return product.productType === 'electronics';
}

export function isSolarProduct(product: Product): product is SolarProduct {
    return product.productType === 'solar';
}

export function isMediaInfluencerProduct(product: Product): product is any {
    return product.productType === 'media-influencer';
}
