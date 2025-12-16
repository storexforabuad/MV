'use client';
import React, { useState, useRef, Fragment, ChangeEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Product, FashionProduct } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import { formatPrice } from '../../utils/price';
import CategorySelectorModal from './modals/CategorySelectorModal';
import ProductUploadTips from './ProductUploadTips';
import { NIGERIAN_SIZE_CHART } from '../../utils/sizeUtils';

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

interface ColorVariant {
    id: string;
    name: string;
    hex: string;
    images: File[]; // Files to be uploaded
    uploadedImages?: string[]; // URLs after upload
}

interface BatchFashionProduct {
    id: string;
    name: string;
    price: number;
    isPromo: boolean;
    promoPrice?: number;
    commission: number;
    categoryId: string;
    limitedStock: boolean;
    soldOut: boolean;

    // Fashion Specific
    colors: ColorVariant[];
    sizes: string[]; // Selected sizes
}

interface AddFashionComposerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    categories: { id: string; name: string }[];
    onProductAdded: () => void;
    onAddCategory: (name: string) => Promise<void>;
}

// --- HELPER COMPONENTS ---

const ModernToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
    <label className="flex items-center cursor-pointer justify-between w-full py-2">
        <div className="flex flex-col">
            <span className="text-base font-medium text-gray-900 dark:text-gray-100">{label}</span>
            {description && <span className="text-sm text-gray-600 dark:text-gray-400">{description}</span>}
        </div>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}></div>
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
            className="block w-full px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        />
        <label className="absolute text-base text-gray-600 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 dark:bg-gray-800 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3">
            {label}
        </label>
    </div>
);

const PRESET_COLORS = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#008000' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Brown', hex: '#A52A2A' },
    { name: 'Navy', hex: '#000080' },
];

// --- MAIN COMPOSER COMPONENT ---

