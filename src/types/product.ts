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
}

// ==========================================
// MASTER UNION TYPE
// ==========================================
export type Product = GeneralProduct | VehicleProduct;