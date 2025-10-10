'use client';

import { useEffect, useState } from 'react';
import { getStoreCustomerCount } from '@/app/actions/customerActions';
import { Users } from 'lucide-react';

interface AdminCustomersCardProps {
  storeId: string;
  onClick: () => void;
}

export const AdminCustomersCard: React.FC<AdminCustomersCardProps> = ({ storeId, onClick }) => {
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

  return (
    <button
        className="dashboard-card relative flex flex-col items-center justify-center rounded-2xl p-2 sm:p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-[0_0_25px_-5px_rgba(100,116,139,0.5)] w-full h-full min-h-[7rem]"
        onClick={onClick}
    >
        <span className="card-blob" />
        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white bg-opacity-20 mb-1 sm:mb-2 shadow">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 drop-shadow" />
        </div>
        <div className="flex flex-col items-center min-w-0 z-10 w-full">
            <div className="text-lg sm:text-xl md:text-2xl font-bold drop-shadow">
                {isLoading ? (
                    <div className="h-7 w-10 bg-gray-400 animate-pulse rounded-md" />
                ) : (
                    customerCount
                )}
            </div>
            <div className="text-xs sm:text-sm font-medium opacity-90 text-center px-1 leading-tight">
                Customers
            </div>
        </div>
    </button>
  );
};
