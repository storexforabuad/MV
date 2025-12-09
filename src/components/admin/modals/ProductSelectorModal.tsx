
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100vh' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100vh' }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent md:justify-center md:items-center"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity hidden md:block" onClick={onClose} />

          <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl flex flex-col overflow-hidden bg-card-background shadow-xl z-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium leading-6 text-text-primary">
                Select a Product
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-button-secondary transition">
                <XMarkIcon className="h-5 w-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6 pt-4 flex-1 overflow-hidden flex flex-col">
              <div className="mb-4 relative flex-shrink-0">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-input-background border-2 border-input-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-0 focus:border-blue-500 transition"
                />
              </div>

              <div className="overflow-y-auto space-y-2 pr-2 flex-1">
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
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductSelectorModal;
