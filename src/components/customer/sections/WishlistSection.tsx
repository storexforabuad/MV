'use client';

import { Heart } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface WishlistSectionProps {}

export function WishlistSection({}: WishlistSectionProps) {
  return (
    <div className="text-center py-20 px-6">
      <Heart className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">My Wishlist</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">Your saved items from all stores will appear here.</p>
    </div>
  );
}
