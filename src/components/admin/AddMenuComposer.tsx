'use client';
import React, { useState, useRef, Fragment, ChangeEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Product, FoodBeverageProduct } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import { formatPrice } from '../../utils/price';
import CategorySelectorModal from './modals/CategorySelectorModal';
import ProductUploadTips from './ProductUploadTips';

// --- TYPES ---
type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'success' | 'error';
interface UploadProgress {
    id: string;
    fileName: string;
    status: UploadStatus;
    statusText: string;
    error?: string;
    imageUrl?: string;
}

interface BatchMenuProduct {
    id: string;
    file: File;
    name: string;
    price: number;
    isPromo: boolean;
    promoPrice?: number;
    commission: number;
    categoryId: string;
    soldOut: boolean;
    useAsTemplate: boolean;

    // Food/Drink Specifics
    subtype: 'dish' | 'drink' | 'snack';
    preparationTime: number; // minutes
    spiciness: 'mild' | 'medium' | 'hot' | 'extra-hot';
    temperature: 'hot' | 'cold' | 'room-temp';
    isAlcoholic: boolean;
    isVegetarian: boolean;
    ingredients: string; // Comma separated for input
}

interface AddMenuComposerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    categories: { id: string; name: string }[];
    onProductAdded: () => void;
    onAddCategory: (name: string) => Promise<void>;
}

// --- HELPER COMPONENTS ---

const ModernToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer justify-between w-full py-2">
        <span className="text-base font-medium text-text-primary">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-input-background'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
        </div>
    </label>
);

const FloatingLabelInput: React.FC<{ label: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder = ' ' }) => (
    <div className="relative">
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="block w-full px-4 py-3 text-base text-text-primary bg-input-background rounded-lg border-2 border-input-border appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        />
        <label className="absolute text-base text-text-secondary duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-input-background px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3">
            {label}
        </label>
    </div>
);

// --- MAIN COMPOSER COMPONENT ---

