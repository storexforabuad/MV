import { Product } from '@/types/product';
import { CaptionTemplate } from '@/types/socialPost';

/**
 * Generates hashtags based on product category and type
 */
function generateHashtags(product: Product, storeName: string): string[] {
    const hashtags: string[] = [];

    // Store name hashtag
    const storeHashtag = storeName.replace(/\s+/g, '');
    if (storeHashtag) hashtags.push(`#${storeHashtag}`);

    // Category hashtag
    if (product.productType === 'general' && product.category) {
        const categoryTag = product.category.replace(/\s+/g, '');
        if (categoryTag) hashtags.push(`#${categoryTag}`);
    }

    // Product type specific hashtags
    if (product.productType === 'vehicle') {
        const { make, model, bodyType, condition } = product.vehicleDetails;
        hashtags.push(`#${make}`, `#${model}`);
        if (bodyType) hashtags.push(`#${bodyType}`);
        if (condition === 'brand-new') hashtags.push('#BrandNew');
        hashtags.push('#CarsForSale', '#NigerianCars', '#AutoDeals');
    } else {
        hashtags.push('#OnlineShopping', '#ShopNigeria', '#NigerianBusiness');
    }

    return hashtags.slice(0, 10); // Limit to 10 hashtags
}

/**
 * Formats price with discount if on promo
 */
function formatPrice(product: Product): string {
    const currentPrice = `₦${product.price.toLocaleString()}`;

    if (product.onPromo && product.originalPrice && product.originalPrice > product.price) {
        const strikethrough = `~~₦${product.originalPrice.toLocaleString()}~~`;
        return `${strikethrough} ${currentPrice}`;
    }

    return currentPrice;
}

/**
 * Casual/Friendly Template - Emoji-heavy, conversational
 */
const casualTemplate: CaptionTemplate = {
    id: 'casual',
    name: 'Casual & Friendly',
    style: 'casual',
    generate: (product: Product, storeName: string, storeId: string) => {
        const price = formatPrice(product);
        const hashtags = generateHashtags(product, storeName);

        if (product.productType === 'vehicle') {
            const { make, model, year, condition } = product.vehicleDetails;
            return `🚗 ${make} ${model} ${year} 🚗

${condition === 'brand-new' ? '✨ Brand New!' : '🔥 Great Condition!'}

💰 ${price}

${product.description.slice(0, 100)}${product.description.length > 100 ? '...' : ''}

📲 Order now: https://tinyurl.com/bizcononline/${storeId}/products/${product.id}

${hashtags.join(' ')}`;
        }

        return `🔥 ${product.name}

${product.description.slice(0, 120)}${product.description.length > 120 ? '...' : ''}

💰 ${price}
${product.onPromo ? '🎉 Special Promo!' : ''}

📦 Order now: https://tinyurl.com/bizcononline/${storeId}/products/${product.id}

${hashtags.join(' ')}`;
    },
};

/**
 * Professional Template - Clean, business-like
 */
const professionalTemplate: CaptionTemplate = {
    id: 'professional',
    name: 'Professional',
    style: 'professional',
    generate: (product: Product, storeName: string, storeId: string) => {
        const price = formatPrice(product);
        const hashtags = generateHashtags(product, storeName);

        if (product.productType === 'vehicle') {
            const { make, model, year, mileage, transmission, fuelType } = product.vehicleDetails;
            return `${make} ${model} ${year}

Key Features:
• ${transmission} transmission
• ${fuelType} engine
• ${mileage.toLocaleString()} km mileage

Price: ${price}

${product.description.slice(0, 150)}${product.description.length > 150 ? '...' : ''}

View details: https://tinyurl.com/bizcononline/${storeId}/products/${product.id}

${hashtags.join(' ')}`;
        }

        return `${product.name}

${product.description.slice(0, 180)}${product.description.length > 180 ? '...' : ''}

Price: ${price}
${product.onPromo ? '\n🎯 Limited time offer' : ''}

Shop now: https://tinyurl.com/bizcononline/${storeId}/products/${product.id}

${hashtags.join(' ')}`;
    },
};

/**
 * Promotional Template - Urgency, discounts, CTAs
 */
const promotionalTemplate: CaptionTemplate = {
    id: 'promotional',
    name: 'Promotional',
    style: 'promotional',
    generate: (product: Product, storeName: string, storeId: string) => {
        const price = formatPrice(product);
        const hashtags = generateHashtags(product, storeName);

        // Check for urgency factors
        const isLimitedStock = product.productType === 'general' && product.limitedStock;
        const isOnPromo = product.onPromo;

        if (product.productType === 'vehicle') {
            const { make, model, year } = product.vehicleDetails;
            return `🚨 DON'T MISS OUT! 🚨

${make} ${model} ${year}

💥 ${price} 💥

${product.description.slice(0, 100)}${product.description.length > 100 ? '...' : ''}

⚡ Grab this deal before it's gone!

📲 Click to order: https://tinyurl.com/bizcononline/${storeId}/products/${product.id}

${hashtags.join(' ')}`;
        }

        return `${isOnPromo ? '🎉 SPECIAL OFFER! 🎉' : '⚡ DEAL ALERT! ⚡'}

${product.name}

💰 ${price}
${isLimitedStock ? '⏰ Limited Stock!' : ''}
${isOnPromo ? '🔥 Save Now!' : ''}

${product.description.slice(0, 100)}${product.description.length > 100 ? '...' : ''}

👉 Order now before it's gone!
🛒 https://tinyurl.com/bizcononline/${storeId}/products/${product.id}

${hashtags.join(' ')}`;
    },
};

/**
 * Minimalist Template - Simple, straightforward
 */
const minimalistTemplate: CaptionTemplate = {
    id: 'minimalist',
    name: 'Minimalist',
    style: 'minimalist',
    generate: (product: Product, storeName: string, storeId: string) => {
        const price = formatPrice(product);
        const hashtags = generateHashtags(product, storeName).slice(0, 5); // Fewer hashtags

        if (product.productType === 'vehicle') {
            const { make, model, year } = product.vehicleDetails;
            return `${make} ${model} ${year}

${price}

https://tinyurl.com/bizcononline/${storeId}/products/${product.id}

${hashtags.join(' ')}`;
        }

        return `${product.name}

${price}

${product.description.slice(0, 100)}${product.description.length > 100 ? '...' : ''}

https://tinyurl.com/bizcononline/${storeId}/products/${product.id}

${hashtags.join(' ')}`;
    },
};

/**
 * All available caption templates
 */
export const captionTemplates: CaptionTemplate[] = [
    casualTemplate,
    professionalTemplate,
    promotionalTemplate,
    minimalistTemplate,
];

/**
 * Gets a specific template by ID
 */
export function getTemplateById(id: string): CaptionTemplate | undefined {
    return captionTemplates.find(t => t.id === id);
}

/**
 * Generates a caption using a specific template
 */
export function generateCaption(
    product: Product,
    storeName: string,
    storeId: string,
    templateId: string = 'casual'
): string {
    const template = getTemplateById(templateId) || casualTemplate;
    return template.generate(product, storeName, storeId);
}
