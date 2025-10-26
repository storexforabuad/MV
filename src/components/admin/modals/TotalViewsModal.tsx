'use client';

import { Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { EyeIcon, TagIcon, XMarkIcon, ShareIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { Product } from '../../../types/product';
import { motion } from 'framer-motion';

// --- TYPES ---
interface TotalViewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalViews: number;
  products: Product[];
  categories: { id: string; name: string }[];
  setActiveSection: (section: string) => void;
  setManageTab?: (tab: 'all' | 'popular' | 'limited' | 'soldout') => void;
  setIsManageProductsOpen?: (open: boolean) => void;
  onProductClick?: (product: Product) => void;
  onCategoryClick?: (categoryId: string) => void;
  onGetMoreViewsClick?: () => void;
}

// --- MAIN COMPONENT ---
const TotalViewsModal: React.FC<TotalViewsModalProps> = ({
  isOpen,
  onClose,
  totalViews,
  products,
  categories,
  setActiveSection,
  setManageTab,
  setIsManageProductsOpen,
  onProductClick,
  onCategoryClick,
  onGetMoreViewsClick,
}) => {
  const productsArr = useMemo(() => (Array.isArray(products) ? products : []), [products]);
  const isEmpty = productsArr.length === 0;

  const { topCategory, topProducts } = useMemo(() => {
    if (isEmpty) return { topCategory: null, topProducts: [] };

    const categoryViews: { [key: string]: { id: string; name: string; views: number } } = {};
    productsArr.forEach(p => {
      const categoryId = p.categoryId || 'uncategorized';
      const categoryInfo = categories.find(c => c.id === categoryId);
      const categoryName = categoryInfo ? categoryInfo.name : 'Uncategorized';
      
      if (!categoryViews[categoryId]) {
        categoryViews[categoryId] = { id: categoryId, name: categoryName, views: 0 };
      }
      categoryViews[categoryId].views += p.views || 0;
    });

    const sortedCats = Object.values(categoryViews).sort((a, b) => b.views - a.views);
    const topCategory = sortedCats.length > 0 && sortedCats[0].views > 0 ? sortedCats[0] : null;

    const sortedByViews = [...productsArr]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3);

    return { topCategory, topProducts: sortedByViews };
  }, [productsArr, categories, isEmpty]);
  
  const maxViews = useMemo(() => {
    const topProductView = topProducts.length > 0 ? topProducts[0].views || 0 : 0;
    const topCategoryView = topCategory ? topCategory.views : 0;
    return Math.max(topProductView, topCategoryView, 1); // Avoid division by zero
  }, [topProducts, topCategory]);


  const handlePrimaryAction = () => {
    if (onGetMoreViewsClick) {
      onGetMoreViewsClick();
    } else {
      // Fallback for older implementations
      if (isEmpty) {
        setActiveSection('add');
      } else {
        setActiveSection('manage');
        if (setManageTab) setManageTab('all');
        if (setIsManageProductsOpen) setIsManageProductsOpen(true);
      }
      onClose();
    }
  };
  
  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
      onClose();
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95" enterTo="opacity-100 translate-y-0 md:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 md:scale-100" leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95">
              <Dialog.Panel className="relative flex w-full max-w-md transform text-left text-base transition md:my-8">
                <div className="relative flex w-full flex-col overflow-hidden bg-card-background shadow-2xl h-screen md:h-auto md:rounded-2xl">
                  
                  <div className="p-4 flex justify-between items-center border-b border-border-color">
                    <Dialog.Title as="h3" className="text-xl font-bold text-text-primary flex items-center gap-2">
                      <EyeIcon className="w-6 h-6 text-text-secondary"/>
                      Store Views
                    </Dialog.Title>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-button-secondary-hover transition">
                      <XMarkIcon className="h-6 w-6 text-text-secondary" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="w-full flex flex-col items-center">
                      <p className="text-sm text-text-secondary mb-1 text-center">Total product views</p>
                      <p className="text-5xl font-bold text-text-primary my-1">{totalViews}</p>
                      
                      <div className="w-full mt-6">
                        {topProducts.length === 0 && !topCategory ? (
                          <div className="w-full mt-2 py-8 flex flex-col items-center text-center bg-input-background rounded-lg">
                            <p className="font-semibold text-text-primary">{isEmpty ? 'Your store has no products' : 'No product views yet'}</p>
                            <p className="text-sm text-text-secondary mt-1">{isEmpty ? 'Add a product to get started.' : 'Share your store to get views!'}</p>
                          </div>
                        ) : (
                          <div className="w-full space-y-4">
                            {topCategory && (
                              <div>
                                <p className="text-sm font-semibold text-text-secondary mb-2">Top Category</p>
                                <button onClick={() => handleCategoryClick(topCategory.id)} className="w-full p-3 rounded-lg bg-input-background hover:bg-input-border transition-colors group">
                                   <div className="flex items-center gap-3">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background"><TagIcon className="w-5 h-5 text-text-secondary" /></div>
                                      <div className="flex-1 min-w-0 text-left"><span className="font-semibold text-text-primary truncate">{topCategory.name}</span></div>
                                      <span className="text-sm font-bold text-text-primary">{topCategory.views}</span>
                                   </div>
                                   <div className="w-full bg-background rounded-full h-1.5 mt-2">
                                      <motion.div 
                                        className="bg-blue-500 h-1.5 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(topCategory.views / maxViews) * 100}%` }}
                                        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                                       />
                                   </div>
                                </button>
                              </div>
                            )}
                            {topProducts.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-text-secondary mb-2">Top Products</p>
                                <div className="space-y-2">
                                  {topProducts.map((product) => (
                                    <button key={product.id} onClick={() => handleProductClick(product)} className="w-full p-3 rounded-lg bg-input-background hover:bg-input-border transition-colors group">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-background overflow-hidden flex items-center justify-center flex-shrink-0">
                                          {product.images?.[0] ? (
                                            <Image src={product.images[0]} alt={product.name} width={40} height={40} className="w-full h-full object-cover" />
                                          ) : (
                                            <span className="text-xs text-text-tertiary">No Img</span>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left"><span className="font-semibold text-text-primary truncate">{product.name}</span></div>
                                        <span className="text-sm font-bold text-text-primary">{product.views || 0}</span>
                                      </div>
                                      <div className="w-full bg-background rounded-full h-1.5 mt-2">
                                        <motion.div 
                                          className="bg-blue-500 h-1.5 rounded-full"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${((product.views || 0) / maxViews) * 100}%` }}
                                          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                                        />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-border-color">
                    <button 
                      className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={handlePrimaryAction}
                    >
                      <ShareIcon className="w-5 h-5 mr-2" />
                      Get more views
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default TotalViewsModal;
