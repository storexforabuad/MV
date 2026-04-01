import React from 'react';
import { StarIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import PopularProducts from '../components/PopularProducts';

interface PopularProductsSectionProps {
  isPopularProductsOpen: boolean;
  setIsPopularProductsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  storeId: string; // Added storeId
}

const PopularProductsSection: React.FC<PopularProductsSectionProps> = ({ 
  isPopularProductsOpen, 
  setIsPopularProductsOpen, 
  storeId 
}) => {
  return (
    <section className="mb-8 bg-card-background p-4 sm:p-6 rounded-xl shadow-sm transition-all">
      <div 
        className="flex justify-between items-center cursor-pointer bg-card-hover p-4 rounded-lg hover:bg-opacity-80 transition-colors" 
        onClick={() => setIsPopularProductsOpen(!isPopularProductsOpen)}
      >
        <div className="flex items-center gap-2">
          <StarIcon className="w-5 h-5 text-text-primary" />
          <h2 className="text-xl font-semibold text-text-primary">Popular Products</h2>
        </div>
        <div className="text-text-primary">
          {isPopularProductsOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </div>
      </div>
      {isPopularProductsOpen && (
        <div className="mt-4">
          <PopularProducts storeId={storeId} />
        </div>
      )}
    </section>
  );
};

export default PopularProductsSection;
