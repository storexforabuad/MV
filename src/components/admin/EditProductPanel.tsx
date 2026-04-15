'use client';
import React, { useState, useEffect, Fragment, useMemo, ChangeEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronRightIcon, TrashIcon } from '@heroicons/react/24/solid';
import {
  Product,
  FashionProduct,
  ElectronicsProduct,
  ArtProduct,
  BeautyProduct,
  MediaInfluencerProduct,
  VehicleProduct,
  SolarProduct,
  FoodBeverageProduct
} from '../../types/product';
import { motion, AnimatePresence } from 'framer-motion';
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

type ProductFormState = Omit<Product, 'price' | 'originalPrice'> & {
  basePrice: number | null;
  promoPrice: number | null;
  limitedStock?: boolean;
  soldOut?: boolean;
  colors?: FashionProduct['colors'];
  sizes?: string[];
  soldOutSizes?: string[];
  availableSizes?: string[];
  sizeOption?: 'baby-clothes' | 'kids-shoes' | 'adult-shoes';

  // Electronics & Solar
  brand?: string;
  condition?: ElectronicsProduct['condition'];
  storage?: string;
  ram?: string;
  warranty?: boolean;
  warrantyDuration?: string;

  // Media Influencer
  platform?: MediaInfluencerProduct['platform'];
  deliveryTimeDays?: number;
  revisionsAllowed?: number;
  subtype?: string; // Used by Media, Beauty, Food, Solar

  // Beauty
  shades?: BeautyProduct['shades'];

  // Art
  artDetails?: ArtProduct['artDetails'];

  // Vehicle
  vehicleDetails?: VehicleProduct['vehicleDetails'];

  // Food
  preparationTime?: number;

  category?: string;
};

