"use client";

import { useState } from 'react';
import { Globe } from 'lucide-react';
import NeedAWebsiteModal from '@/components/customer/modals/NeedAWebsiteModal';

interface NeedAWebsiteBannerProps {
  storeId: string;
}

const NeedAWebsiteBanner = ({ storeId }: NeedAWebsiteBannerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shimmerEffectClasses = `
    relative overflow-hidden 
    before:absolute before:inset-0 before:-translate-x-full 
    before:animate-[shimmer_4s_infinite] 
    before:bg-gradient-to-r before:from-transparent 
    before:via-white/5 before:to-transparent
  `;

  return (
    <>
      <div className="px-4 sm:px-6 mt-3 mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`w-full relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-amber-500/20 p-4 rounded-[1.5rem] shadow-xl flex items-center transition-all hover:scale-[1.01] active:scale-[0.99] ${shimmerEffectClasses}`}
        >
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/5 blur-[50px] rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full" />

          <div className="relative z-10 w-full flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 flex-shrink-0">
                <Globe className="text-amber-400" size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs text-amber-200/60 font-medium uppercase tracking-wider">Looking to Grow?</p>
                <p className="text-sm text-white font-bold">Need a website for your business?</p>
              </div>
            </div>
            <div className="text-amber-400 font-bold text-xs">Learn More →</div>
          </div>
        </button>
      </div>

      <NeedAWebsiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        storeId={storeId}
      />
    </>
  );
};

export default NeedAWebsiteBanner;
