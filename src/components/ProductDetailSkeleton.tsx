import React from 'react';

const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-[calc(var(--navbar-height)+1rem)] lg:pt-[calc(var(--navbar-height)+2rem)] animate-pulse">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-x-8">
        {/* Image Section Skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--skeleton-background)] aspect-square w-full" />
          {/* Thumbnails Skeleton - Only show on larger screens or if needed, but for skeleton we can keep it subtle or hide on mobile if desired. 
              Matching the user's "weird" comment, maybe the grid of 4 big blocks was too much. 
              Let's make them smaller or just keep the main image focus. 
              For now, I'll keep them but make them match the aspect ratio of the main image thumbnails. */}
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square w-full bg-[var(--skeleton-background)] rounded-lg opacity-60" />
            ))}
          </div>
        </div>

        {/* Info Section Skeleton */}
        <div className="mt-4 lg:mt-0 flex-1 flex flex-col">
          {/* Badges Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="h-6 w-24 bg-[var(--skeleton-background)] rounded-full" />
            <div className="h-8 w-8 bg-[var(--skeleton-background)] rounded-full" /> {/* View count circle */}
          </div>

          {/* Title Skeleton */}
          <div className="h-8 w-3/4 bg-[var(--skeleton-background)] rounded mb-4" />

          {/* Price Skeleton */}
          <div className="h-8 w-32 bg-[var(--skeleton-background)] rounded mb-6" />

          {/* Divider/Space */}
          <div className="flex-grow" />

          {/* Action Buttons Skeleton */}
          <div className="flex flex-col gap-3 mt-8">
            {/* Place Order + Heart Row */}
            <div className="flex items-stretch gap-3">
              <div className="h-14 flex-grow bg-[var(--skeleton-background)] rounded-full" />
              <div className="h-14 w-14 flex-shrink-0 bg-[var(--skeleton-background)] rounded-full" />
            </div>
            {/* Share Button */}
            <div className="h-12 w-full bg-[var(--skeleton-background)] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
