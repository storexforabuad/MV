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
          className="w-full relative p-4 rounded-[1.5rem] shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] group bg-gradient-to-br from-[#1a1a40] via-[#2d1b4d] to-[#1a1a40] border border-amber-500/30"
        >
          {/* Shimmer Layer - Nested to allow badge to escape overflow-hidden */}
          <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent" />
          </div>

          {/* Promo Badge */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-amber-500/20 z-20 uppercase tracking-widest border border-amber-400/20">
            PROMO
          </div>

          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 blur-[50px] rounded-full opacity-50 z-0" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full opacity-50 z-0" />

          <div className="relative z-10 w-full flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 flex-shrink-0">
                <Globe className="text-amber-400" size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs text-amber-400 font-black uppercase tracking-[0.2em] mb-0.5">Looking to Grow?</p>
                <p className="text-sm sm:text-base text-white font-black tracking-tight">Need a website for your business?</p>
              </div>
            </div>
            <div className="text-amber-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
              Learn More <span>→</span>
            </div>
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
