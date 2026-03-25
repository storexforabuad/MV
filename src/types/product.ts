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
  isTextile?: boolean;

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
  subtype: 'phone' | 'tablet' | 'laptop' | 'powerbank' | 'audio' | 'accessory' | 'smartwatch' | 'gaming' | 'other';

  storage?: string;
  ram?: string;
  batteryCapacity?: string;
  color?: string;

  // Technical Specs
  network?: '3G' | '4G' | '5G';
  simType?: 'single' | 'dual' | 'esim';
  os?: string;
  imeiVerification?: 'verified' | 'unverified' | 'n/a';
  packageContents?: string;

  // Audio-specific
  audioStyle?: string; // e.g. In-Ear, Over-Ear, Earbuds, Speaker, Soundbar
  anc?: boolean; // Active Noise Cancellation

  // Power Bank-specific
  powerOutput?: string; // e.g. 10W, 20W Fast Charge, 65W

  // Accessory-specific
  accessoryType?: string; // e.g. Case, Cable, Charger, Screen Protector
  compatibleWith?: string; // e.g. iPhone 15, Samsung Galaxy S24
  connectivity?: string; // e.g. USB-C, Bluetooth

  // Smartwatch-specific
  watchBatteryLife?: string; // e.g. "7 days", "14 days"
  watchFeatures?: string[]; // e.g. ["Heart Rate", "GPS", "SpO2"]

  // Gaming-specific
  gamingCategory?: string; // e.g. Controller, Headset, Console
  gamingPlatform?: string; // e.g. PS5, Xbox, PC, Nintendo Switch

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
// SOLAR PRODUCT (New)
// ==========================================
export interface SolarProduct extends BaseProduct {
  productType: 'solar';

  // Core Info
  brand: string;
  condition: 'brand-new' | 'open-box' | 'used-good' | 'used-fair' | 'refurbished';

  // Subtype
  subtype: 'solar-panels' | 'inverters' | 'batteries' | 'charge-controllers' | 'dc-appliances' | 'ac-appliances' | 'solar-kits' | 'accessories';

  // --- Tech Specs (Dynamic based on subtype) ---

  // A. Solar Panels
  wattage?: string; // e.g. 550W
  cellType?: string; // e.g. Monocrystalline, Polycrystalline, Thin-Film
  nominalVoltage?: string; // e.g. 12V, 24V
  efficiencyRating?: string; // e.g. 21%
  frameDimensions?: string;

  // B. Inverters
  powerCapacity?: string; // e.g. 1kVA, 5kVA, 10kW
  inverterType?: string; // e.g. Pure Sine Wave, Modified Sine Wave, Hybrid, Grid-Tied, Microinverter
  systemVoltage?: string; // e.g. 12V, 24V, 48V, 96V
  smartFeatures?: boolean;

  // C. Batteries
  batteryCapacity?: string; // e.g. 100Ah, 200Ah, 5kWh
  batteryChemistry?: string; // e.g. Lithium Iron Phosphate (LiFePO4), Lithium-Ion, Tubular/Tall Tubular, Sealed Lead Acid (SLA), Gel
  lifeCycles?: string; // e.g. 2000, 6000 cycles
  depthOfDischarge?: string; // e.g. 80%, 100%

  // D. Charge Controllers
  controllerType?: string; // e.g. MPPT, PWM
  maxCurrentRating?: string; // e.g. 20A, 40A, 60A, 100A
  maxPvInputVoltage?: string; // Voc

  // E. Solar-Compatible DC Appliances / F. Energy Efficient AC Appliances
  applianceCategory?: string; // e.g. TV, Fan, Fridge/Freezer, Lighting, Water Pump, Inverter AC
  operatingVoltage?: string; // e.g. 12V DC, 24V DC, 48V DC, 220V AC
  powerConsumption?: string; // Watts/Amps
  directSolarConnect?: boolean; // DC appliances
  energyStarRating?: string; // e.g. 1-Star to 5-Star
  inverterCompressor?: boolean;

  // G. Solar Kits & Bundles
  totalSystemCapacity?: string; // e.g. 1kW Off-Grid Kit
  estimatedDailyYield?: string; // kWh/day
  componentsIncluded?: string[];
  installationIncluded?: boolean;

  // Warranty & Packaging
  warranty: boolean;
  warrantyDuration?: string;
  whatsInBox?: string[];

  // Availability & Specs
  available: boolean;
  soldOut?: boolean;
  limitedStock?: boolean;
  quantity: number;
  bulkPurchasing?: boolean;
  categoryId?: string;
  category?: string;
}

// ==========================================
// MEDIA INFLUENCER PRODUCT (New)
// ==========================================
export interface MediaInfluencerProduct extends BaseProduct {
  productType: 'media-influencer';

  // Subtypes: e.g., 'service' (PR/Collab) vs 'booking-fee'
  subtype: 'service' | 'booking-fee';

  // Specific to 'service'
  platform?: 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Cross-Platform';
  deliveryTimeDays?: number;
  revisionsAllowed?: number;

  categoryId?: string;
  category?: string;
  isActive?: boolean;
}

// ==========================================
// MASTER UNION TYPE
// ==========================================
export type Product = GeneralProduct | VehicleProduct | LivestockProduct | FashionProduct | FoodBeverageProduct | ElectronicsProduct | SolarProduct | MediaInfluencerProduct;
