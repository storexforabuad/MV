
'use client';
import React, { useState, useEffect, Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Product } from '../../types/product';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../../utils/price';
import CategorySelectorModal from './modals/CategorySelectorModal';
import ModernSwitch from '../common/ModernSwitch';
import { ProductDetailCache } from '../../lib/productDetailCache';
import { ProductCache } from '../../lib/productCache';

interface EditProductPanelProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: Partial<Product>) => void;
  onDelete: (productId: string) => void;
  categories: { id: string; name: string }[];
}

// Defines the shape of the form's state, which is clearer than the DB schema
interface ProductFormState extends Omit<Product, 'price' | 'originalPrice'> {
    basePrice: number | null;
    promoPrice: number | null;
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

const EditProductPanel: React.FC<EditProductPanelProps> = ({ product, isOpen, onClose, onSave, onDelete, categories }) => {
  const [formState, setFormState] = useState<Partial<ProductFormState>>({});
  const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
        const isPromo = product.onPromo;
        const dbPrice = product.price;
        const dbOriginalPrice = product.originalPrice;

        let basePrice, promoPrice;

        if (isPromo) {
            basePrice = dbOriginalPrice;
            promoPrice = dbPrice;
        } else {
            basePrice = dbPrice;
            promoPrice = null; // Use null for empty promo price
        }

        setFormState({ 
            ...product,
            basePrice: basePrice,
            promoPrice: promoPrice,
        });
    } else {
        setTimeout(() => {
            setFormState({});
            setDeleteConfirm(false);
        }, 300);
    }
  }, [isOpen, product]);

  const handleInputChange = (field: keyof ProductFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (field: 'basePrice' | 'promoPrice', value: string) => {
    const numericValue = parseFloat(value);
    handleInputChange(field, isNaN(numericValue) ? null : numericValue);
  };

  const handleSave = () => {
    if (!product || !formState) return;

    const { basePrice, promoPrice, onPromo, ...restOfState } = formState;

    if (onPromo && (promoPrice === null || basePrice === null || promoPrice >= basePrice)) {
        alert('Error: When a promotion is active, the promo price must be less than the original price.');
        console.error('Save Blocked: Invalid promo price.', { basePrice, promoPrice });
        return;
    }

    const payload: Partial<Product> = {
        ...restOfState,
        onPromo: onPromo,
    };

    if (onPromo) {
        payload.price = promoPrice;
        payload.originalPrice = basePrice;
    } else {
        payload.price = basePrice;
        payload.originalPrice = null;
    }

    delete (payload as any).promoPrice;
    delete (payload as any).basePrice;
      
    onSave(payload);
    ProductDetailCache.clear(product.id);
    ProductCache.clear();
    onClose();
  };

  const handleDelete = () => {
      if(product && deleteConfirm) {
          onDelete(product.id);
          ProductDetailCache.clear(product.id);
          ProductCache.clear();
          onClose();
      } else {
          setDeleteConfirm(true);
          setTimeout(() => setDeleteConfirm(false), 3000);
      }
  }

  const commissionAmount = useMemo(() => {
    if (!formState) return 0;
    const price = formState.onPromo ? formState.promoPrice : formState.basePrice;
    return ((price || 0) * (formState.commission || 0)) / 100;
  }, [formState]);

  const currentCategoryName = useMemo(() => {
      const categoryId = formState?.categoryId;
      if (!categoryId) return 'Uncategorized';
      return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  }, [formState, categories]);

  if (!formState || !product) return null;

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

                    <div className="p-4 bg-background sticky top-0 z-10 border-b border-border-color">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-bold text-text-primary">Edit Product</Dialog.Title>
                        <button type="button" className="rounded-full p-1 text-text-secondary hover:bg-button-secondary-hover" onClick={onClose}><span className="sr-only">Close panel</span><XMarkIcon className="h-6 w-6" aria-hidden="true" /></button>
                      </div>
                    </div>

                    <div className="relative flex-1 p-4 space-y-6">

                        <StyledInput
                            id="product-name"
                            label="Product Name"
                            value={formState.name ?? ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                        />

                         <div>
                            <h3 className="block text-sm font-medium text-text-secondary">Category</h3>
                            <button onClick={() => setCategorySelectorOpen(true)} className="mt-1 flex justify-between items-center w-full bg-input-background p-3 rounded-lg text-left">
                                <span className="text-text-primary">{currentCategoryName}</span>
                                <ChevronRightIcon className="h-5 w-5 text-text-secondary" />
                            </button>
                        </div>
                        
                        <StyledInput
                            id="price"
                            label="Price"
                            value={formState.basePrice ?? ''}
                            onChange={(e) => handlePriceChange('basePrice', e.target.value)}
                            type="number"
                        />

                        <div className="space-y-3">
                           <ModernSwitch
                                label="Promo"
                                checked={formState.onPromo || false}
                                onChange={(checked) => handleInputChange('onPromo', checked)}
                            />

                            <AnimatePresence>
                                {formState.onPromo && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                        <StyledInput
                                            id="promo-price"
                                            label="Promo Price"
                                            value={formState.promoPrice ?? ''}
                                            onChange={(e) => handlePriceChange('promoPrice', e.target.value)}
                                            type="number"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Commission</label>
                            <div className="mt-2 bg-input-background p-4 rounded-lg">
                            <div className="flex justify-center items-center text-sm font-medium text-text-primary mb-2">
                                    <span>{formState.commission || 0}%</span>
                                    <span className="text-text-secondary mx-2">-</span>
                                    <span className="font-bold">{formatPrice(commissionAmount)}</span>
                                 </div>
                                <input type="range" min="2" max="12" value={formState.commission || 0} onChange={e => handleInputChange('commission', parseInt(e.target.value))} className="w-full h-2.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer glass-slider"/>
                                
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-text-secondary mb-2">Inventory</h3>
                            <ModernSwitch
                                label="Limited Stock"
                                description="Mark item as having limited availability."
                                checked={formState.limitedStock || false}
                                onChange={(checked) => handleInputChange('limitedStock', checked)}
                            />
                             <ModernSwitch
                                label="Sold Out"
                                description="Mark item as completely unavailable."
                                checked={formState.soldOut || false}
                                onChange={(checked) => handleInputChange('soldOut', checked)}
                            />
                        </div>

                    </div>

                    <div className="flex-shrink-0 border-t border-border-color px-4 py-3 bg-background sticky bottom-0">
                      <div className="flex gap-3">
                        <button type="button" className={`flex-1 inline-flex justify-center rounded-lg border border-transparent py-2 px-4 text-sm font-semibold text-white shadow-sm transition-colors ${deleteConfirm ? 'bg-red-700 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'}`} onClick={handleDelete}>{deleteConfirm ? 'Confirm Delete?' : 'Delete'}</button>
                        <button type="button" className="flex-1 inline-flex justify-center rounded-lg border border-transparent bg-gray-900 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2" onClick={handleSave}>Save Changes</button>
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
        selectedCategoryId={formState.categoryId}
        onSelect={(categoryId) => {
            handleInputChange('categoryId', categoryId);
            setCategorySelectorOpen(false);
        }}
    />
    </>
  );
};

export default EditProductPanel;
