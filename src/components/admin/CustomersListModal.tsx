'use client';

import { useEffect, useState } from 'react';
import { fetchStoreCustomers, StoreCustomer } from '@/app/actions/customerActions';
import { CustomerDetailCard, CustomerDetailCardSkeleton } from './CustomerDetailCard';
import { X, Users } from 'lucide-react';

interface CustomersListModalProps {
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomersListModal: React.FC<CustomersListModalProps> = ({ storeId, isOpen, onClose }) => {
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadCustomers = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const fetchedCustomers = await fetchStoreCustomers(storeId);
          setCustomers(fetchedCustomers);
        } catch (err) {
          console.error("Failed to fetch store customers:", err);
          setError("Couldn't load customers. Please try again.");
        }
        finally {
          setIsLoading(false);
        }
      };
      loadCustomers();
    }
  }, [isOpen, storeId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-100 flex flex-col h-full w-full max-w-4xl rounded-lg shadow-xl">
        {/* Modal Header */}
        <header className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading && (
            <div className="space-y-4">
              <CustomerDetailCardSkeleton />
              <CustomerDetailCardSkeleton />
              <CustomerDetailCardSkeleton />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-500">{error}</p>
            </div>
          )}

          {!isLoading && !error && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <Users className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold">No Customers Yet</h3>
                <p>When a customer places their first order, they will appear here.</p>
            </div>
          )}

          {!isLoading && !error && customers.length > 0 && (
            <div className="space-y-4">
              {customers.map(customer => (
                <CustomerDetailCard key={customer.id} customer={customer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
