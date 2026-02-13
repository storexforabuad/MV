"use client";

import { Check } from 'lucide-react';

interface SubscriptionPlanCardProps {
  planId: string;
  name?: string;
  promoPrice: number;
  realPrice: number;
  productLimit: number;
  currency: string;
  period: string;
  featured?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
}

const SubscriptionPlanCard = ({
  planId,
  promoPrice,
  realPrice,
  productLimit,
  currency,
  period,
  featured,
  isSelected,
  onSelect,
  name,
}: SubscriptionPlanCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={`relative w-full p-5 rounded-xl border transition-all ${
        isSelected
          ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/20'
          : 'border-slate-700 bg-slate-800/50 hover:border-amber-500/50'
      }`}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}

      {/* Selected Checkmark */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="text-left pt-2">
        {/* Tier name */}
        {name && (
          <div className="mb-2 text-sm text-slate-300 font-semibold">{name}</div>
        )}
        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-slate-400 line-through">
              {currency}
              {realPrice.toLocaleString()}
            </span>
            <div className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">
              50% OFF
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {currency}
            {promoPrice.toLocaleString()}
            <span className="text-xs text-slate-400 font-normal ml-1">{period}</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-300">
              {productLimit.toLocaleString()} products
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default SubscriptionPlanCard;
