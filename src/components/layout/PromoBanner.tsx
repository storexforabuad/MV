
"use client";

import { useState } from 'react';
import { Store } from 'lucide-react';
import StoreInquiryModal from '@/components/modals/StoreInquiryModal';

const shimmerEffectClasses = `
  relative overflow-hidden 
  before:absolute before:inset-0 before:-translate-x-full 
  before:animate-[shimmer_3s_infinite] 
  before:bg-gradient-to-r before:from-transparent 
  dark:before:via-slate-800/50 before:via-slate-200/50 before:to-transparent
`;

const PromoBanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="px-4 sm:px-6 mt-4 mb-2">
        <div 
          onClick={() => setIsModalOpen(true)} 
          className={`bg-slate-100 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow ${shimmerEffectClasses}`}>
          <div className="flex items-center gap-3">
            <Store className="text-purple-500" size={24} />
            <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">Need an online store like this?</p>
          </div>
          <button 
            className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold py-2 px-5 rounded-full text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Get Yours
          </button>
        </div>
      </div>

      <StoreInquiryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default PromoBanner;
