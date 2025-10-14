import React from 'react';
import { Image as ImageIcon, Tag, DollarSign, Info } from 'lucide-react';

const ProductUploadTips = () => {
  const tips = [
    {
      icon: <ImageIcon size={20} className="text-blue-500" />,
      text: "Use clear, high-quality photos for best results.",
    },
    {
      icon: <Tag size={20} className="text-green-500" />,
      text: "Use relevant categories to improve discoverability.",
    },
    {
      icon: <DollarSign size={20} className="text-yellow-500" />,
      text: "Price your items competitively.",
    },
    {
      icon: <Info size={20} className="text-purple-500" />,
      text: "Higher commission lead to higher referalls",
    },
  ];

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tips for a good listing</h3>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mr-2">
                {tip.icon}
            </div>
            <span className="flex-1">{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductUploadTips;
