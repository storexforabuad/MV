"use client";

interface PricingBadgeProps {
  realPrice: number;
  promoPrice: number;
  currency: string;
  period: string;
}

const PricingBadge = ({ realPrice, promoPrice, currency, period }: PricingBadgeProps) => {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400 line-through">
          {currency}
          {realPrice.toLocaleString()}
        </span>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
          50% OFF
        </div>
      </div>
      <div className="text-2xl font-bold text-amber-400">
        {currency}
        {promoPrice.toLocaleString()}
        <span className="text-xs text-slate-400 ml-1">{period}</span>
      </div>
      <p className="text-xs text-amber-200/60">Ramadan promo pricing</p>
    </div>
  );
};

export default PricingBadge;
