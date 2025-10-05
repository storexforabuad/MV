'use client';
import React, { useState, useEffect, Fragment, useMemo } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Product } from '../../types/product';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../../utils/price';
import CategorySelectorModal from './modals/CategorySelectorModal';

interface EditProductPanelProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  categories: { id: string; name: string }[];
}

// A simple styled input
const StyledInput = ({ id, label, value, onChange, type = 'text', placeholder = '' }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary">{label}</label>
        <input 
            type={type} 
            id={id} 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder} 
            className="mt-1 block w-full bg-input-background p-3 rounded-lg border-none text-text-primary placeholder:text-text-secondary focus:ring-2 focus:ring-blue-500" 
        />
    </div>
);

// A simple styled switch
const StyledSwitch = ({ label, description, checked, onChange }) => (
     <Switch.Group as="div" className="flex items-center justify-between py-2">
        <Switch.Label as="span" className="flex-grow flex flex-col pr-4">
            <span className="text-sm font-medium text-text-primary">{label}</span>
            {description && <span className="text-xs text-text-secondary">{description}</span>}
        </Switch.Label>
        <Switch checked={checked} onChange={onChange} className={`${ checked ? 'bg-blue-600' : 'bg-gray-300'} relative inline-flex h-7 w-12 items-center rounded-full transition-colors`}>
            <span className={`${ checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform`} />
        </Switch>
    </Switch.Group>
)


