'use client';

import { useEffect, useState } from 'react';
import { getStoreCustomerCount } from '@/app/actions/customerActions';
import { Users } from 'lucide-react';

interface AdminCustomersCardProps {
  storeId: string;
  onClick?: () => void;
  gradient?: string;
  glowClass?: string;
}

export const AdminCustomersCard: React.FC<AdminCustomersCardProps> = ({ storeId, onClick, gradient, glowClass }) => {
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setIsLoading(true);
        const count = await getStoreCustomerCount(storeId);
        setCustomerCount(count);
      } catch (error) {
        console.error("Failed to fetch customer count:", error);
        setCustomerCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [storeId]);

  const cardGlow = glowClass || 'shadow-[0_0_25px_-5px_rgba(100,116,139,0.5)]';
  // support inline CSS gradients (linear-gradient strings) as well as tailwind gradient classes
  const inlineStyle = gradient && gradient.startsWith && gradient.startsWith('linear-gradient') ? { background: gradient } : undefined;
  const cardGradientClass = inlineStyle ? '' : (gradient || 'bg-gradient-to-br from-slate-500 to-slate-600');

  return (
    <button
      style={inlineStyle}
      className={`dashboard-card relative flex flex-col items-center justify-center gap-3 rounded-[2rem] p-4 sm:p-5 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden text-white w-full h-full min-h-[140px] ${cardGradientClass} ${cardGlow}`}
      onClick={onClick}
    >
      <span className="card-blob" />
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20 shadow">
        <Users className="w-6 h-6 drop-shadow" />
      </div>

      {/* Count */}
      <div className="text-3xl font-bold drop-shadow">
        {isLoading ? (
          <div className="h-9 w-12 bg-white/20 animate-pulse rounded-md" />
        ) : (
          customerCount
        )}
      </div>

      {/* Label */}
      <div className="text-sm font-medium text-center opacity-90">
        Customers
      </div>
    </button>
  );
};
