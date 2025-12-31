"use client";

import { ReactNode } from 'react';
import { formatPrice } from '@/utils/price';

interface OrderSummaryStripProps {
  children?: ReactNode;
  total: number;
}

export default function OrderSummaryStrip({ children, total }: OrderSummaryStripProps) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 flex items-center justify-between">
      <div className="flex-1 text-sm text-gray-700 dark:text-gray-200">{children}</div>
      <div className="ml-4 text-right">
        <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
        <div className="text-base font-semibold text-gray-900 dark:text-white">{formatPrice(total)}</div>
      </div>
    </div>
  );
}