const AddMenuComposer: React.FC<AddMenuComposerProps> = ({ isOpen, onClose, storeId, categories, onProductAdded, onAddCategory }) => {
    const [currentStep, setCurrentStep] = useState(0); // 0: Upload, 1: Details, 2: Food Specs, 3: Pricing, 4: Uploading, 5: Summary
    const [batchProducts, setBatchProducts] = useState<BatchMenuProduct[]>([]);
    const [activeProductIndex, setActiveProductIndex] = useState(0);
    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [template, setTemplate] = useState<Partial<BatchMenuProduct> | null>(null);

    const resetState = () => {
        setCurrentStep(0);
        setBatchProducts([]);
        setActiveProductIndex(0);
        setUploadProgress([]);
        setIsUploading(false);
        setTemplate(null);
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((file, index) => {
                const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                const baseProduct: BatchMenuProduct = {
                    id: `${Date.now()}-${index}`,
                    file,
                    name: template?.name || name,
                    price: template?.price || 0,
                    isPromo: template?.isPromo || false,
                    promoPrice: template?.promoPrice,
                    commission: template?.commission || 10,
                    categoryId: template?.categoryId || '',
                    soldOut: template?.soldOut || false,
                    useAsTemplate: false,
                    subtype: template?.subtype || 'dish',
                    preparationTime: template?.preparationTime || 0,
                    spiciness: template?.spiciness || 'mild',
                    temperature: template?.temperature || 'hot',
                    isAlcoholic: template?.isAlcoholic || false,
                    isVegetarian: template?.isVegetarian || false,
                    ingredients: template?.ingredients || '',
                };
                return baseProduct;
            });

            if (newFiles.length > 0) {
                setBatchProducts(newFiles);
                setCurrentStep(1);
            }
        }
    };

    const handleProductChange = (index: number, field: string | Partial<BatchMenuProduct>, value?: any) => {
        let newBatchProducts = batchProducts.map((p, i) => {
            if (i !== index) return p;
            if (typeof field === 'string') {
                return { ...p, [field]: value };
            }
            return { ...p, ...field };
        });
        const changedProduct = newBatchProducts[index];

        const applyTemplate = (templateProduct: BatchMenuProduct, products: BatchMenuProduct[]): BatchMenuProduct[] => {
            return products.map(p => {
                if (p.id === templateProduct.id) return p;
                return {
                    ...p,
                    name: templateProduct.name,
                    price: templateProduct.price,
                    isPromo: templateProduct.isPromo,
                    promoPrice: templateProduct.promoPrice,
                    commission: templateProduct.commission,
                    categoryId: templateProduct.categoryId,
                    soldOut: templateProduct.soldOut,
                    subtype: templateProduct.subtype,
                    preparationTime: templateProduct.preparationTime,
                    spiciness: templateProduct.spiciness,
                    temperature: templateProduct.temperature,
                    isAlcoholic: templateProduct.isAlcoholic,
                    isVegetarian: templateProduct.isVegetarian,
                    ingredients: templateProduct.ingredients,
                };
            });
        };

        if (field === 'useAsTemplate') {
            if (value === true) {
                const newTemplate = { ...changedProduct, useAsTemplate: true };
                setTemplate(newTemplate);
                newBatchProducts = newBatchProducts.map((p, i) =>
                    i === index ? newTemplate : { ...p, useAsTemplate: false }
                );
                newBatchProducts = applyTemplate(newTemplate, newBatchProducts);
            } else {
                if (template?.id === changedProduct.id) {
                    setTemplate(null);
                }
            }
        } else if (template && template.id === changedProduct.id) {
            const updatedTemplate = { ...changedProduct };
            setTemplate(updatedTemplate);
            newBatchProducts = applyTemplate(updatedTemplate, newBatchProducts);
        }

        setBatchProducts(newBatchProducts);
    };

    const handleSubmit = async () => {
        for (let i = 0; i < batchProducts.length; i++) {
            const p = batchProducts[i];
            if (!p.name || !p.price || !p.categoryId) {
                toast.error(`Please fill all required fields for "${p.name}".`);
                setActiveProductIndex(i);
                setCurrentStep(1);
                return;
            }
        }
        setIsUploading(true);
        setCurrentStep(4);

        const initialProgress: UploadProgress[] = batchProducts.map(p => ({ id: p.id, fileName: p.name, status: 'idle', statusText: 'Waiting...' }));
        setUploadProgress(initialProgress);

        let successCount = 0;

        for (const productData of batchProducts) {
            try {
                setUploadProgress(prev => prev.map(p => p.id === productData.id ? { ...p, status: 'compressing', statusText: 'Compressing...' } : p));
                const compressedFile = await compressImage(productData.file);

                setUploadProgress(prev => prev.map(p => p.id === productData.id ? { ...p, status: 'uploading', statusText: 'Uploading...' } : p));
                const imageUrl = await uploadImageToCloudinary(compressedFile, storeId);

                const productToAdd: Partial<FoodBeverageProduct> = {
                    productType: 'food',
                    name: productData.name,
                    price: productData.isPromo ? productData.promoPrice! : productData.price,
                    categoryId: productData.categoryId,
                    images: [imageUrl],
                    description: productData.ingredients, // Using description for ingredients/details
                    soldOut: productData.soldOut,
                    available: !productData.soldOut,
                    commission: productData.commission,
                    storeId: storeId,
                    views: 0,
                    subtype: productData.subtype,
                    preparationTime: productData.preparationTime,
                    isVegetarian: productData.isVegetarian,
                    ingredients: productData.ingredients.split(',').map(i => i.trim()).filter(i => i),
                    ...(productData.subtype === 'dish' && { spiciness: productData.spiciness }),
                    ...(productData.subtype === 'drink' && { temperature: productData.temperature, isAlcoholic: productData.isAlcoholic }),
                };

                if (productData.isPromo) {
                    productToAdd.originalPrice = productData.price;
                }

                await addProduct(storeId, productToAdd as Product);

                setUploadProgress(prev => prev.map(p => p.id === productData.id ? { ...p, status: 'success', statusText: 'Success!', imageUrl } : p));
                successCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                setUploadProgress(prev => prev.map(p => p.id === productData.id ? { ...p, status: 'error', statusText: 'Failed', error: errorMessage } : p));
            }
        }

        if (successCount > 0) {
            onProductAdded();
        }
        setIsUploading(false);
        setCurrentStep(5);
    };

    const renderStepContent = () => {
        const activeProduct = batchProducts[activeProductIndex];
        const MotionDiv = motion.div;

        switch (currentStep) {
            case 0: // Initial Upload
                return (
                    <MotionDiv key={0} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 sm:p-6">
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                        <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer w-full flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-input-background/50 border-2 border-dashed border-input-border text-text-secondary hover:bg-input-background transition-colors duration-300">
                            <PhotoIcon className="w-16 h-16 mb-4 text-gray-400" />
                            <span className="font-semibold text-xl text-text-primary">Tap to upload food/drink photos</span>
                            <span className="text-base text-text-secondary mt-1">Add one or more images to get started</span>
                        </div>
                        <ProductUploadTips />
                    </MotionDiv>
                );

            case 1: // Details
            case 2: // Food Specs
            case 3: // Pricing
                if (!activeProduct) return null;
                const commissionAmount = (activeProduct.isPromo ? activeProduct.promoPrice || 0 : activeProduct.price || 0) * (activeProduct.commission / 100);
                const categoryName = categories.find(c => c.id === activeProduct.categoryId)?.name || 'Select a category';

                return (
                    <MotionDiv key={1} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="relative w-full h-64 sm:h-80">
                            <AnimatePresence>
                                <motion.div
                                    key={activeProduct.id}
                                    className="absolute inset-0"
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ ease: 'easeInOut' }}
                                >
                                    <Image src={URL.createObjectURL(activeProduct.file)} alt="Product Preview" fill className="object-cover rounded-t-lg" />
                                </motion.div>
                            </AnimatePresence>
                            {batchProducts.length > 1 && (
                                <>
                                    <button onClick={() => setActiveProductIndex(p => (p - 1 + batchProducts.length) % batchProducts.length)} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"><ChevronLeftIcon className="w-6 h-6" /></button>
                                    <button onClick={() => setActiveProductIndex(p => (p + 1) % batchProducts.length)} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"><ChevronRightIcon className="w-6 h-6" /></button>
                                </>
                            )}
                        </div>
                        <div className="p-4 sm:p-6 space-y-6">
                            {currentStep === 1 && (
                                <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <FloatingLabelInput label="Item Name" value={activeProduct.name} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'name', e.target.value)} />
                                    <button onClick={() => setCategorySelectorOpen(true)} className="w-full text-left p-4 bg-input-background rounded-lg border-2 border-input-border">
                                        <span className={activeProduct.categoryId ? 'text-text-primary' : 'text-text-secondary'}>{categoryName}</span>
                                    </button>
                                    <FloatingLabelInput label="Ingredients (comma separated)" value={activeProduct.ingredients} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'ingredients', e.target.value)} placeholder="e.g. Rice, Tomato, Chicken" />
                                    <ModernToggle label="Use as Template for Others" checked={activeProduct.useAsTemplate} onChange={checked => handleProductChange(activeProductIndex, 'useAsTemplate', checked)} />
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div key="specs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Item Type</label>
                                        <div className="flex gap-2">
                                            {(['dish', 'drink', 'snack'] as const).map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => handleProductChange(activeProductIndex, 'subtype', type)}
                                                    className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all ${activeProduct.subtype === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-input-border bg-input-background text-text-secondary'}`}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <FloatingLabelInput label="Prep Time (mins)" type="number" value={activeProduct.preparationTime} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'preparationTime', parseInt(e.target.value) || 0)} />

                                    {activeProduct.subtype === 'dish' && (
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Spiciness Level</label>
                                            <div className="flex gap-1 overflow-x-auto pb-2">
                                                {(['mild', 'medium', 'hot', 'extra-hot'] as const).map(level => (
                                                    <button
                                                        key={level}
                                                        onClick={() => handleProductChange(activeProductIndex, 'spiciness', level)}
                                                        className={`flex-none px-4 py-2 rounded-full border text-sm font-medium transition-all ${activeProduct.spiciness === level ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                                    >
                                                        {level === 'mild' && '😌 Mild'}
                                                        {level === 'medium' && '🌶️ Medium'}
                                                        {level === 'hot' && '🔥 Hot'}
                                                        {level === 'extra-hot' && '🤯 Extra Hot'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeProduct.subtype === 'drink' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Temperature</label>
                                                <div className="flex gap-2">
                                                    {(['hot', 'cold', 'room-temp'] as const).map(temp => (
                                                        <button
                                                            key={temp}
                                                            onClick={() => handleProductChange(activeProductIndex, 'temperature', temp)}
                                                            className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all ${activeProduct.temperature === temp ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-input-border bg-input-background text-text-secondary'}`}
                                                        >
                                                            {temp === 'hot' && '☕ Hot'}
                                                            {temp === 'cold' && '❄️ Cold'}
                                                            {temp === 'room-temp' && '🌡️ Room'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <ModernToggle label="Contains Alcohol? 🍺" checked={activeProduct.isAlcoholic} onChange={checked => handleProductChange(activeProductIndex, 'isAlcoholic', checked)} />
                                        </div>
                                    )}

                                    <ModernToggle label="Vegetarian / Vegan? 🥗" checked={activeProduct.isVegetarian} onChange={checked => handleProductChange(activeProductIndex, 'isVegetarian', checked)} />
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <FloatingLabelInput label="Price" type="number" value={activeProduct.price} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'price', parseFloat(e.target.value) || 0)} />
                                    <ModernToggle label="Add Promo Price ?" checked={activeProduct.isPromo} onChange={checked => handleProductChange(activeProductIndex, 'isPromo', checked)} />
                                    <AnimatePresence>
                                        {activeProduct.isPromo && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                <FloatingLabelInput label="Promo Price" type="number" value={activeProduct.promoPrice || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'promoPrice', parseFloat(e.target.value) || 0)} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <ModernToggle label="Mark as Sold Out" checked={activeProduct.soldOut} onChange={checked => handleProductChange(activeProductIndex, 'soldOut', checked)} />
                                </motion.div>
                            )}
                        </div>
                    </MotionDiv>
                );

            case 4: // Uploading
                return (
                    <MotionDiv key={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
                        <h3 className="text-xl font-semibold text-center text-text-primary mb-4">Uploading Menu Items...</h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {uploadProgress.map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-2 bg-input-background rounded-lg">
                                    <Image src={p.imageUrl || URL.createObjectURL(batchProducts.find(prod => prod.id === p.id)!.file)} alt={p.fileName} width={48} height={48} className="w-12 h-12 object-cover rounded-md" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-text-primary truncate">{p.fileName}</p>
                                        <p className="text-sm text-text-secondary">{p.statusText}</p>
                                    </div>
                                    <div>
                                        {p.status === 'uploading' && <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />}
                                        {p.status === 'compressing' && <ArrowPathIcon className="w-6 h-6 text-yellow-500 animate-spin" />}
                                        {p.status === 'success' && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
                                        {p.status === 'error' && <XMarkIcon className="w-6 h-6 text-red-500" />}
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
                    <MotionDiv key={5} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center">
                        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-text-primary mb-2">Menu Updated!</h3>
                        <p className="text-lg text-text-secondary">{successes} item(s) added successfully.</p>
                        {failures > 0 && <p className="text-lg text-red-500">{failures} item(s) failed to upload.</p>}
                    </MotionDiv>
                );

            default: return null;
        }
    }

    const STEPS = [{ name: 'Upload' }, { name: 'Details' }, { name: 'Specs' }, { name: 'Pricing' }];

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={handleClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95" enterTo="opacity-100 translate-y-0 md:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 md:scale-100" leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95">
                            <Dialog.Panel className="relative flex w-full max-w-lg transform text-left text-base transition md:my-8">
                                <div className="relative flex w-full flex-col overflow-hidden md:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
                                    <div className="p-4 sm:p-6 flex justify-between items-center border-b border-border-color">
                                        <Dialog.Title as="h3" className="text-xl font-bold text-text-primary">
                                            {currentStep === 4 ? 'Uploading...' : currentStep === 5 ? 'Summary' : 'Add Menu Item'}
                                        </Dialog.Title>
                                        <button onClick={handleClose} className="p-1 rounded-full hover:bg-button-secondary transition">
                                            <XMarkIcon className="h-6 w-6 text-text-secondary" />
                                        </button>
                                    </div>

                                    {currentStep > 0 && currentStep < 4 && (
                                        <div className="w-full bg-input-background h-1.5">
                                            <motion.div
                                                className="bg-blue-600 h-1.5"
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                                                transition={{ ease: "easeInOut", duration: 0.5 }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <AnimatePresence mode="wait">
                                            {renderStepContent()}
                                        </AnimatePresence>
                                    </div>

                                    <div className="p-4 sm:p-6 flex justify-between sm:justify-end gap-4 border-t border-border-color">
                                        {currentStep === 0 && (
                                            <button onClick={handleClose} className="w-full rounded-lg border border-border-color bg-button-secondary py-2 px-4 text-sm font-semibold text-text-primary shadow-sm hover:bg-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Cancel</button>
                                        )}
                                        {currentStep > 0 && currentStep < 4 && (
                                            <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-lg bg-button-secondary text-text-primary font-semibold hover:bg-button-secondary-hover transition">Back</button>
                                        )}
                                        {currentStep > 0 && currentStep < 3 && (
                                            <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Next</button>
                                        )}
                                        {currentStep === 3 && (
                                            <button onClick={handleSubmit} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition" disabled={isUploading}>
                                                {isUploading ? 'Please Wait...' : `Add ${batchProducts.length} Item(s)`}
                                            </button>
                                        )}
                                        {currentStep === 5 && (
                                            <>
                                                <button onClick={handleClose} className="px-6 py-3 rounded-lg bg-button-secondary text-text-primary font-semibold hover:bg-button-secondary-hover transition">Done</button>
                                                <button onClick={resetState} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Add More</button>
                                            </>
                                        )}
                                    </div>
                                </div>
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
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default AddMenuComposer;
