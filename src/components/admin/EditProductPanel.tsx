'use client';
import React, { useState, useEffect, Fragment, useMemo, ChangeEvent } from 'react';
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
  onSave: (updatedFields: Partial<Product>) => Promise<void>;
  categories: { id: string; name: string }[];
  onAddCategory: (name: string) => Promise<void>;
}

// Defines the shape of the form's state, which is clearer than the DB schema
interface ProductFormState extends Omit<Product, 'price' | 'originalPrice'> {
  basePrice: number | null;
  promoPrice: number | null;
  // General product specific fields (optional for vehicle products)
  limitedStock?: boolean;
  soldOut?: boolean;
}

// A simple styled input
const StyledInput: React.FC<{ id: string, label: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string }> = ({ id, label, value, onChange, type = 'text', placeholder = '' }) => (
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

const EditProductPanel: React.FC<EditProductPanelProps> = ({ product, isOpen, onClose, onSave, categories, onAddCategory }) => {
  const [formState, setFormState] = useState<Partial<ProductFormState>>({});
  const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      }, 300);
    }
  }, [isOpen, product]);

  const handleInputChange = (field: keyof ProductFormState, value: string | number | boolean | null) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (field: 'basePrice' | 'promoPrice', value: string) => {
    const numericValue = parseFloat(value);
    handleInputChange(field, isNaN(numericValue) ? null : numericValue);
  };

  const handleSave = async () => {
    if (!product || !formState || isSaving) return;

    const { basePrice, promoPrice, onPromo, ...restOfState } = formState;

    // The final payload to be sent for saving.
    const payload: Partial<Product> = {
      ...restOfState,
      productType: formState.productType || 'general',
      onPromo: onPromo,
    };

    if (onPromo) {
      // For a promotion, both prices must be valid numbers, and the promo price must be lower.
      if (typeof promoPrice !== 'number' || typeof basePrice !== 'number' || promoPrice >= basePrice) {
        alert('Error: When a promotion is active, the promo price must be a valid number and less than the original price.');
        console.error('Save Blocked: Invalid promotional pricing.', { basePrice, promoPrice });
        return;
      }
      payload.price = promoPrice;
      payload.originalPrice = basePrice;
    } else {
      // If not on promo, only base price is needed and it must be a valid number.
      if (typeof basePrice !== 'number') {
        alert('Error: The product must have a valid price.');
        console.error('Save Blocked: Missing or invalid base price.', { basePrice });
        return;
      }
      payload.price = basePrice;
      payload.originalPrice = undefined; // Explicitly remove originalPrice if not on promo.
    }

    setIsSaving(true);
    try {
      await onSave(payload);
      ProductDetailCache.clear();
      ProductCache.clear();
      onClose();
    } catch (error) {
      console.error("Failed to save product changes:", error);
      // Optionally, inform the user about the failure
    } finally {
      setIsSaving(false);
    }
  };

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
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
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
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handlePriceChange('basePrice', e.target.value)}
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

                        {/* Commission Slider Removed - Fixed 2.5% globally */}

                        {formState.productType === 'livestock' && (
                          <div className="space-y-4 border-t border-border-color pt-4">
                            <h3 className="text-sm font-medium text-text-secondary">Livestock Details</h3>

                            <StyledInput
                              id="species"
                              label="Species"
                              value={(formState as any).species ?? ''}
                              onChange={(e) => handleInputChange('species' as any, e.target.value)}
                            />

                            <div>
                              <label className="block text-sm font-medium text-text-secondary mb-2">Life Stage</label>
                              <select
                                value={(formState as any).lifeStage ?? 'table-size'}
                                onChange={(e) => handleInputChange('lifeStage' as any, e.target.value)}
                                className="w-full p-3 bg-input-background rounded-lg border-none text-text-primary focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="fingerling">Fingerling</option>
                                <option value="juvenile">Juvenile</option>
                                <option value="table-size">Table Size</option>
                                <option value="broodstock">Broodstock</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-text-secondary mb-2">Water Type</label>
                              <select
                                value={(formState as any).waterType ?? 'freshwater'}
                                onChange={(e) => handleInputChange('waterType' as any, e.target.value)}
                                className="w-full p-3 bg-input-background rounded-lg border-none text-text-primary focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="freshwater">Freshwater</option>
                                <option value="saltwater">Saltwater</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-text-secondary mb-2">Pricing Unit</label>
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => handleInputChange('priceUnit' as any, 'kg')}
                                  className={`flex-1 p-3 rounded-lg border-2 ${(formState as any).priceUnit === 'kg' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-input-border'}`}
                                >
                                  Per Kg
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInputChange('priceUnit' as any, 'piece')}
                                  className={`flex-1 p-3 rounded-lg border-2 ${(formState as any).priceUnit === 'piece' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-input-border'}`}
                                >
                                  Per Piece
                                </button>
                              </div>
                            </div>

                            <StyledInput
                              id="stock"
                              label={`Stock Available (${(formState as any).priceUnit === 'kg' ? 'Kilos' : 'Pieces'})`}
                              type="number"
                              value={(formState as any).stock ?? 0}
                              onChange={(e) => handleInputChange('stock' as any, parseFloat(e.target.value) || 0)}
                            />

                            <StyledInput
                              id="averageWeight"
                              label="Average Weight (Kg) - Optional"
                              type="number"
                              value={(formState as any).averageWeight ?? ''}
                              onChange={(e) => handleInputChange('averageWeight' as any, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-text-secondary mb-2">Inventory Status</h3>
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
                          <button
                            type="button"
                            className="flex-1 inline-flex justify-center rounded-lg bg-input-background py-2 px-4 text-sm font-semibold text-text-primary shadow-sm hover:bg-button-secondary-hover"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent bg-gray-900 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            onClick={handleSave}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
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
        onSelect={(categoryId: string) => {
          handleInputChange('categoryId', categoryId);
          setCategorySelectorOpen(false);
        }}
        onAddCategory={onAddCategory}
      />
    </>
  );
};

export default EditProductPanel;
