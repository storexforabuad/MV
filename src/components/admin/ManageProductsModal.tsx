'use client';
import React, { useState, useMemo, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Product } from '../../types/product';
import { formatPrice } from '../../utils/price';
import EditProductPanel from './EditProductPanel';

// --- TYPES ---
interface ManageProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: { id: string; name: string }[];
  storeId: string;
}
type FilterType = 'all' | 'popular' | 'limited' | 'soldout';

// --- SUB-COMPONENTS ---

const ProductRow = ({ product, isSelectMode, isSelected, onToggleSelect, onEdit }: { product: Product, isSelectMode: boolean, isSelected: boolean, onToggleSelect: (id: string) => void, onEdit: (product: Product) => void }) => (
    <div className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${isSelectMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-100' : 'hover:bg-input-background'}`}>
        {isSelectMode && (
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(product.id)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
        )}
        <Image src={product.images[0]} alt={product.name} width={64} height={64} className="w-16 h-16 object-cover rounded-md pointer-events-none" />
        <div className="flex-1">
            <p className="font-semibold text-text-primary truncate">{product.name}</p>
            <p className="text-sm text-text-secondary">{formatPrice(product.price)}</p>
             <div className="flex items-center gap-2 mt-1">
                {product.soldOut && <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">Sold Out</span>}
                {product.limitedStock && !product.soldOut && <span className="px-2 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Limited</span>}
                {!product.soldOut && !product.limitedStock && <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">In Stock</span>}
            </div>
        </div>
        {!isSelectMode && (
            <Menu as="div" className="relative">
                <Menu.Button className="p-2 rounded-full hover:bg-button-secondary-hover">
                    <EllipsisVerticalIcon className="w-5 h-5 text-text-secondary" />
                </Menu.Button>
                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                    <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-card-background divide-y divide-border-color rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                        <div className="px-1 py-1 "><Menu.Item>{({ active }) => (<button onClick={() => onEdit(product)} className={`${active ? 'bg-button-secondary-hover text-text-primary' : 'text-text-secondary'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Edit</button>)}</Menu.Item><Menu.Item>{({ active }) => (<button className={`${active ? 'bg-button-secondary-hover text-text-primary' : 'text-text-secondary'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Duplicate</button>)}</Menu.Item></div>
                        <div className="px-1 py-1"><Menu.Item>{({ active }) => (<button className={`${active ? 'bg-red-500 text-white' : 'text-red-500'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Delete</button>)}</Menu.Item></div>
                    </Menu.Items>
                </Transition>
            </Menu>
        )}
    </div>
);

const FilterChip = ({ label, value, activeFilter, onClick }: { label: string, value: FilterType, activeFilter: FilterType, onClick: (filter: FilterType) => void }) => (
    <button onClick={() => onClick(value)} className={`flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${activeFilter === value ? 'bg-gray-900 text-white' : 'bg-input-background text-text-primary hover:bg-button-secondary-hover'}`}>
        {label}
    </button>
)


// --- MAIN COMPONENT ---

const ManageProductsModal: React.FC<ManageProductsModalProps> = ({ isOpen, onClose, products, setProducts, categories, storeId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (activeFilter === 'popular') return p.views && p.views > 10;
        if (activeFilter === 'limited') return p.limitedStock && !p.soldOut;
        if (activeFilter === 'soldout') return p.soldOut;
        return true;
      })
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery, activeFilter]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setSearchQuery('');
        setActiveFilter('all');
        setIsSelectMode(false);
        setSelectedProductIds([]);
        setEditingProduct(null);
    }, 300);
  }

  const handleProductSave = (updatedProduct: Product) => {
      setProducts(prevProducts => prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      // In a real app, you'd also make an API call here to save to the backend
      console.log("Saved product:", updatedProduct);
  }

  const toggleSelectMode = () => {
    if (isSelectMode) {
        setSelectedProductIds([]);
    }
    setIsSelectMode(!isSelectMode);
  }

  const handleToggleSelect = (id: string) => {
      setSelectedProductIds(prev =>
          prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
      );
  }

  return (
    <>
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" /></Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95" enterTo="opacity-100 translate-y-0 md:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 md:scale-100" leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95">
              <Dialog.Panel className="relative flex w-full max-w-2xl transform text-left text-base transition md:my-8">
                 <div className="relative flex w-full flex-col overflow-hidden bg-card-background shadow-2xl h-screen md:h-[90vh] md:rounded-2xl">

                  {/* Header */}
                  <div className="p-4 flex justify-between items-center border-b border-border-color">
                    <Dialog.Title as="h3" className="text-xl font-bold text-text-primary">Manage Products</Dialog.Title>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-button-secondary-hover transition"><XMarkIcon className="h-6 w-6 text-text-secondary" /></button>
                  </div>

                  {/* Sticky Search, Filters, and Actions */}
                  <div className="sticky top-0 z-10 bg-card-background/80 backdrop-blur-sm p-4 border-b border-border-color">
                      <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1">
                           <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-text-secondary" />
                           <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="block w-full rounded-lg border-2 border-input-border bg-input-background py-3 pl-11 pr-4 text-text-primary placeholder:text-text-secondary focus:border-blue-500 focus:ring-0 sm:text-sm" />
                        </div>
                        <button onClick={toggleSelectMode} className="px-4 py-3 rounded-lg bg-button-secondary text-text-primary font-semibold hover:bg-button-secondary-hover transition text-sm">
                            {isSelectMode ? 'Cancel' : 'Select'}
                        </button>
                      </div>
                      <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                          <FilterChip label="All" value="all" activeFilter={activeFilter} onClick={setActiveFilter} />
                          <FilterChip label="Popular" value="popular" activeFilter={activeFilter} onClick={setActiveFilter} />
                          <FilterChip label="Limited Stock" value="limited" activeFilter={activeFilter} onClick={setActiveFilter} />
                          <FilterChip label="Sold Out" value="soldout" activeFilter={activeFilter} onClick={setActiveFilter} />
                      </div>
                  </div>

                  {/* Product List */}
                   <div className="flex-1 overflow-y-auto p-2 pb-24"> {/* Added pb-24 for footer clearance */}
                    <div className="grid grid-cols-1 gap-1">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(p => <ProductRow key={p.id} product={p} isSelectMode={isSelectMode} isSelected={selectedProductIds.includes(p.id)} onToggleSelect={handleToggleSelect} onEdit={setEditingProduct} />)
                        ) : (
                            <div className="text-center py-16"><p className="font-semibold text-text-primary">No products found</p><p className="text-text-secondary mt-1">Try adjusting your search or filters.</p></div>
                        )}
                    </div>
                  </div>

                  {/* --- FOOTERS --- */}
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    {/* Bulk Actions Footer */}
                    <AnimatePresence>
                      {isSelectMode && selectedProductIds.length > 0 && (
                          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-card-background border-t border-border-color p-4 shadow-lg">
                            <div className="flex justify-between items-center">
                                  <p className="font-semibold text-text-primary">{selectedProductIds.length} selected</p>
                                  <div className="flex gap-2">
                                      <button className="px-4 py-2 rounded-lg bg-button-secondary text-text-primary font-semibold hover:bg-button-secondary-hover transition">Mark as Sold Out</button>
                                      <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition">Delete</button>
                                  </div>
                            </div>
                          </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Done Button Footer */}
                    <div className="bg-card-background p-4 border-t border-border-color">
                      <button onClick={handleClose} className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition">
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
    <EditProductPanel
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={handleProductSave}
        categories={categories}
    />
    </>
  );
};

export default ManageProductsModal;
