import { Timestamp } from 'firebase/firestore';

// ==========================================
// SHARED BASE FIELDS
// ==========================================
interface BaseProduct {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  views: number;
  createdAt: { toMillis: () => number } | Timestamp;
  commission?: number;
  onPromo?: boolean;

  // Wholesale B2B Features
  isAvailableForWholesale?: boolean;  // Default: false
  minOrderQuantity?: number;           // e.g., 50 units minimum for wholesale
  wholesalePricing?: {
    globalDiscount: number;            // e.g., 30 (percent)
    tierPricing?: Array<{
      minQty: number;
      discount: number;
    }>;
    customPartnerDiscounts?: Record<string, number>;  // partnerId -> discount %
  };

  // Dropshipping (B2B Copied Products)
  isDropshipped?: boolean;
  supplierId?: string;         // ID of the store that originally created the product
  sourceProductId?: string;    // ID of the original product in the supplier's store
  wholesaleCost?: number;      // How much the reseller owes the supplier per unit
}

// ==========================================
// GENERAL PRODUCT (Existing behavior)
// ==========================================
export interface GeneralProduct extends BaseProduct {
  productType: 'general';
  category: string;
  categoryId?: string;
  inStock: boolean;
  quantity: number;
  soldOut?: boolean;
  backInStock?: boolean;

  // General-specific fields
  features?: string[];
  limitedStock?: boolean;
  selectedSize?: string;
  size?: string;
  status: 'processing' | 'ready' | 'shipped';

  // Size options (NEW)
  sizeOption?: 'baby-clothes' | 'kids-shoes' | 'adult-shoes';
  availableSizes?: string[]; // Auto-populated based on sizeOption
}

// ==========================================
// VEHICLE PRODUCT (New)
// ==========================================
export interface VehicleProduct extends BaseProduct {
  productType: 'vehicle';

  // Vehicle-specific fields
  vehicleDetails: {
    // Core Specs
    make: string;           // "Toyota", "Mercedes"
    model: string;          // "Camry", "C-Class"
    year: number;           // 2015
    mileage: number;        // 45000 (in km)
    condition: 'brand-new' | 'foreign-used' | 'nigerian-used';

    // Technical Specs
    transmission: 'automatic' | 'manual';
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    bodyType: 'sedan' | 'suv' | 'truck' | 'bus' | 'coupe' | 'van';
    color: string;          // "Black", "Silver"
    engineSize?: string;    // "2.5L", "3.0L V6"
    driveType?: '2WD' | '4WD' | 'AWD';

    // Identifiers & Legal
    vin?: string;           // Vehicle Identification Number (optional in Nigeria)
    location: string;       // "Lagos", "Abuja", "Port Harcourt"
    customsDuty?: 'paid' | 'unpaid' | 'n/a';  // Nigerian-specific
  };

  // Availability (simpler than general products)
  available: boolean;       // true = for sale, false = sold
  reserved?: boolean;       // Someone made an offer but hasn't paid
  category?: string;        // Category name
  categoryId?: string;      // Optional category for organization
}

// ==========================================
// LIVESTOCK PRODUCT (Fish, Poultry, etc.)
// ==========================================
export interface LivestockProduct extends BaseProduct {
  productType: 'livestock';

  // Livestock-specific fields
  species?: string;                    // "Catfish", "Tilapia", "Chicken"
  lifeStage?: 'fingerling' | 'juvenile' | 'table-size' | 'broodstock';
  priceUnit?: 'kg' | 'piece';          // Selling by weight or per piece
  waterType?: 'freshwater' | 'saltwater';
  averageWeight?: number;              // Average weight in kg
  stock?: number;                      // Available stock (kg or pieces)

  // Availability
  available: boolean;
  soldOut?: boolean;
  limitedStock?: boolean;
  inStock?: boolean;
  quantity?: number;
  categoryId?: string;
}

// ==========================================
// FASHION PRODUCT (RTW)
// ==========================================
export interface FashionProduct extends BaseProduct {
  productType: 'fashion';

  // Category for sizing (clothing vs shoes vs caps vs jallabs)
  sizeCategory?: 'clothing' | 'shoes' | 'caps' | 'jallabs' | 'insence' | 'oil-perfumes' | 'waist-beads'; // Optional for backward compatibility, defaults to 'clothing'

  // Variants
  colors: {
    name: string;
    hex: string;
    images: string[];
  }[];
  sizes?: string[]; // Clothing: "6"-"20", Shoes: "38"-"46". Optional if hasSizes is false
  soldOutSizes?: string[]; // Subset of sizes that are unavailable

  // Size Guide
  sizeChart: {
    type: 'nigerian-standard' | 'european-shoe' | 'nigerian-cap' | 'jallab-standard' | 'insence-volume' | 'oil-perfume-volume' | 'waist-beads-inches';
  };

  // Shared fields
  categoryId?: string;
  category?: string;

  // Inventory Status
  limitedStock?: boolean;
  soldOut?: boolean; // Global sold out (all variants)
}


// ==========================================
// FOOD & BEVERAGE PRODUCT (New)
// ==========================================
export interface FoodBeverageProduct extends BaseProduct {
  productType: 'food';
  subtype: 'dish' | 'drink' | 'snack';

  // Food/Drink specific fields
  preparationTime?: number; // in minutes
  spiciness?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  selectedSpiciness?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  specialInstructions?: string;
  temperature?: 'hot' | 'cold' | 'room-temp';
  isAlcoholic?: boolean;
  isVegetarian?: boolean;
  ingredients?: string[];

  // Availability
  available: boolean;
  soldOut?: boolean;
  limitedStock?: boolean;
  categoryId?: string;
  category?: string;
}

// ==========================================
// ELECTRONICS PRODUCT (New)
// ==========================================
export interface ElectronicsProduct extends BaseProduct {
  productType: 'electronics';

  // Core Specs
  brand: string;
  condition: 'brand-new' | 'open-box' | 'used-good' | 'used-fair' | 'refurbished';

  // Subtype Specifics
  subtype: 'phone' | 'tablet' | 'laptop' | 'powerbank' | 'solar' | 'audio' | 'accessory' | 'smartwatch' | 'gaming' | 'other';

  storage?: string;
  ram?: string;
  color?: string;

  // Technical Specs
  network?: '3G' | '4G' | '5G';
  simType?: 'single' | 'dual' | 'esim';
  os?: string;
  imeiVerification?: 'verified' | 'unverified' | 'n/a';
  packageContents?: string;

  // Warranty & Packaging
  warranty: boolean;
  warrantyDuration?: string;
  warrantyType?: 'seller' | 'manufacturer';
  whatsInBox?: string[];

  // Availability
  available: boolean;
  soldOut?: boolean;
  limitedStock?: boolean;
  quantity: number;
  categoryId?: string;
  category?: string;
}

// ==========================================
// MASTER UNION TYPE
// ==========================================
export type Product = GeneralProduct | VehicleProduct | LivestockProduct | FashionProduct | FoodBeverageProduct | ElectronicsProduct;
