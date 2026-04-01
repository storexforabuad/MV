import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="bg-[var(--card-background)] rounded-[32px] overflow-hidden shadow-sm">
      {/* Image placeholder */}
      <div className="aspect-[3/4] bg-[var(--skeleton-background)] animate-pulse" />

      {/* Content placeholder */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Title placeholder */}
        <div className="h-4 bg-[var(--skeleton-background)] animate-pulse rounded" />

        {/* Price placeholder */}
        <div className="h-5 bg-[var(--skeleton-background)] animate-pulse rounded w-1/2" />
      </div>
    </div>
  );
};

export default SkeletonLoader;
