import { geography } from './geography';
import {
  ShoppingBag,
  UtensilsCrossed,
  Shirt,
  Fish,
  Car,
  Laptop,
  Building2,
  Sparkles,
  Wrench,
} from 'lucide-react';

export type StoreType =
  | 'general'
  | 'restaurant'
  | 'fashion'
  | 'livestock'
  | 'automotive'
  | 'electronics'
  | 'real-estate'
  | 'artist'
  | 'beauty'
  | 'home-services'
  | 'digital-products';

export const STORE_TYPES: Array<{
  id: StoreType;
  label: string;
  icon: any;
  description: string;
  color: string;
}> = [
  {
    id: 'general',
    label: 'General Store',
    icon: ShoppingBag,
    description: 'Perfect for retail, supermarkets, and general merchandise.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: UtensilsCrossed,
    description: 'For food vendors, restaurants, bakeries, and fast food chains.',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'fashion',
    label: 'Fashion',
    icon: Shirt,
    description: 'Clothing brands, boutiques, textile retailers, and designers.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'livestock',
    label: 'Livestock',
    icon: Fish,
    description: 'Fishery, poultry, and agricultural products.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'automotive',
    label: 'Automotive',
    icon: Car,
    description: 'Car dealerships, spare parts, and auto services.',
    color: 'from-slate-500 to-gray-500',
  },
  {
    id: 'electronics',
    label: 'Electronics',
    icon: Laptop,
    description: 'Phones, solar equipment, gadgets, and electronic accessories.',
    color: 'from-blue-400 to-indigo-600',
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    icon: Building2,
    description: 'Property listings, rentals, and real estate services.',
    color: 'from-slate-700 to-slate-900',
  },
  {
    id: 'artist',
    label: 'Artist',
    icon: Sparkles,
    description: 'Music, merch, and creative services for artists.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'beauty',
    label: 'Beauty',
    icon: Sparkles,
    description: 'Cosmetics, makeup artists, perfume vendors etc.',
    color: 'from-pink-400 to-rose-600',
  },
  {
    id: 'home-services',
    label: 'Home Services',
    icon: Wrench,
    description: 'Cleaning, repairs, maintenance, and home improvement.',
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: 'digital-products',
    label: 'Digital Products',
    icon: Laptop,
    description: 'E-books, courses, software, and digital assets.',
    color: 'from-indigo-500 to-blue-500',
  },
];

export { geography };

// Tier details for website registration - mirroring /register structure
export const TIER_DETAILS = {
  lite: {
    name: 'Lite',
    price: 1000, // Display price (will be halved to 500 for promo)
    period: 'week',
    productLimit: 100,
    featured: false,
  },
  pro: {
    name: 'Pro',
    price: 2000, // Display price (will be halved to 1000 for promo)
    period: 'week',
    productLimit: 500,
    featured: true,
  },
  max: {
    name: 'Max',
    price: 7000, // Display price (will be halved to 3500 for promo)
    period: 'week',
    productLimit: 2000,
    featured: false,
  },
};

export const RAMADAN_PROMO_END_DATE = 'April 1, 2026';
