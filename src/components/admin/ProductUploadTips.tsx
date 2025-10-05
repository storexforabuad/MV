import React from 'react';
import { Image, CircleDollarSign, TrendingUp } from 'lucide-react';

const ProductUploadTips = () => {
  const tips = [
    {
      icon: <Image size={20} className="text-blue-500" />,
      text: "Use clear, high-quality photos for best results.",
    },
    {
      icon: <CircleDollarSign size={20} className="text-green-500" />,
      text: "Competitive prices and promos attract more buyers.",
    },
    {
      icon: <TrendingUp size={20} className="text-purple-500" />,
      text: "Higher referral commissions lead to more shares and sales.",
    },
  ];

  return (
    <div className="p-4 mt-6 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
      <ul className="space-y-3">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{tip.icon}</div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{tip.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductUploadTips;
