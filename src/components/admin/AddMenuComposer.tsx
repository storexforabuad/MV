'use client';
import React, { useState, useRef, Fragment, ChangeEvent, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Product, FoodBeverageProduct } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import CategorySelectorModal from './modals/CategorySelectorModal';
import ProductUploadTips from './ProductUploadTips';
import {
    X,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    ImagePlus,
    Loader2,
    AlertCircle,
    Flame,
    Thermometer,
    Leaf,
    Beer,
    Clock,
    UtensilsCrossed,
    Info
} from 'lucide-react';

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
    url?: string;
    uploadStatus: UploadStatus;
    uploadError?: string;
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

const ModernToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
    <label className="flex items-center cursor-pointer justify-between w-full py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
            {description && <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>}
        </div>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-12 h-7 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
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
            className="block w-full px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer transition-all"
        />
        <label className="absolute text-sm text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3">
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

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

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

    const startBackgroundUpload = async (productId: string, file: File) => {
        // Update status to compressing
        setBatchProducts(prev => prev.map(p => p.id === productId ? { ...p, uploadStatus: 'compressing' } : p));

        try {
            const compressedFile = await compressImage(file);

            // Update status to uploading
            setBatchProducts(prev => prev.map(p => p.id === productId ? { ...p, uploadStatus: 'uploading' } : p));

            const imageUrl = await uploadImageToCloudinary(compressedFile, storeId);

            // Update status to success
            setBatchProducts(prev => prev.map(p => p.id === productId ? { ...p, uploadStatus: 'success', url: imageUrl } : p));

        } catch (error) {
            console.error("Background upload failed", error);
            setBatchProducts(prev => prev.map(p => p.id === productId ? { ...p, uploadStatus: 'error', uploadError: 'Upload failed' } : p));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((file, index) => {
                const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                const baseProduct: BatchMenuProduct = {
                    id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                    file,
                    url: undefined,
                    uploadStatus: 'idle',
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

                // Start background uploads
                newFiles.forEach(p => startBackgroundUpload(p.id, p.file));
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

        const initialProgress: UploadProgress[] = batchProducts.map(p => ({
            id: p.id,
            fileName: p.name,
            status: p.uploadStatus,
            statusText: p.uploadStatus === 'success' ? 'Ready' : 'Processing...',
            error: p.uploadError
        }));
        setUploadProgress(initialProgress);

        let successCount = 0;

        for (const productData of batchProducts) {
            let imageUrl = productData.url;

            if (productData.uploadStatus === 'success' && imageUrl) {
                // Already uploaded
            } else {
                try {
                    setUploadProgress(prev => prev.map(p => p.id === productData.id ? { ...p, status: 'compressing', statusText: 'Compressing...' } : p));
                    const compressedFile = await compressImage(productData.file);

                    setUploadProgress(prev => prev.map(p => p.id === productData.id ? { ...p, status: 'uploading', statusText: 'Uploading...' } : p));
                    imageUrl = await uploadImageToCloudinary(compressedFile, storeId);

                    // Update local state just in case
                    setBatchProducts(prev => prev.map(p => p.id === productData.id ? { ...p, uploadStatus: 'success', url: imageUrl } : p));

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    setUploadProgress(prev => prev.map(p => p.id === productData.id ? { ...p, status: 'error', statusText: 'Failed', error: errorMessage } : p));
                    continue; // Skip adding this product
                }
            }

            if (imageUrl) {
                try {
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
                } catch (err) {
                    console.error("Failed to add product to db", err);
                    setUploadProgress(prev => prev.map(p => p.id === productData.id ? { ...p, status: 'error', statusText: 'DB Error' } : p));
                }
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
                        <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer w-full flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 group">
                            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ImagePlus className="w-8 h-8 text-blue-500" />
                            </div>
                            <span className="font-semibold text-xl text-slate-900 dark:text-slate-100">Tap to upload photos</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 mt-2">Select multiple images to batch upload</span>
                        </div>
                        <div className="mt-6">
                            <ProductUploadTips />
                        </div>
                    </MotionDiv>
                );

            case 1: // Details
            case 2: // Food Specs
            case 3: // Pricing
                if (!activeProduct) return null;
                const categoryName = categories.find(c => c.id === activeProduct.categoryId)?.name || 'Select a category';

                return (
                    <MotionDiv key={1} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="relative w-full h-64 sm:h-80 bg-slate-100 dark:bg-slate-800">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeProduct.id}
                                    className="absolute inset-0"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ ease: 'easeInOut' }}
                                >
                                    <Image src={URL.createObjectURL(activeProduct.file)} alt="Product Preview" fill className="object-cover" />
                                    <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
                                        {activeProduct.uploadStatus === 'uploading' && <><Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" /><span className="text-xs font-medium text-white">Uploading...</span></>}
                                        {activeProduct.uploadStatus === 'compressing' && <><Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" /><span className="text-xs font-medium text-white">Compressing...</span></>}
                                        {activeProduct.uploadStatus === 'success' && <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-medium text-white">Ready</span></>}
                                        {activeProduct.uploadStatus === 'error' && <><AlertCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-xs font-medium text-white">Error</span></>}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Arrows */}
                            {batchProducts.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveProductIndex(p => (p - 1 + batchProducts.length) % batchProducts.length)}
                                        className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors border border-white/10"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setActiveProductIndex(p => (p + 1) % batchProducts.length)}
                                        className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors border border-white/10"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Pagination Dots */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {batchProducts.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeProductIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-6">
                            {currentStep === 1 && (
                                <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <FloatingLabelInput label="Item Name" value={activeProduct.name} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'name', e.target.value)} />

                                    <button onClick={() => setCategorySelectorOpen(true)} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group">
                                        <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Category</span>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-base font-medium ${activeProduct.categoryId ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>{categoryName}</span>
                                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </button>

                                    <FloatingLabelInput label="Ingredients (comma separated)" value={activeProduct.ingredients} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'ingredients', e.target.value)} placeholder="e.g. Rice, Tomato, Chicken" />

                                    <ModernToggle
                                        label="Use as Template"
                                        description="Apply these details to all other items"
                                        checked={activeProduct.useAsTemplate}
                                        onChange={checked => handleProductChange(activeProductIndex, 'useAsTemplate', checked)}
                                    />
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div key="specs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    {/* Item Type */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">Item Type</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['dish', 'drink', 'snack'] as const).map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => handleProductChange(activeProductIndex, 'subtype', type)}
                                                    className={`py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all flex flex-col items-center gap-2 ${activeProduct.subtype === type
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
                                                >
                                                    {type === 'dish' && <UtensilsCrossed className="w-5 h-5" />}
                                                    {type === 'drink' && <Beer className="w-5 h-5" />}
                                                    {type === 'snack' && <Leaf className="w-5 h-5" />}
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <FloatingLabelInput label="Prep Time (mins)" type="number" value={activeProduct.preparationTime} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'preparationTime', parseInt(e.target.value) || 0)} />

                                    {activeProduct.subtype === 'dish' && (
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">Spiciness Level</label>
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {(['mild', 'medium', 'hot', 'extra-hot'] as const).map(level => (
                                                    <button
                                                        key={level}
                                                        onClick={() => handleProductChange(activeProductIndex, 'spiciness', level)}
                                                        className={`flex-none px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${activeProduct.spiciness === level
                                                            ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
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
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">Temperature</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {(['hot', 'cold', 'room-temp'] as const).map(temp => (
                                                        <button
                                                            key={temp}
                                                            onClick={() => handleProductChange(activeProductIndex, 'temperature', temp)}
                                                            className={`py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all ${activeProduct.temperature === temp
                                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
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
                                    <FloatingLabelInput label="Price (₦)" type="number" value={activeProduct.price} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'price', parseFloat(e.target.value) || 0)} />

                                    <div className="space-y-4">
                                        <ModernToggle label="Run a Promotion?" description="Set a discounted price" checked={activeProduct.isPromo} onChange={checked => handleProductChange(activeProductIndex, 'isPromo', checked)} />
                                        <AnimatePresence>
                                            {activeProduct.isPromo && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                    <FloatingLabelInput label="Promo Price (₦)" type="number" value={activeProduct.promoPrice || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => handleProductChange(activeProductIndex, 'promoPrice', parseFloat(e.target.value) || 0)} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <ModernToggle label="Mark as Sold Out" description="Temporarily unavailable" checked={activeProduct.soldOut} onChange={checked => handleProductChange(activeProductIndex, 'soldOut', checked)} />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </MotionDiv>
                );

            case 4: // Uploading
                return (
                    <MotionDiv key={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Uploading Menu Items</h3>
                            <p className="text-slate-500 dark:text-slate-400">Please wait while we process your images</p>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {uploadProgress.map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                                        <Image src={p.imageUrl || URL.createObjectURL(batchProducts.find(prod => prod.id === p.id)!.file)} alt={p.fileName} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{p.fileName}</p>
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
                    <MotionDiv key={5} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Menu Updated!</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{successes}</span> item(s) added successfully.
                            {failures > 0 && <span className="block text-red-500 mt-1">{failures} item(s) failed to upload.</span>}
                        </p>
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95" enterTo="opacity-100 translate-y-0 md:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 md:scale-100" leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95">
                            <Dialog.Panel className="relative flex w-full max-w-lg transform text-left text-base transition md:my-8">
                                <div className="relative flex w-full flex-col overflow-hidden md:rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
                                    {/* Header */}
                                    <div className="p-4 sm:p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                                        <div>
                                            <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                                {currentStep === 4 ? 'Uploading...' : currentStep === 5 ? 'Summary' : 'Add Menu Item'}
                                            </Dialog.Title>
                                            {currentStep < 4 && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step {currentStep + 1} of {STEPS.length}</p>
                                            )}
                                        </div>
                                        <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <X className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                                        </button>
                                    </div>

                                    {/* Progress Bar */}
                                    {currentStep > 0 && currentStep < 4 && (
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
                                            <motion.div
                                                className="bg-blue-600 h-1"
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                                                transition={{ ease: "easeInOut", duration: 0.5 }}
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 bg-white dark:bg-slate-900">
                                        <AnimatePresence mode="wait">
                                            {renderStepContent()}
                                        </AnimatePresence>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 sm:p-6 flex justify-between sm:justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                        {currentStep === 0 && (
                                            <button onClick={handleClose} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                        )}
                                        {currentStep > 0 && currentStep < 4 && (
                                            <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Back</button>
                                        )}
                                        {currentStep > 0 && currentStep < 3 && (
                                            <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">Next</button>
                                        )}
                                        {currentStep === 3 && (
                                            <button onClick={handleSubmit} className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20" disabled={isUploading}>
                                                {isUploading ? 'Please Wait...' : `Add ${batchProducts.length} Item(s)`}
                                            </button>
                                        )}
                                        {currentStep === 5 && (
                                            <>
                                                <button onClick={handleClose} className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Done</button>
                                                <button onClick={resetState} className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">Add More</button>
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
