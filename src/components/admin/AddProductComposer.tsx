'use client';
import React, { useState, useRef, Fragment, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Product } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import { formatPrice } from '../../utils/price';
import CategorySelectorModal from './modals/CategorySelectorModal';
import ProductUploadTips from './ProductUploadTips';
import { SizeOption, getSizesForOption } from '../../utils/sizeOptions';
import {
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ImagePlus
} from 'lucide-react';


// --- TYPES ---
type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'success' | 'error';
interface UploadProgress {
  id: string;
  fileName: string;
  setIsUploading(false);
  setCurrentStep(5); // Move to summary
};

const renderStepContent = () => {
  const activeProduct = batchProducts[activeProductIndex];
  const MotionDiv = motion.div;

  switch (currentStep) {
    case 0: // Initial Upload Step
      return (
        <MotionDiv key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
          <input type="file" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} className="hidden" />
          <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer w-full flex flex-col items-center justify-center py-20 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 group">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
              <ImagePlus className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">Tap to upload pictures</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add one or more images to get started</span>
          </div>
          <ProductUploadTips />
        </MotionDiv>
      );

    case 1: // Details Step
    case 2: // Pricing Step
    case 3: // Inventory Step
      if (!activeProduct) return null;
      const categoryName = categories.find(c => c.id === activeProduct.categoryId)?.name || 'Select a category';

      return (
        <MotionDiv key={1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <AnimatePresence>
              <motion.div
                key={activeProduct.id}
                className="absolute inset-0"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ ease: 'easeInOut' }}
              >
                <Image src={URL.createObjectURL(activeProduct.file)} alt="Product Preview" fill className="object-cover" />
                <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2">
                  {activeProduct.uploadStatus === 'uploading' && <><Loader2 className="w-4 h-4 text-blue-400 animate-spin" /><span className="text-xs text-white">Uploading...</span></>}
                  {activeProduct.uploadStatus === 'compressing' && <><Loader2 className="w-4 h-4 text-yellow-400 animate-spin" /><span className="text-xs text-white">Compressing...</span></>}
                  {activeProduct.uploadStatus === 'success' && <><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-xs text-white">Ready</span></>}
                  {activeProduct.uploadStatus === 'error' && <><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-xs text-white">Error</span></>}
                </div>
              </motion.div>
            </AnimatePresence>
            {batchProducts.length > 1 && (
              <>
                <button onClick={() => setActiveProductIndex(p => (p - 1 + batchProducts.length) % batchProducts.length)} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setActiveProductIndex(p => (p + 1) % batchProducts.length)} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  {activeProductIndex + 1} / {batchProducts.length}
                </div>
              </>
            )}
          </div>

          {currentStep === 1 && (
            <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <FloatingLabelInput label="Product Name" value={activeProduct.name} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'name', e.target.value)} />
              <button onClick={() => setCategorySelectorOpen(true)} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group">
                <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Category</span>
                <div className="flex justify-between items-center">
                  <span className={`text-base font-medium ${activeProduct.categoryId ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>{categoryName}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <FloatingLabelInput label="Price (₦)" type="number" value={activeProduct.price} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'price', parseFloat(e.target.value) || 0)} />
              <ModernToggle label="Run a Promotion?" description="Set a discounted price for this item" checked={activeProduct.isPromo} onChange={checked => handleProductChange(activeProductIndex, 'isPromo', checked)} />
              <AnimatePresence>
                {activeProduct.isPromo && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <FloatingLabelInput label="Promo Price (₦)" type="number" value={activeProduct.promoPrice || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'promoPrice', parseFloat(e.target.value) || 0)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div key="inventory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <ModernToggle label="Batch Upload Mode" description="Apply settings to all images" checked={activeProduct.useAsTemplate} onChange={checked => handleProductChange(activeProductIndex, 'useAsTemplate', checked)} />
              <ModernToggle label="Limited Stock" description="Show 'Low Stock' badge to customers" checked={activeProduct.limitedStock} onChange={checked => handleProductChange(activeProductIndex, 'limitedStock', checked)} />
              <ModernToggle label="Sold Out" description="Mark as currently unavailable" checked={activeProduct.soldOut} onChange={checked => handleProductChange(activeProductIndex, 'soldOut', checked)} />
              <ModernToggle
                label="Add Size Options"
                description="Enable size selection for customers"
                checked={!!activeProduct.sizeOption}
                onChange={checked => {
                  if (checked) {
                    handleProductChange(activeProductIndex, {
                      sizeOption: 'baby-clothes',
                      availableSizes: getSizesForOption('baby-clothes')
                    });
                  } else {
                    handleProductChange(activeProductIndex, {
                      sizeOption: undefined,
                      availableSizes: undefined
                    });
                  }
                }}
              />

              <AnimatePresence>
                {activeProduct.sizeOption !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Select Size Category:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {(['baby-clothes', 'kids-shoes', 'adult-shoes'] as const).map(option => (
                        <div key={option} className="space-y-2">
                          <button
                            onClick={() => {
                              handleProductChange(activeProductIndex, {
                                sizeOption: option,
                                availableSizes: getSizesForOption(option)
                              });
                            }}
                            className={`w-full p-3 rounded-xl border text-left transition-all ${activeProduct.sizeOption === option
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400'
                              }`}
                          >
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {option === 'baby-clothes' && 'Baby Clothes (3m - 24m)'}
                              {option === 'kids-shoes' && 'Kids Shoes (20 - 35)'}
                              {option === 'adult-shoes' && 'Adult Shoes (36 - 42)'}
                            </div>
                          </button>

                          {activeProduct.sizeOption === option && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                              {getSizesForOption(option).map(size => {
                                const isSelected = activeProduct.availableSizes?.includes(size);
                                return (
                                  <button
                                    key={size}
                                    onClick={() => {
                                      const currentSizes = activeProduct.availableSizes || [];
                                      const newSizes = isSelected
                                        ? currentSizes.filter(s => s !== size)
                                        : [...currentSizes, size];
                                      handleProductChange(activeProductIndex, 'availableSizes', newSizes);
                                    }}
                                    className={`py-2 px-1 rounded-lg text-xs font-bold border-2 transition-all ${isSelected
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                      }`}
                                  >
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
          }
        </MotionDiv >
      );
    case 4: // Uploading
      return (
        <MotionDiv key={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Uploading Products...</h3>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we compress and upload your images.</p>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {uploadProgress.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <Image src={p.imageUrl || URL.createObjectURL(batchProducts.find(prod => prod.id === p.id)!.file)} alt={p.fileName} width={48} height={48} className="w-12 h-12 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm">{p.fileName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{p.statusText}</p>
                </div>
                <div className="flex-shrink-0">
                  {p.status === 'uploading' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                  {p.status === 'compressing' && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
                  {p.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {p.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </MotionDiv>
      );
    case 5: // Summary
      const successes = uploadProgress.filter(p => p.status === 'success').length;
      const failures = uploadProgress.filter(p => p.status === 'error').length;
      return (
        <MotionDiv key={5} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Upload Complete!</h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            {successes} product(s) have been successfully added to the store.
          </p>
          {failures > 0 && <p className="text-sm text-red-500 mt-4">{failures} product(s) failed to upload.</p>}
        </MotionDiv>
      );

    default: return null;
  }
}

const STEPS = [{ name: 'Upload' }, { name: 'Details' }, { name: 'Pricing' }, { name: 'Stock' }];
const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

return (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
        initial="hidden" animate="visible" exit="exit"
        variants={modalVariants}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* --- Header --- */}
        <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {currentStep === 4 ? 'Uploading...' : currentStep === 5 ? 'Success' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step {Math.min(currentStep + 1, 4)} of 4
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
        </header>

        {/* --- Progress Bar --- */}
        {currentStep < 4 && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
            <motion.div
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-1"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ ease: "easeInOut", duration: 0.5 }}
            />
          </div>
        )}

        {/* --- Main Scrollable Content --- */}
        <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </main>

        {/* --- Footer --- */}
        <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
          <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            {currentStep === 0 && (
              <button onClick={handleClose} className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                Cancel
              </button>
            )}

            {currentStep > 0 && currentStep < 4 && (
              <button onClick={() => setCurrentStep(s => s - 1)} className="w-24 sm:flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 text-sm">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {currentStep > 0 && currentStep < 3 && (
              <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
                Next <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {currentStep === 3 && (
              <button onClick={handleSubmit} disabled={isUploading} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Upload ${batchProducts.length} Product(s)`}
              </button>
            )}

            {currentStep === 5 && (
              <>
                <button onClick={handleClose} className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Close
                </button>
                <button onClick={resetState} className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity shadow-lg">
                  Add Another
                </button>
              </>
            )}
          </div>
        </footer>

        <CategorySelectorModal
          isOpen={isCategorySelectorOpen}
          onClose={() => setCategorySelectorOpen(false)}
          categories={categories}
          selectedCategoryId={batchProducts[activeProductIndex]?.categoryId}
          onSelect={(categoryId: string) => {
            handleProductChange(activeProductIndex, 'categoryId', categoryId);
            setCategorySelectorOpen(false);
          }}
          onAddCategory={onAddCategory}
        />
      </motion.div>
    )}
  </AnimatePresence>
);
};

export default AddProductComposer;