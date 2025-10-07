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
import { ProductListCache } from '../../lib/productCache';

interface EditProductPanelProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: Partial<Product>) => void;
  onDelete: (productId: string) => void;
  categories: { id: string; name: string }[];
}

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
  const [editedFields, setEditedFields] = useState<Partial<Product>>({});
  const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fullProductState = useMemo(() => {
    if (!product) return null;
    const state = { ...product, ...editedFields };

    if (state.onPromo && state.promoPrice) {
      state.originalPrice = state.price;
      state.price = state.promoPrice;
    }
    
    return state;
  }, [product, editedFields]);

  useEffect(() => {
    if (isOpen && product) {
      const initialFields = { ...product };
      if (product.onPromo && product.promoPrice) {
        initialFields.originalPrice = product.price;
        initialFields.price = product.promoPrice;
      }
      setEditedFields(initialFields);
    } else {
        setTimeout(() => {
            setEditedFields({});
            setDeleteConfirm(false);
        }, 300);
    }
  }, [isOpen, product]);

  const handleInputChange = (field: keyof Product, value: any) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (product && Object.keys(editedFields).length > 0) {
        const finalPayload: Partial<Product> = { ...editedFields };

        if (finalPayload.onPromo) {
            finalPayload.originalPrice = product.price;
        } else {
            finalPayload.originalPrice = null;
            finalPayload.promoPrice = null;
        }

        onSave(finalPayload);
        ProductDetailCache.clear(product.id);
        ProductListCache.clearAll();
    }
    onClose();
  };

  const handleDelete = () => {
      if(product && deleteConfirm) {
          onDelete(product.id);
          ProductDetailCache.clear(product.id);
          ProductListCache.clearAll();
          onClose();
      } else {
          setDeleteConfirm(true);
          setTimeout(() => setDeleteConfirm(false), 3000);
      }
  }

  const commissionAmount = useMemo(() => {
      if (!fullProductState) return 0;
      const price = fullProductState.onPromo ? fullProductState.price : fullProductState.price;
      return ((price || 0) * (fullProductState.commission || 0)) / 100;
  }, [fullProductState]);

  const currentCategoryName = useMemo(() => {
      const categoryId = fullProductState?.categoryId;
      if (!categoryId) return 'Uncategorized';
      return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  }, [fullProductState, categories]);


  if (!fullProductState) return null;

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
                            value={fullProductState.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                        />

                        <div>
                            <h3 className="block text-sm font-medium text-text-secondary">Category</h3>
                            <button onClick={() => setCategorySelectorOpen(true)} className="mt-1 flex justify-between items-center w-full bg-input-background p-3 rounded-lg text-left">
                                <span className="text-text-primary">{currentCategoryName}</span>
                                <ChevronRightIcon className="h-5 w-5 text-text-secondary" />
                            </button>
                        </div>

                        <div className="space-y-3">
                           <ModernSwitch
                                label="Promo"
                                checked={fullProductState.onPromo || false}
                                onChange={(checked) => handleInputChange('onPromo', checked)}
                            />

                            <AnimatePresence mode="wait">
                                <motion.div key={fullProductState.onPromo ? 'promo' : 'normal'} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                    {fullProductState.onPromo ? (
                                        <div className="grid grid-cols-2 gap-4">
                                             <div className="relative">
                                                <p className="mt-1 text-lg font-semibold text-text-secondary line-through p-3">{formatPrice(fullProductState.originalPrice || product.price)}</p>
                                                <label className="absolute top-0 left-3 text-xs font-medium text-text-secondary">Original Price</label>
                                             </div>
                                            <StyledInput
                                                id="promo-price"
                                                label="Promo Price"
                                                value={fullProductState.price || ''}
                                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                                                type="number"
                                            />
                                        </div>
                                    ) : (
                                        <StyledInput
                                            id="price"
                                            label="Price"
                                            value={fullProductState.price}
                                            onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                                            type="number"
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Commission</label>
                            <div className="mt-2 bg-input-background p-4 rounded-lg">
                                <input type="range" min="1" max="10" value={fullProductState.commission || 0} onChange={e => handleInputChange('commission', parseInt(e.target.value))} className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer glass-slider"/>
                                <div className="flex justify-center items-center text-sm font-medium text-text-primary mt-2">
                                    <span>{fullProductState.commission || 0}%</span>
                                    <span className="text-text-secondary mx-2">-</span>
                                    <span className="font-bold">{formatPrice(commissionAmount)}</span>
                                 </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-text-secondary mb-2">Inventory</h3>
                            <ModernSwitch
                                label="Limited Stock"
                                description="Mark item as having limited availability."
                                checked={fullProductState.limitedStock || false}
                                onChange={(checked) => handleInputChange('limitedStock', checked)}
                            />
                             <ModernSwitch
                                label="Sold Out"
                                description="Mark item as completely unavailable."
                                checked={fullProductState.soldOut || false}
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
        selectedCategoryId={fullProductState.categoryId}
        onSelect={(categoryId) => {
            handleInputChange('categoryId', categoryId);
            setCategorySelectorOpen(false);
        }}
    />
    </>
  );
};

export default EditProductPanel;