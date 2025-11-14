
'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Product } from '@/types/product';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
}

const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({ isOpen, onClose, products, onProductSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card-background p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text-primary flex justify-between items-center">
                  Select a Product
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-button-secondary transition"><XMarkIcon className="h-5 w-5 text-text-secondary" /></button>
                </Dialog.Title>
                
                <div className="mt-4 mb-4 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input 
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-input-background border-2 border-input-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-0 focus:border-blue-500 transition"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <button 
                        key={product.id}
                        onClick={() => handleSelect(product)}
                        className="w-full flex items-center gap-4 p-2 rounded-lg hover:bg-background-secondary transition text-left"
                      >
                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          <Image 
                            src={product.images[0] || 'https://placehold.co/400'} 
                            alt={product.name}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{product.name}</p>
                          <p className="text-sm text-text-secondary">₦{product.price.toLocaleString()}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-text-secondary py-8">No products found.</p>
                  )}
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ProductSelectorModal;