const EditProductPanel: React.FC<EditProductPanelProps> = ({ product, isOpen, onClose, onSave, categories }) => {
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      let initialProductState = { ...product };

      // Backward compatibility: If categoryId is missing, find it from the legacy category name.
      if (!initialProductState.categoryId && (initialProductState.category as unknown as string) && categories.length > 0) {
        const foundCategory = categories.find(c => c.name.toLowerCase() === (initialProductState.category as unknown as string).toLowerCase());
        if (foundCategory) {
          initialProductState.categoryId = foundCategory.id;
        }
      }
      
      setEditedProduct(initialProductState);
    } else if (!isOpen) {
        // Reset state when closing to avoid stale data flash
        setTimeout(() => setEditedProduct(null), 300);
    }
  }, [isOpen, product, categories]);

  const handleInputChange = (field: keyof Product, value: any) => {
    if (editedProduct) {
      setEditedProduct({ ...editedProduct, [field]: value });
    }
  };

  const handleSave = () => {
    if (editedProduct) {
      // Before saving, ensure the legacy `category` field is also updated for consistency
      const categoryName = categories.find(c => c.id === editedProduct.categoryId)?.name || editedProduct.category;
      const productToSave = { ...editedProduct, category: categoryName };
      onSave(productToSave);
      onClose();
    }
  };
  
  const commissionAmount = useMemo(() => {
      if (!editedProduct) return 0;
      const price = editedProduct.onPromo ? editedProduct.promoPrice : editedProduct.price;
      return ((price || 0) * (editedProduct.commission || 0)) / 100;
  }, [editedProduct]);

  const currentCategoryName = useMemo(() => {
      if (!editedProduct?.categoryId) return 'Uncategorized';
      return categories.find(c => c.id === editedProduct.categoryId)?.name || 'Uncategorized';
  }, [editedProduct, categories]);


  if (!editedProduct) return null; // Don't render anything if there's no product

  return (
    <>
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-200" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-background shadow-xl">
                    
                    {/* Header */}
                    <div className="p-4 bg-background sticky top-0 z-10 border-b border-border-color">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-bold text-text-primary">Edit Product</Dialog.Title>
                        <button type="button" className="rounded-full p-1 text-text-secondary hover:bg-button-secondary-hover" onClick={onClose}><span className="sr-only">Close panel</span><XMarkIcon className="h-6 w-6" aria-hidden="true" /></button>
                      </div>
                    </div>

                    {/* Form Content */}
                    <div className="relative flex-1 p-4 space-y-6">
                        
                        <StyledInput 
                            id="product-name" 
                            label="Product Name" 
                            value={editedProduct.name}
                            onChange={(e) => handleInputChange('name', e.target.value)} 
                        />
                        
                        {/* Category Section */}
                         <div>
                            <h3 className="block text-sm font-medium text-text-secondary">Category</h3>
                            <button onClick={() => setCategorySelectorOpen(true)} className="mt-1 flex justify-between items-center w-full bg-input-background p-3 rounded-lg text-left">
                                <span className="text-text-primary">{currentCategoryName}</span>
                                <ChevronRightIcon className="h-5 w-5 text-text-secondary" />
                            </button>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-text-secondary">Pricing</h3>
                                <StyledSwitch 
                                    label="Promo" 
                                    checked={editedProduct.onPromo || false} 
                                    onChange={(checked) => handleInputChange('onPromo', checked)} 
                                />
                            </div>
                            
                            <AnimatePresence mode="wait">
                                <motion.div key={editedProduct.onPromo ? 'promo' : 'normal'} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                    {editedProduct.onPromo ? (
                                        <div className="grid grid-cols-2 gap-4">
                                             <div className="relative">
                                                <p className="mt-1 text-lg font-semibold text-text-secondary line-through p-3">{formatPrice(editedProduct.price)}</p>
                                                <label className="absolute top-0 left-3 text-xs font-medium text-text-secondary">Original Price</label>
                                             </div>
                                            <StyledInput 
                                                id="promo-price" 
                                                label="Promo Price" 
                                                value={editedProduct.promoPrice || ''} 
                                                onChange={(e) => handleInputChange('promoPrice', parseFloat(e.target.value))} 
                                                type="number"
                                            />
                                        </div>
                                    ) : (
                                        <StyledInput 
                                            id="price" 
                                            label="Price" 
                                            value={editedProduct.price} 
                                            onChange={(e) => handleInputChange('price', parseFloat(e.target.value))} 
                                            type="number"
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Commission Slider */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Commission</label>
                            <div className="mt-2 bg-input-background p-4 rounded-lg">
                                <input type="range" min="1" max="25" value={editedProduct.commission || 0} onChange={e => handleInputChange('commission', parseInt(e.target.value))} className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer slider-thumb"/>
                                <div className="flex justify-center items-center text-sm font-medium text-text-primary mt-2">
                                    <span>{editedProduct.commission || 0}%</span>
                                    <span className="text-text-secondary mx-2">-</span>
                                    <span className="font-bold">{formatPrice(commissionAmount)}</span>
                                </div>
                            </div>
                        </div>

                         {/* Inventory Section */}
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-text-secondary mb-2">Inventory</h3>
                            <StyledSwitch 
                                label="Limited Stock" 
                                description="Mark item as having limited availability."
                                checked={editedProduct.limitedStock || false} 
                                onChange={(checked) => handleInputChange('limitedStock', checked)} 
                            />
                             <StyledSwitch 
                                label="Sold Out" 
                                description="Mark item as completely unavailable."
                                checked={editedProduct.soldOut || false} 
                                onChange={(checked) => handleInputChange('soldOut', checked)} 
                            />
                        </div>

                    </div>

                    {/* Footer with Actions */}
                    <div className="flex-shrink-0 border-t border-border-color px-4 py-3 bg-background sticky bottom-0">
                      <div className="flex justify-end space-x-3">
                        <button type="button" className="rounded-lg border border-border-color bg-button-secondary py-2 px-4 text-sm font-semibold text-text-primary shadow-sm hover:bg-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={onClose}>Cancel</button>
                        <button type="button" className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={handleSave}>Save Changes</button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>

    <CategorySelectorModal
        isOpen={isCategorySelectorOpen}
        onClose={() => setCategorySelectorOpen(false)}
        categories={categories}
        selectedCategoryId={editedProduct.categoryId}
        onSelect={(categoryId) => {
            handleInputChange('categoryId', categoryId);
            setCategorySelectorOpen(false);
        }}
    />
    </>
  );
};

export default EditProductPanel;