const StyledInput: React.FC<{ id: string, label: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string, disabled?: boolean }> = ({ id, label, value, onChange, type = 'text', placeholder = '', disabled = false }) => (
  <div className={disabled ? 'opacity-60' : ''}>
    <label htmlFor={id} className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`mt-1 block w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-transparent ${disabled ? 'cursor-not-allowed' : 'text-gray-900 dark:text-gray-100'} placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
        promoPrice = null;
      }

      setFormState({
        ...product,
        basePrice: basePrice,
        promoPrice: promoPrice,
        availableSizes: (product as any).availableSizes || [],
        soldOutSizes: (product as any).soldOutSizes || [],
        sizeOption: (product as any).sizeOption,
      });
    } else {
      setTimeout(() => {
        setFormState({});
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

  const handleSave = async () => {
    if (!product || !formState || isSaving) return;

    const { basePrice, promoPrice, onPromo, ...restOfState } = formState;
    const payload: any = {
      ...restOfState,
      productType: formState.productType || 'general',
      onPromo: onPromo,
    };

    if (onPromo) {
      if (typeof promoPrice !== 'number' || typeof basePrice !== 'number' || promoPrice >= basePrice) {
        alert('Error: When a promotion is active, the promo price must be a valid number and less than the original price.');
        return;
      }
      payload.price = promoPrice;
      payload.originalPrice = basePrice;
    } else {
      if (typeof basePrice !== 'number') {
        alert('Error: The product must have a valid price.');
        return;
      }
      const isBookingFeeValidation = formState.productType === 'media-influencer' && (formState as any).subtype === 'booking-fee';
      if (isBookingFeeValidation && basePrice < 5000) {
        alert('Error: Minimum price for the Booking Access Fee is ₦5,000.');
        return;
      }
      payload.price = basePrice;
      payload.originalPrice = undefined;
    }

    // Handle Specialized Types
    if (formState.productType === 'electronics' || formState.productType === 'solar') {
      (payload as any).brand = formState.brand;
      (payload as any).subtype = formState.subtype;
      (payload as any).condition = formState.condition;
      (payload as any).storage = formState.storage;
      (payload as any).ram = formState.ram;
      (payload as any).warranty = formState.warranty;
      (payload as any).warrantyDuration = formState.warranty ? formState.warrantyDuration : null;
    }

    if (formState.productType === 'media-influencer') {
      (payload as any).platform = formState.platform;
      (payload as any).deliveryTimeDays = formState.deliveryTimeDays;
      (payload as any).revisionsAllowed = formState.revisionsAllowed;
      (payload as any).subtype = formState.subtype;
    }

    if (formState.productType === 'beauty') {
      (payload as any).brand = formState.brand;
      (payload as any).subtype = formState.subtype;
      (payload as any).shades = formState.shades;
    }

    if (formState.productType === 'art') {
      (payload as any).artDetails = formState.artDetails;
    }

    if (formState.productType === 'vehicle') {
      (payload as any).vehicleDetails = formState.vehicleDetails;
    }

    if (formState.productType === 'food') {
      (payload as any).subtype = formState.subtype;
      (payload as any).preparationTime = formState.preparationTime;
    }

    // Ensure sizes are synced for Fashion
    if (formState.productType === 'fashion') {
      (payload as any).sizes = formState.sizes;
      (payload as any).soldOutSizes = formState.soldOutSizes;
    } else {
      (payload as any).availableSizes = formState.availableSizes;
      (payload as any).sizeOption = formState.sizeOption;
      if (formState.sizeOption) {
        (payload as any).soldOutSizes = formState.soldOutSizes;
      }
    }

    setIsSaving(true);
    try {
      await onSave(payload);
      ProductDetailCache.clear();
      ProductCache.clear();
      onClose();
    } catch (error) {
      console.error("Failed to save product changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentCategoryName = useMemo(() => {
    const categoryId = formState?.categoryId;
    if (!categoryId) return 'Uncategorized';
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  }, [formState, categories]);

  if (!formState || !product) return null;

  const isBookingFee = formState.productType === 'media-influencer' && (formState as any).subtype === 'booking-fee';
  const isServiceHub = formState.productType === 'media-influencer' && (formState as any).subtype === 'service-hub';

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
                    <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-900 shadow-xl">

                      <div className="p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit Product</Dialog.Title>
                          <button type="button" className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={onClose}><span className="sr-only">Close panel</span><XMarkIcon className="h-6 w-6" aria-hidden="true" /></button>
                        </div>
                      </div>

                      <div className="relative flex-1 p-4 space-y-6">

                        {isBookingFee && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-800">
                            <h3 className="font-bold text-amber-900 dark:text-amber-100 text-lg">Booking Access Fee</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              This is the 1-time verification fee brands pay to unlock PR requests. You can only adjust the price (minimum ₦5,000). The platform takes a 20% cut. Name and categorization are locked to maintain platform standards.
                            </p>
                          </div>
                        )}

                        {isServiceHub && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                            <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">Influencer Services Hub</h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                              This is your professional services entry point. You can customize the name, description, and price (which will show as "Starting from"). The premium images provided are optimized for conversion.
                            </p>
                          </div>
                        )}

                        <StyledInput
                          id="product-name"
                          label="Product Name"
                          value={formState.name ?? ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                          disabled={isBookingFee}
                        />

                        <div className={isBookingFee ? 'opacity-60 pointer-events-none' : ''}>
                          <h3 className="block text-sm font-medium text-gray-500 dark:text-gray-400">Category</h3>
                          <button onClick={() => !isBookingFee && setCategorySelectorOpen(true)} className="mt-1 flex justify-between items-center w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-left disabled:cursor-not-allowed">
                            <span className="text-gray-900 dark:text-gray-100">{currentCategoryName}</span>
                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>

                        <StyledInput
                          id="price"
                          label="Price"
                          value={formState.basePrice ?? ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handlePriceChange('basePrice', e.target.value)}
                          type="number"
                        />

                        {!isBookingFee && (
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
                        )}

                        {formState.productType === 'livestock' && (
                          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Livestock Details</h3>
                            <StyledInput
                              id="species"
                              label="Species"
                              value={(formState as any).species ?? ''}
                              onChange={(e) => handleInputChange('species' as any, e.target.value)}
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Life Stage</label>
                              <select
                                value={(formState as any).lifeStage ?? 'table-size'}
                                onChange={(e) => handleInputChange('lifeStage' as any, e.target.value)}
                                className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="fingerling">Fingerling</option>
                                <option value="juvenile">Juvenile</option>
                                <option value="table-size">Table Size</option>
                                <option value="broodstock">Broodstock</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Water Type</label>
                              <select
                                value={(formState as any).waterType ?? 'freshwater'}
                                onChange={(e) => handleInputChange('waterType' as any, e.target.value)}
                                className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="freshwater">Freshwater</option>
                                <option value="saltwater">Saltwater</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pricing Unit</label>
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => handleInputChange('priceUnit' as any, 'kg')}
                                  className={`flex-1 p-3 rounded-lg border-2 ${(formState as any).priceUnit === 'kg' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                                >
                                  Per Kg
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInputChange('priceUnit' as any, 'piece')}
                                  className={`flex-1 p-3 rounded-lg border-2 ${(formState as any).priceUnit === 'piece' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
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

                        {formState.productType === 'fashion' && (
                          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fashion Details</h3>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Size Availability</label>
                              <div className="grid grid-cols-3 gap-2">
                                {formState.sizes?.map((size: string) => {
                                  const isSoldOut = formState.soldOutSizes?.includes(size);
                                  return (
                                    <button
                                      key={size}
                                      type="button"
                                      onClick={() => {
                                        const currentSoldOut = formState.soldOutSizes || [];
                                        const newSoldOut = isSoldOut
                                          ? currentSoldOut.filter((s: string) => s !== size)
                                          : [...currentSoldOut, size];
                                        handleInputChange('soldOutSizes', newSoldOut);
                                      }}
                                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${isSoldOut
                                        ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                        : 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                        }`}
                                    >
                                      {size} {isSoldOut ? '(Sold Out)' : '(Available)'}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Colors</label>
                              </div>
                              <div className="space-y-3">
                                {formState.colors?.map((color: any, index: number) => (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ backgroundColor: color.hex }}></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{color.name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{color.images.length} images</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Are you sure you want to remove this color variant?')) {
                                          const newColors = formState.colors?.filter((_: any, i: number) => i !== index);
                                          handleInputChange('colors', newColors || []);
                                        }
                                      }}
                                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                    >
                                      <TrashIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                ))}
                                {(formState.colors?.length || 0) === 0 && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No colors added.</p>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                To add new colors with images, please use the "Add Product" composer.
                              </p>
                            </div>
                          </div>
                        )}

                        {formState.productType === 'general' && formState.sizeOption && (
                          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Size Availability</h3>
                            <div className="grid grid-cols-3 gap-2">
                              {formState.availableSizes?.map((size: string) => {
                                const isSoldOut = formState.soldOutSizes?.includes(size);
                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                      const currentSoldOut = formState.soldOutSizes || [];
                                      const newSoldOut = isSoldOut
                                        ? currentSoldOut.filter((s: string) => s !== size)
                                        : [...currentSoldOut, size];
                                      handleInputChange('soldOutSizes', newSoldOut);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${isSoldOut
                                      ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                      : 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                      }`}
                                  >
                                    {size} {isSoldOut ? '(Sold Out)' : '(Available)'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {(formState.productType === 'electronics' || formState.productType === 'solar' || formState.productType === 'beauty') && (
                          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{formState.productType} Details</h3>

                            <StyledInput
                              id="brand"
                              label="Brand"
                              value={formState.brand ?? ''}
                              onChange={(e) => handleInputChange('brand', e.target.value)}
                            />

                            {(formState.productType === 'beauty' || formState.productType === 'solar') && (
                              <StyledInput
                                id="subtype"
                                label="Subtype (e.g. Skin Care, Panels)"
                                value={formState.subtype ?? ''}
                                onChange={(e) => handleInputChange('subtype', e.target.value)}
                              />
                            )}

                            {formState.productType === 'electronics' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Condition</label>
                                  <select
                                    value={formState.condition ?? 'brand-new'}
                                    onChange={(e) => handleInputChange('condition', e.target.value)}
                                    className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="brand-new">Brand New</option>
                                    <option value="open-box">Open Box</option>
                                    <option value="used-good">Used (Good)</option>
                                    <option value="used-fair">Used (Fair)</option>
                                    <option value="refurbished">Refurbished</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <StyledInput
                                    id="storage"
                                    label="Storage"
                                    value={formState.storage ?? ''}
                                    onChange={(e) => handleInputChange('storage', e.target.value)}
                                  />
                                  <StyledInput
                                    id="ram"
                                    label="RAM"
                                    value={formState.ram ?? ''}
                                    onChange={(e) => handleInputChange('ram', e.target.value)}
                                  />
                                </div>
                              </>
                            )}

                            <div className="space-y-3 pt-2">
                              <ModernSwitch
                                label="Includes Warranty"
                                checked={formState.warranty || false}
                                onChange={(checked) => handleInputChange('warranty', checked)}
                              />
                              <AnimatePresence>
                                {formState.warranty && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <StyledInput
                                      id="warrantyDuration"
                                      label="Warranty Duration"
                                      placeholder="e.g. 6 months"
                                      value={formState.warrantyDuration ?? ''}
                                      onChange={(e) => handleInputChange('warrantyDuration', e.target.value)}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                        {formState.productType === 'media-influencer' && (
                          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Media/Campaign Details</h3>

                            <div>
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Platform</label>
                              <select
                                value={formState.platform ?? 'Instagram'}
                                onChange={(e) => handleInputChange('platform', e.target.value)}
                                className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Instagram">Instagram</option>
                                <option value="TikTok">TikTok</option>
                                <option value="YouTube">YouTube</option>
                                <option value="Twitter">Twitter</option>
                                <option value="Cross-Platform">Cross-Platform</option>
                              </select>
                            </div>

                            <StyledInput
                              id="deliveryDays"
                              label="Delivery Time (Days)"
                              type="number"
                              value={formState.deliveryTimeDays ?? ''}
                              onChange={(e) => handleInputChange('deliveryTimeDays', parseInt(e.target.value))}
                            />

                            <StyledInput
                              id="revisions"
                              label="Max Revisions"
                              type="number"
                              value={formState.revisionsAllowed ?? ''}
                              onChange={(e) => handleInputChange('revisionsAllowed', parseInt(e.target.value))}
                            />
                          </div>
                        )}

                        {formState.productType === 'art' && (
                          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Artwork Specifications</h3>

                            <StyledInput
                              id="art-medium"
                              label="Medium"
                              value={formState.artDetails?.medium ?? ''}
                              onChange={(e) => handleInputChange('artDetails', { ...formState.artDetails, medium: e.target.value })}
                            />

                            <StyledInput
                              id="art-dimensions"
                              label="Dimensions"
                              value={formState.artDetails?.dimensions ?? ''}
                              onChange={(e) => handleInputChange('artDetails', { ...formState.artDetails, dimensions: e.target.value })}
                            />

                            <div className="flex gap-4">
                              <ModernSwitch
                                label="Is Framed"
                                checked={formState.artDetails?.isFramed || false}
                                onChange={(checked) => handleInputChange('artDetails', { ...formState.artDetails, isFramed: checked })}
                              />
                              <ModernSwitch
                                label="Is Signed"
                                checked={formState.artDetails?.isSigned || false}
                                onChange={(checked) => handleInputChange('artDetails', { ...formState.artDetails, isSigned: checked })}
                              />
                            </div>
                          </div>
                        )}

                        {formState.productType === 'vehicle' && formState.vehicleDetails && (
                          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Specification</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <StyledInput
                                id="vehicle-make"
                                label="Make"
                                value={formState.vehicleDetails.make}
                                onChange={(e) => handleInputChange('vehicleDetails', { ...formState.vehicleDetails, make: e.target.value })}
                              />
                              <StyledInput
                                id="vehicle-model"
                                label="Model"
                                value={formState.vehicleDetails.model}
                                onChange={(e) => handleInputChange('vehicleDetails', { ...formState.vehicleDetails, model: e.target.value })}
                              />
                              <StyledInput
                                id="vehicle-year"
                                label="Year"
                                value={formState.vehicleDetails.year}
                                onChange={(e) => handleInputChange('vehicleDetails', { ...formState.vehicleDetails, year: e.target.value })}
                              />
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Condition</label>
                                <select
                                  value={formState.vehicleDetails.condition}
                                  onChange={(e) => handleInputChange('vehicleDetails', { ...formState.vehicleDetails, condition: e.target.value })}
                                  className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="brand-new">Brand New</option>
                                  <option value="nigerian-used">Nigerian Used</option>
                                  <option value="foreign-used">Foreign Used (Tokunbo)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {formState.productType === 'food' && (
                          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Food/Dining Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Subtype</label>
                                <select
                                  value={formState.subtype ?? 'dish'}
                                  onChange={(e) => handleInputChange('subtype', e.target.value)}
                                  className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="dish">Dish</option>
                                  <option value="drink">Drink</option>
                                  <option value="snack">Snack</option>
                                </select>
                              </div>
                              <StyledInput
                                id="prep-time"
                                label="Prep Time (Mins)"
                                type="number"
                                value={formState.preparationTime ?? ''}
                                onChange={(e) => handleInputChange('preparationTime', parseInt(e.target.value))}
                              />
                            </div>
                          </div>
                        )}

                        {!isBookingFee && (
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Inventory Status</h3>
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
                        )}

                      </div>

                      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-900 sticky bottom-0">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            className="flex-1 inline-flex justify-center rounded-lg bg-gray-200 dark:bg-gray-700 py-2 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
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
          const selectedCat = categories.find(c => c.id === categoryId);
          handleInputChange('categoryId', categoryId);
          if (selectedCat) {
            handleInputChange('category', selectedCat.name);
          }
          setCategorySelectorOpen(false);
        }}
        onAddCategory={onAddCategory}
      />
    </>
  );
};

export default EditProductPanel;
