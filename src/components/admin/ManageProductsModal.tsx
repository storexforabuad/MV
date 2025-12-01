'use client';
import React, { useState, useMemo, Fragment, useRef } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, EyeIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { Percent } from 'lucide-react';
import { Product } from '../../types/product';
import { formatPrice } from '../../utils/price';
import EditProductPanel from './EditProductPanel';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { useDynamicMenuPosition } from '@/hooks/useDynamicMenuPosition';
import { isGeneralProduct } from '../../utils/productHelpers';

// --- TYPES ---
interface ManageProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: { id: string; name: string }[];
  onUpdateProduct: (productId: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (name: string) => Promise<void>; // ADD THIS LINE
}
type FilterType = 'all' | 'popular' | 'limited' | 'soldout';

// --- SUB-COMPONENTS ---

const ProductRow = ({
  product,
  categories,
  onEdit,
  onDeleteRequest,
  isSelectMode,
  isSelected,
  onSelect
}: {
  product: Product,
  categories: { id: string, name: string }[],
  onEdit: (product: Product) => void,
  onDeleteRequest: (product: Product) => void,
  isSelectMode: boolean,
  isSelected: boolean,
  onSelect: (productId: string) => void
}) => {
  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Uncategorized';
  const { menuPosition, calculateMenuPosition } = useDynamicMenuPosition();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-input-background'}`}>
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
      <Image src={product.images[0]} alt={product.name} width={64} height={64} className="w-16 h-16 object-cover rounded-lg flex-shrink-0 pointer-events-none" />
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold text-text-primary truncate">{product.name}</p>
        <p className="text-sm text-text-secondary -mt-1">{categoryName}</p>

        <div className="mt-2 flex items-baseline gap-2">
          {product.onPromo && product.originalPrice ? (
            <>
              <p className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</p>
              <p className="text-sm text-text-secondary line-through">{formatPrice(product.originalPrice)}</p>
            </>
          ) : (
            <p className="text-lg font-bold text-text-primary">{formatPrice(product.price)}</p>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
          <div>
            {isGeneralProduct(product) && product.soldOut ?
              <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">Sold Out</span> :
              isGeneralProduct(product) && product.limitedStock ?
                <span className="px-2 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Limited</span> :
                <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">In Stock</span>
            }
          </div>

          <div className="flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
            <span>{product.views || 0}</span>
          </div>

          <div className="flex items-center gap-1">
            <Percent className="w-4 h-4" />
            <span>{product.commission || 0}%</span>
          </div>
        </div>
      </div>
      {!isSelectMode && (
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button
            ref={menuButtonRef}
            onClick={() => {
              if (menuButtonRef.current) {
                calculateMenuPosition(menuButtonRef.current);
              }
            }}
            className="p-2 rounded-full hover:bg-button-secondary-hover">
            <EllipsisVerticalIcon className="w-5 h-5 text-text-secondary" />
          </Menu.Button>
          <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
            <Menu.Items
              className={`absolute right-0 w-48 divide-y divide-border-color rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 bg-card-background ${menuPosition === 'top' ? 'bottom-full origin-bottom mb-1' : 'origin-top mt-2'}`}>
              <div className="px-1 py-1 "><Menu.Item>{({ active }) => (<button onClick={() => onEdit(product)} className={`${active ? 'bg-button-secondary-hover text-text-primary' : 'text-text-secondary'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Edit</button>)}</Menu.Item><Menu.Item>{({ active }) => (<button className={`${active ? 'bg-button-secondary-hover text-text-primary' : 'text-text-secondary'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Duplicate</button>)}</Menu.Item></div>
              <div className="px-1 py-1"><Menu.Item>{({ active }) => (<button onClick={() => onDeleteRequest(product)} className={`${active ? 'bg-red-500 text-white' : 'text-red-500'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Delete</button>)}</Menu.Item></div>
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  )
};


const FilterChip = ({ label, value, activeFilter, onClick, count }: { label: string, value: FilterType, activeFilter: FilterType, onClick: (filter: FilterType) => void, count: number }) => {
  const isActive = activeFilter === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${isActive
        ? 'bg-gray-900 text-white'
        : 'bg-input-background text-text-primary hover:bg-button-secondary-hover'
        }`}
    >
      {label}
      {isActive && (
        <span className="bg-white/20 text-white text-xs font-bold flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
};


// --- MAIN COMPONENT ---

const ManageProductsModal: React.FC<ManageProductsModalProps> = ({ isOpen, onClose, products, setProducts, categories, onUpdateProduct, onDeleteProduct, onAddCategory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

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
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery, activeFilter]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSearchQuery('');
      setActiveFilter('all');
      setEditingProduct(null);
      setProductToDelete(null);
      setIsSelectMode(false);
      setSelectedProducts([]);
    }, 300);
  }

  const handleProductSave = async (updatedFields: Partial<Product>) => {
    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, updatedFields);
      const updatedProduct = { ...editingProduct, ...updatedFields } as Product;
      setProducts(prevProducts => prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }
  }

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null); // Close the dialog
    }
  };

  const handleToggleSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkDeleteRequest = () => {
    if (selectedProducts.length > 0) {
      setIsBulkDeleteConfirmOpen(true);
    }
  };

  const handleConfirmBulkDelete = () => {
    selectedProducts.forEach(id => {
      onDeleteProduct(id);
    });
    setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
    setSelectedProducts([]);
    setIsBulkDeleteConfirmOpen(false);
  };


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

                    {/* Sticky Search & Filters */}
                    <div className="sticky top-0 z-10 bg-card-background/80 backdrop-blur-sm p-4 border-b border-border-color">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-text-secondary" />
                          <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="block w-full rounded-lg border-2 border-input-border bg-input-background py-3 pl-11 pr-4 text-text-primary placeholder:text-text-secondary focus:border-blue-500 focus:ring-0 sm:text-sm" />
                        </div>
                        <button
                          onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            setSelectedProducts([]);
                          }}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isSelectMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-input-background text-text-primary hover:bg-button-secondary-hover'
                            }`}>
                          {isSelectMode ? 'Cancel' : 'Mark'}
                        </button>
                      </div>
                      <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                        <FilterChip label="All" value="all" activeFilter={activeFilter} onClick={setActiveFilter} count={filterCounts.all} />
                        <FilterChip label="Popular" value="popular" activeFilter={activeFilter} onClick={setActiveFilter} count={filterCounts.popular} />
                        <FilterChip label="Limited Stock" value="limited" activeFilter={activeFilter} onClick={setActiveFilter} count={filterCounts.limited} />
                        <FilterChip label="Sold Out" value="soldout" activeFilter={activeFilter} onClick={setActiveFilter} count={filterCounts.soldout} />
                      </div>
                    </div>

                    {/* Product List */}
                    <div className="flex-1 overflow-y-auto p-2 pb-40">
                      {isSelectMode && (
                        <div className="p-2 pb-0">
                          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-input-background">
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
                            <span className="text-sm font-medium text-text-primary">Select All</span>
                          </label>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-1">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map(p => <ProductRow key={p.id} product={p} categories={categories} onEdit={setEditingProduct} onDeleteRequest={setProductToDelete} isSelectMode={isSelectMode} isSelected={selectedProducts.includes(p.id)} onSelect={handleToggleSelection} />)
                        ) : (
                          <div className="text-center py-16"><p className="font-semibold text-text-primary">No products found</p><p className="text-text-secondary mt-1">Try adjusting your search or filters.</p></div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 z-20">
                      <div className="bg-card-background p-4 border-t border-border-color">
                        {isSelectMode ? (
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-text-secondary">
                              {selectedProducts.length} selected
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleBulkDeleteRequest}
                                disabled={selectedProducts.length === 0}
                                className="bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={handleClose} className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition">
                            Done
                          </button>
                        )}
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