const AddFashionComposer: React.FC<AddFashionComposerProps> = ({ isOpen, onClose, storeId, categories, onProductAdded, onAddCategory }) => {
    const [currentStep, setCurrentStep] = useState(0); // 0: Details, 1: Variants (Colors/Sizes), 2: Pricing, 3: Review, 4: Uploading, 5: Summary
    const [productData, setProductData] = useState<BatchFashionProduct>({
        id: Date.now().toString(),
        name: '',
        price: 0,
        isPromo: false,
        commission: 2.5, // Fixed 2.5%
        categoryId: '',
        limitedStock: false,
        soldOut: false,
        colors: [],
        sizes: [],
    });

    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeColorId, setActiveColorId] = useState<string | null>(null);

    const resetState = () => {
        setCurrentStep(0);
        setProductData({
            id: Date.now().toString(),
            name: '',
            price: 0,
            isPromo: false,
            commission: 2.5,
            categoryId: '',
            limitedStock: false,
            soldOut: false,
            colors: [],
            sizes: [],
        });
        setUploadProgress([]);
        setIsUploading(false);
        setActiveColorId(null);
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    }

    const handleProductChange = (field: keyof BatchFashionProduct, value: any) => {
        setProductData(prev => ({ ...prev, [field]: value }));
    };

    const addColor = () => {
        const newColor: ColorVariant = {
            id: Date.now().toString(),
            name: '',
            hex: '#000000',
            images: [],
        };
        setProductData(prev => ({ ...prev, colors: [...prev.colors, newColor] }));
        setActiveColorId(newColor.id);
    };

    const updateColor = (id: string, field: keyof ColorVariant, value: any) => {
        setProductData(prev => ({
            ...prev,
            colors: prev.colors.map(c => c.id === id ? { ...c, [field]: value } : c)
        }));
    };

    const removeColor = (id: string) => {
        setProductData(prev => ({
            ...prev,
            colors: prev.colors.filter(c => c.id !== id)
        }));
        if (activeColorId === id) setActiveColorId(null);
    };

    const handleColorImageUpload = (e: ChangeEvent<HTMLInputElement>, colorId: string) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setProductData(prev => ({
                ...prev,
                colors: prev.colors.map(c => c.id === colorId ? { ...c, images: [...c.images, ...newFiles] } : c)
            }));
        }
    };

    const removeColorImage = (colorId: string, imageIndex: number) => {
        setProductData(prev => ({
            ...prev,
            colors: prev.colors.map(c => c.id === colorId ? {
                ...c,
                images: c.images.filter((_, i) => i !== imageIndex)
            } : c)
        }));
    };

    const toggleSize = (size: string) => {
        setProductData(prev => {
            const sizes = prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size];
            return { ...prev, sizes };
        });
    };

    const handleSubmit = async () => {
        if (!productData.name || !productData.price || !productData.categoryId || productData.colors.length === 0 || productData.sizes.length === 0) {
            toast.error('Please fill all required fields, add at least one color and one size.');
            return;
        }

        setIsUploading(true);
        setCurrentStep(4);

        const totalImages = productData.colors.reduce((acc, c) => acc + c.images.length, 0);
        let uploadedCount = 0;

        // Initialize progress
        const initialProgress: UploadProgress[] = [];
        productData.colors.forEach(c => {
            c.images.forEach((img, idx) => {
                initialProgress.push({
                    id: `${c.id}-${idx}`,
                    fileName: `${c.name} - Image ${idx + 1}`,
                    status: 'idle',
                    statusText: 'Waiting...'
                });
            });
        });
        setUploadProgress(initialProgress);

        try {
            const uploadedColors = await Promise.all(productData.colors.map(async (color) => {
                const uploadedImages = [];
                for (let i = 0; i < color.images.length; i++) {
                    const file = color.images[i];
                    const progressId = `${color.id}-${i}`;

                    setUploadProgress(prev => prev.map(p => p.id === progressId ? { ...p, status: 'compressing', statusText: 'Compressing...' } : p));
                    const compressedFile = await compressImage(file);

                    setUploadProgress(prev => prev.map(p => p.id === progressId ? { ...p, status: 'uploading', statusText: 'Uploading...' } : p));
                    const imageUrl = await uploadImageToCloudinary(compressedFile, storeId);

                    setUploadProgress(prev => prev.map(p => p.id === progressId ? { ...p, status: 'success', statusText: 'Success!', imageUrl } : p));
                    uploadedImages.push(imageUrl);
                    uploadedCount++;
                }
                return {
                    name: color.name,
                    hex: color.hex,
                    images: uploadedImages
                };
            }));

            // Flatten all images for the main product image array (first image of each color, then the rest)
            const allImages = uploadedColors.flatMap(c => c.images);

            const productBase = {
                id: '', // DB will assign
                storeId,
                name: productData.name,
                description: '',
                price: productData.isPromo ? productData.promoPrice! : productData.price,
                images: allImages,
                views: 0,
                createdAt: { toMillis: () => Date.now() } as any, // Placeholder, DB handles this
                commission: productData.commission,
                onPromo: productData.isPromo,
                productType: 'fashion' as const,
                categoryId: productData.categoryId,
                category: categories.find(c => c.id === productData.categoryId)?.name || '',
                colors: uploadedColors,
                sizes: productData.sizes,
                soldOutSizes: [], // Initially none sold out
                sizeChart: { type: 'nigerian-standard' as const },
                limitedStock: productData.limitedStock,
                soldOut: productData.soldOut,
            };
            
            const productToAdd: FashionProduct = {
                ...productBase,
                ...(productData.isPromo && { originalPrice: productData.price }),
            };
            

            await addProduct(storeId, productToAdd);

            if (uploadedCount > 0) {
                onProductAdded();
            }
            setIsUploading(false);
            setCurrentStep(5);

        } catch (error) {
            console.error(error);
            toast.error('Failed to upload product.');
            setIsUploading(false);
        }
    };

    const renderStepContent = () => {
        const MotionDiv = motion.div;

        switch (currentStep) {
            case 0: // Details
                const categoryName = categories.find(c => c.id === productData.categoryId)?.name || 'Select a category';
                return (
                    <MotionDiv key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 sm:p-6 space-y-6">
                        <FloatingLabelInput label="Product Name" value={productData.name} onChange={(e) => handleProductChange('name', e.target.value)} />
                        <button onClick={() => setCategorySelectorOpen(true)} className="w-full text-left p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                            <span className={productData.categoryId ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}>{categoryName}</span>
                        </button>
                    </MotionDiv>
                );

            case 1: // Variants (Colors & Sizes)
                return (
                    <MotionDiv key={1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 sm:p-6 space-y-8">

                        {/* COLORS SECTION */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Colors</h3>
                                <button onClick={addColor} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                                    <PlusIcon className="w-4 h-4" /> Add Color
                                </button>
                            </div>

                            <div className="space-y-4">
                                {productData.colors.map((color, index) => (
                                    <div key={color.id} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex gap-2 items-center">
                                                    <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" style={{ backgroundColor: color.hex }}></div>
                                                    <input
                                                        type="text"
                                                        placeholder="Color Name"
                                                        value={color.name}
                                                        onChange={(e) => updateColor(color.id, 'name', e.target.value)}
                                                        className="bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-600 outline-none text-gray-900 dark:text-gray-100 w-full"
                                                    />
                                                </div>

                                                {/* Preset Colors */}
                                                <div className="flex flex-wrap gap-2">
                                                    {PRESET_COLORS.map(preset => (
                                                        <button
                                                            key={preset.hex}
                                                            onClick={() => {
                                                                updateColor(color.id, 'hex', preset.hex);
                                                                if (!color.name) updateColor(color.id, 'name', preset.name);
                                                            }}
                                                            className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                                                            style={{ backgroundColor: preset.hex }}
                                                            title={preset.name}
                                                        />
                                                    ))}
                                                    <input
                                                        type="color"
                                                        value={color.hex}
                                                        onChange={(e) => updateColor(color.id, 'hex', e.target.value)}
                                                        className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={() => removeColor(color.id)} className="text-red-500 hover:text-red-700 p-1">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Image Upload for this Color */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {color.images.map((file, imgIdx) => (
                                                <div key={imgIdx} className="relative aspect-square rounded-md overflow-hidden group">
                                                    <Image src={URL.createObjectURL(file)} alt="Preview" fill className="object-cover" />
                                                    <button
                                                        onClick={() => removeColorImage(color.id, imgIdx)}
                                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <XMarkIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <PhotoIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">Add</span>
                                                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleColorImageUpload(e, color.id)} />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                {productData.colors.length === 0 && (
                                    <div className="text-center py-8 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        No colors added yet. Click "Add Color" to start.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SIZES SECTION */}
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sizes (Nigerian Standard)</h3>
                            <div className="flex flex-wrap gap-3">
                                {NIGERIAN_SIZE_CHART.map((sizeItem) => {
                                    const isSelected = productData.sizes.includes(sizeItem.size);
                                    return (
                                        <button
                                            key={sizeItem.size}
                                            onClick={() => toggleSize(sizeItem.size)}
                                            className={`px-4 py-2 rounded-full border transition-all ${isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                                }`}
                                        >
                                            Size {sizeItem.size}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Select all sizes available for this product.</p>
                        </div>

                    </MotionDiv>
                );

            case 2: // Pricing
                const commissionAmount = (productData.isPromo ? productData.promoPrice || 0 : productData.price || 0) * (productData.commission / 100);
                return (
                    <MotionDiv key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 sm:p-6 space-y-6">
                        <FloatingLabelInput label="Price" type="number" value={productData.price} onChange={(e) => handleProductChange('price', parseFloat(e.target.value) || 0)} />
                        <ModernToggle label="Add Promo Price ?" checked={productData.isPromo} onChange={checked => handleProductChange('isPromo', checked)} />
                        <AnimatePresence>
                            {productData.isPromo && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <FloatingLabelInput label="Promo Price" type="number" value={productData.promoPrice || ''} onChange={(e) => handleProductChange('promoPrice', parseFloat(e.target.value) || 0)} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Commission (Fixed)</label>
                            <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                                <span className="text-gray-900 dark:text-gray-100 font-medium">2.5% Platform Fee</span>
                                <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(commissionAmount)}</span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <ModernToggle label="Mark as Limited Stock" checked={productData.limitedStock} onChange={checked => handleProductChange('limitedStock', checked)} />
                            <ModernToggle label="Mark as Sold Out" checked={productData.soldOut} onChange={checked => handleProductChange('soldOut', checked)} />
                        </div>
                    </MotionDiv>
                );

            case 3: // Review
                // Simple review screen
                return (
                    <MotionDiv key={3} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Review Product</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                            <p><span className="text-gray-600 dark:text-gray-400">Name:</span> <span className="text-gray-900 dark:text-gray-100 font-medium">{productData.name}</span></p>
                            <p><span className="text-gray-600 dark:text-gray-400">Price:</span> <span className="text-gray-900 dark:text-gray-100 font-medium">{formatPrice(productData.price)}</span></p>
                            <p><span className="text-gray-600 dark:text-gray-400">Category:</span> <span className="text-gray-900 dark:text-gray-100 font-medium">{categories.find(c => c.id === productData.categoryId)?.name}</span></p>
                            <p><span className="text-gray-600 dark:text-gray-400">Colors:</span> <span className="text-gray-900 dark:text-gray-100 font-medium">{productData.colors.map(c => c.name).join(', ')}</span></p>
                            <p><span className="text-gray-600 dark:text-gray-400">Sizes:</span> <span className="text-gray-900 dark:text-gray-100 font-medium">{productData.sizes.join(', ')}</span></p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Ready to upload? This might take a moment depending on image sizes.</p>
                    </MotionDiv>
                );

            case 4: // Uploading
                return (
                    <MotionDiv key={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
                        <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-4">Uploading Product...</h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {uploadProgress.map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{p.fileName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{p.statusText}</p>
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
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Upload Complete!</h3>
                        <p className="text-lg text-gray-600 dark:text-gray-400">Product added successfully.</p>
                        {failures > 0 && <p className="text-lg text-red-500">{failures} images failed to upload.</p>}
                    </MotionDiv>
                );

            default: return null;
        }
    }

    const STEPS = [{ name: 'Details' }, { name: 'Variants' }, { name: 'Pricing' }, { name: 'Review' }];

    return (
        <>
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
                                        <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                                            <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {currentStep === 4 ? 'Uploading...' : currentStep === 5 ? 'Summary' : 'Add Fashion Product'}
                                            </Dialog.Title>
                                            <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                                <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                            </button>
                                        </div>
    
                                        {currentStep < 4 && (
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5">
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
    
                                        <div className="p-4 sm:p-6 flex justify-between sm:justify-end gap-4 border-t border-gray-200 dark:border-gray-700">
                                            {currentStep === 0 && (
                                                <button onClick={handleClose} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 py-2 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                                            )}
                                            {currentStep > 0 && currentStep < 4 && (
                                                <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">Back</button>
                                            )}
                                            {currentStep < 3 && (
                                                <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Next</button>
                                            )}
                                            {currentStep === 3 && (
                                                <button onClick={handleSubmit} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition" disabled={isUploading}>
                                                    Upload Product
                                                </button>
                                            )}
                                            {currentStep === 5 && (
                                                <>
                                                    <button onClick={handleClose} className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">Done</button>
                                                    <button onClick={resetState} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Add Another</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <CategorySelectorModal
                                        isOpen={isCategorySelectorOpen}
                                        onClose={() => setCategorySelectorOpen(false)}
                                        categories={categories}
                                        selectedCategoryId={productData.categoryId}
                                        onSelect={(categoryId: string) => {
                                            handleProductChange('categoryId', categoryId);
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
    
            
        </>
    );
    
};

export default AddFashionComposer;
