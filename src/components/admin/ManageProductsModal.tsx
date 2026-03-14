'use client';
import React, { useState, useMemo, Fragment, useRef, useEffect, useCallback, useDeferredValue } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, EyeIcon } from '@heroicons/react/24/solid';
import { Archive, Percent } from 'lucide-react';
import Image from 'next/image';
import { Product } from '../../types/product';
import { formatPrice } from '../../utils/price';
import EditProductPanel from './EditProductPanel';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { useDynamicMenuPosition } from '@/hooks/useDynamicMenuPosition';
import { isGeneralProduct } from '../../utils/productHelpers';
import { useInView } from 'react-intersection-observer';

// --- TYPES ---
interface ManageProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: { id: string; name: string }[];
  onUpdateProduct: (productId: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (name: string) => Promise<void>;
}
type FilterType = 'all' | 'popular' | 'limited' | 'soldout';

// --- SUB-COMPONENTS ---

const ProductRow = React.memo(({
  product,
  categoryName,
  onEdit,
  onDeleteRequest,
  isSelectMode,
  isSelected,
  onSelect
}: {
  product: Product,
  categoryName: string,
  onEdit: (product: Product) => void,
  onDeleteRequest: (product: Product) => void,
  isSelectMode: boolean,
  isSelected: boolean,
  onSelect: (productId: string) => void
}) => {
  const { menuPosition, calculateMenuPosition } = useDynamicMenuPosition();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:-zinc-800/50'}`}>
      {isSelectMode && (
        <div className="flex items-center justify-center h-16">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(product.id)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )}
      <div className="relative w-16 h-16 flex-shrink-0">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover rounded-lg pointer-events-none"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate">{product.name}</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 -mt-0.5">{categoryName}</p>

        <div className="mt-2 flex items-baseline gap-2">
          {product.onPromo && product.originalPrice ? (
            <>
              <p className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</p>
              <p className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
            </>
          ) : (
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{formatPrice(product.price)}</p>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-zinc-400">
          <div>
            {isGeneralProduct(product) && product.soldOut ?
              <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-full">Sold Out</span> :
              isGeneralProduct(product) && product.limitedStock ?
                <span className="px-2 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Limited</span> :
                <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">In Stock</span>
            }
            {product.productType === 'fashion' && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex -space-x-1">
                  {product.colors.slice(0, 3).map((color, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border border-white dark:border-zinc-800" style={{ backgroundColor: color.hex }} title={color.name} />
                  ))}
                  {product.colors.length > 3 && (
                    <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-bold border border-white dark:border-zinc-800">+{product.colors.length - 3}</div>
                  )}
                </div>
                {product.sizes && product.sizes.length > 0 ? (
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    {product.sizes.length} sizes
                    {product.soldOutSizes && product.soldOutSizes.length > 0 && ` (${product.sizes.length - product.soldOutSizes.length} avail)`}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-zinc-400">No sizes</span>
                )}
                {product.soldOut && <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-full">Sold Out</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
            <span>{product.views || 0}</span>
          </div>

          <div className="flex items-center gap-1">
            <Percent className="w-4 h-4" />
            <span>{product.commission || 0}%</span>
          </div>

          {product.isDropshipped && (
            <div className="flex items-center gap-1 text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
              <span className="text-xs font-semibold">Dropshipped</span>
            </div>
          )}
        </div>
      </div>
      {!isSelectMode && !product.isDropshipped && (
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button
            ref={menuButtonRef}
            onClick={() => {
              if (menuButtonRef.current) {
                calculateMenuPosition(menuButtonRef.current);
              }
            }}
            className="p-2 rounded-full hover:bg-gray-100 dark:-zinc-700 transition-colors">
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
          </Menu.Button>
          <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
            <Menu.Items
              className={`absolute right-0 w-48 divide-y divide-gray-100 dark:divide-zinc-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 bg-white dark:bg-zinc-800 ${menuPosition === 'top' ? 'bottom-full origin-bottom mb-1' : 'origin-top mt-2'}`}>
              <div className="px-1 py-1 "><Menu.Item>{({ active }) => (<button onClick={() => onEdit(product)} className={`${active ? 'bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Edit</button>)}</Menu.Item><Menu.Item>{({ active }) => (<button className={`${active ? 'bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Duplicate</button>)}</Menu.Item></div>
              <div className="px-1 py-1"><Menu.Item>{({ active }) => (<button onClick={() => onDeleteRequest(product)} className={`${active ? 'bg-red-500 text-white' : 'text-red-500'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Delete</button>)}</Menu.Item></div>
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  )
});
ProductRow.displayName = 'ProductRow';


const FilterChip = ({ label, value, activeFilter, onClick, count }: { label: string, value: FilterType, activeFilter: FilterType, onClick: (filter: FilterType) => void, count: number }) => {
  const isActive = activeFilter === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-full transition-all whitespace-nowrap border ${isActive
        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:-zinc-700'
        }`}
    >
      {label}
      <span className={`text-[10px] sm:text-xs font-bold flex items-center justify-center min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 px-1 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400'}`}>
        {count}
      </span>
    </button>
  );
};


// --- MAIN COMPONENT ---

const ManageProductsModal: React.FC<ManageProductsModalProps> = ({ isOpen, onClose, products, setProducts, categories, onUpdateProduct, onDeleteProduct, onAddCategory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const [visibleCount, setVisibleCount] = useState(20);
  const { ref: loadMoreRef, inView } = useInView();

  const filterCounts = useMemo(() => {
    return {
      all: products.length,
      popular: products.filter(p => p.views && p.views > 10).length,
      limited: products.filter(p => isGeneralProduct(p) && p.limitedStock && !p.soldOut).length,
      soldout: products.filter(p => isGeneralProduct(p) && p.soldOut).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (activeFilter === 'popular') return p.views && p.views > 10;
        if (activeFilter === 'limited') return isGeneralProduct(p) && p.limitedStock && !p.soldOut;
        if (activeFilter === 'soldout') return isGeneralProduct(p) && p.soldOut;
        return true;
      })
      .filter(p => p.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()));
  }, [products, deferredSearchQuery, activeFilter]);

  useEffect(() => {
    setVisibleCount(20);
  }, [deferredSearchQuery, activeFilter, isOpen]);

  useEffect(() => {
    if (inView && visibleCount < filteredProducts.length) {
      setVisibleCount(prev => Math.min(prev + 20, filteredProducts.length));
    }
  }, [inView, filteredProducts.length, visibleCount]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setSearchQuery('');
      setActiveFilter('all');
      setEditingProduct(null);
      setProductToDelete(null);
      setIsSelectMode(false);
      setSelectedProducts([]);
      setVisibleCount(20);
    }, 300);
  }, [onClose]);

  const handleProductSave = useCallback(async (updatedFields: Partial<Product>) => {
    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, updatedFields);
      const updatedProduct = { ...editingProduct, ...updatedFields } as Product;
      setProducts(prevProducts => prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }
  }, [editingProduct, onUpdateProduct, setProducts]);

  const handleConfirmDelete = useCallback(() => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    }
  }, [productToDelete, onDeleteProduct, setProducts]);

  const handleToggleSelection = useCallback((productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  }, [filteredProducts]);

  const handleBulkDeleteRequest = useCallback(() => {
    if (selectedProducts.length > 0) {
      setIsBulkDeleteConfirmOpen(true);
    }
  }, [selectedProducts]);

  const handleConfirmBulkDelete = useCallback(() => {
    selectedProducts.forEach(id => {
      onDeleteProduct(id);
    });
    setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
    setSelectedProducts([]);
    setIsBulkDeleteConfirmOpen(false);
  }, [selectedProducts, onDeleteProduct, setProducts]);


  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900 text-slate-900 dark:text-white"
            initial="hidden" animate="visible" exit="exit"
            variants={modalVariants}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          >
            <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-zinc-700 flex-shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100">
                  Manage Products
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Inventory & Stock</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg">
                <Archive className="w-6 h-6 text-white" />
              </div>
            </header>

            <div className="flex-shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-[15px] text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50 focus:bg-white dark:-zinc-700 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:-zinc-300"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    setSelectedProducts([]);
                  }}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all active:scale-95 ${isSelectMode
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:-zinc-700'
                    }`}>
                  {isSelectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
              <div className="mt-4 flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                <FilterChip label="All" value="all" activeFilter={activeFilter} onClick={setActiveFilter} count={filterCounts.all} />
                <FilterChip label="Popular" value="popular" activeFilter={activeFilter} onClick={setActiveFilter} count={filterCounts.popular} />
                <FilterChip label="Limited" value="limited" activeFilter={activeFilter} onClick={setActiveFilter} count={filterCounts.limited} />
                <FilterChip label="Sold Out" value="soldout" activeFilter={activeFilter} onClick={setActiveFilter} count={filterCounts.soldout} />
              </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900/50">
              {isSelectMode && (
                <div className="mb-2 px-2">
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:-zinc-800 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                      ref={input => {
                        if (input) {
                          const indeterminate = selectedProducts.length > 0 && selectedProducts.length < filteredProducts.length;
                          input.indeterminate = indeterminate;
                        }
                      }}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Select All</span>
                  </label>
                </div>
              )}
              <div className="space-y-2">
                {visibleProducts.length > 0 ? (
                  <>
                    {visibleProducts.map(p => (
                      <div key={p.id} className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700">
                        <ProductRow
                          product={p}
                          categoryName={p.categoryId ? categoryMap[p.categoryId] : 'Uncategorized'}
                          onEdit={setEditingProduct}
                          onDeleteRequest={setProductToDelete}
                          isSelectMode={isSelectMode}
                          isSelected={selectedProducts.includes(p.id)}
                          onSelect={handleToggleSelection}
                        />
                      </div>
                    ))}
                    {visibleCount < filteredProducts.length && (
                      <div ref={loadMoreRef} className="py-6 flex justify-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                      <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">No products found</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Try adjusting your search or filters.</p>
                  </div>
                )}
              </div>
            </main>

            <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 z-20">
              {isSelectMode ? (
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    {selectedProducts.length} selected
                  </p>
                  <button
                    onClick={handleBulkDeleteRequest}
                    disabled={selectedProducts.length === 0}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:shadow-none active:scale-95"
                  >
                    Delete Selected
                  </button>
                </div>
              ) : (
                <motion.button
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  whileTap={{ scale: 0.98 }}
                >
                  Done
                </motion.button>
              )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
      <EditProductPanel
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={handleProductSave}
        categories={categories}
        onAddCategory={onAddCategory}
      />
      <ConfirmationDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
      >
        Are you sure you want to delete this product? This action cannot be undone.
      </ConfirmationDialog>
      <ConfirmationDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${selectedProducts.length} Products?`}
      >
        Are you sure you want to delete the selected products? This action cannot be undone.
      </ConfirmationDialog>
    </>
  );
};

export default ManageProductsModal;