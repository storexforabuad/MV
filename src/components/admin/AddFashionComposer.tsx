'use client';
import React, { useState, useRef, Fragment, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Product, FashionProduct } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import { applyWatermark } from '../../utils/watermark';
import { formatPrice } from '../../utils/price';
import CategorySelectorModal from './modals/CategorySelectorModal';
import { NIGERIAN_SIZE_CHART, EUROPEAN_SHOE_CHART, FashionSizeCategory, getSizesForFashionCategory } from '../../utils/sizeUtils';
import {
    X,
    Shirt,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Plus,
    Trash2,
    ImagePlus,
    Loader2,
    AlertCircle,
    Scissors,
    Ruler,
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
    sizeCategory: FashionSizeCategory; // 'clothing', 'shoes', or 'caps'
}

interface AddFashionComposerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    categories: { id: string; name: string }[];
    onProductAdded: () => void;
    onAddCategory: (name: string) => Promise<void>;
    storeName: string;
    instagramHandle?: string;
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

const PRESET_COLORS = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#22C55E' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Grey', hex: '#6B7280' },
    { name: 'Brown', hex: '#78350F' },
    { name: 'Navy', hex: '#1E3A8A' },
];

// --- MAIN COMPOSER COMPONENT ---

const AddFashionComposer: React.FC<AddFashionComposerProps> = ({ isOpen, onClose, storeId, categories, onProductAdded, onAddCategory, storeName, instagramHandle }) => {
    const [currentStep, setCurrentStep] = useState(0); // 0: Details, 1: Variants, 2: Pricing, 3: Review, 4: Uploading, 5: Summary
    const [useWatermark, setUseWatermark] = useState(true);
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
        sizeCategory: 'clothing', // Default to clothing
    });

    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
    const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [activeColorId, setActiveColorId] = useState<string | null>(null);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    // Initialize first color if none exists when entering step 1
    useEffect(() => {
        if (currentStep === 1 && productData.colors.length === 0) {
            addColor();
        }
    }, [currentStep]);

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
            sizeCategory: 'clothing',
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
        const newColors = productData.colors.filter(c => c.id !== id);
        setProductData(prev => ({ ...prev, colors: newColors }));

        // If we removed the active color, switch to another one or null
        if (activeColorId === id) {
            setActiveColorId(newColors.length > 0 ? newColors[0].id : null);
        }
    };

    const handleColorImageUpload = (e: ChangeEvent<HTMLInputElement>, colorId: string) => {
        if (e.target.files && e.target.files[0]) {
            const newFile = e.target.files[0];
            setProductData(prev => ({
                ...prev,
                colors: prev.colors.map(c => c.id === colorId ? { ...c, images: [newFile] } : c)
            }));
            // Reset input value to allow re-selecting the same file if needed
            e.target.value = '';
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
                    let processedFile = await compressImage(file);

                    if (useWatermark) {
                        setUploadProgress(prev => prev.map(p => p.id === progressId ? { ...p, status: 'compressing', statusText: 'Watermarking...' } : p));
                        try {
                            let watermarkText = '';
                            if (instagramHandle) {
                                const cleanHandle = instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`;
                                watermarkText = `${cleanHandle} | ATLAS™ Verified`;
                            } else {
                                // Format store name: Replace dots with spaces, capitalize each word
                                const formattedName = storeName
                                    .replace(/\./g, ' ')
                                    .split(' ')
                                    .filter(Boolean)
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(' ');
                                watermarkText = `${formattedName} | ATLAS™ Verified`;
                            }
                            processedFile = await applyWatermark(processedFile, watermarkText);
                        } catch (err) {
                            console.error('Watermarking failed:', err);
                            // Continue with compressed file if watermarking fails
                        }
                    }

                    setUploadProgress(prev => prev.map(p => p.id === progressId ? { ...p, status: 'uploading', statusText: 'Uploading...' } : p));
                    const imageUrl = await uploadImageToCloudinary(processedFile, storeId);

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

            // Flatten all images for the main product image array
            const allImages = uploadedColors.flatMap(c => c.images);

            const productBase = {
                id: '', // DB will assign
                storeId,
                name: productData.name,
                description: '',
                price: productData.isPromo ? productData.promoPrice! : productData.price,
                images: allImages,
                views: 0,
                createdAt: { toMillis: () => Date.now() } as any,
                commission: productData.commission,
                onPromo: productData.isPromo,
                productType: 'fashion' as const,
                categoryId: productData.categoryId,
                category: categories.find(c => c.id === productData.categoryId)?.name || '',
                colors: uploadedColors,
                sizes: productData.sizes,
                soldOutSizes: [],
                sizeCategory: productData.sizeCategory,
                sizeChart: {
                    type: productData.sizeCategory === 'clothing'
                        ? 'nigerian-standard' as const
                        : productData.sizeCategory === 'shoes'
                            ? 'european-shoe' as const
                            : 'nigerian-cap' as const
                },
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
                    <MotionDiv key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FloatingLabelInput label="Product Name" value={productData.name} onChange={(e) => handleProductChange('name', e.target.value)} />
                        <button onClick={() => setCategorySelectorOpen(true)} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group">
                            <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Category</span>
                            <div className="flex justify-between items-center">
                                <span className={`text-base font-medium ${productData.categoryId ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>{categoryName}</span>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </button>
                    </MotionDiv>
                );

            case 1: // Variants (Colors & Sizes)
                const activeColor = productData.colors.find(c => c.id === activeColorId);

                return (
                    <MotionDiv key={1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">

                        {/* COLORS TABS */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                                    </div>
                                    Colors
                                </h3>
                            </div>

                            {/* Tab List */}
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {productData.colors.map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={() => setActiveColorId(color.id)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${activeColorId === color.id
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color.hex }}></div>
                                        <span className="text-sm font-medium whitespace-nowrap max-w-[80px] truncate">{color.name || 'New Color'}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={addColor}
                                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Active Color Editor */}
                            <AnimatePresence mode="wait">
                                {activeColor ? (
                                    <motion.div
                                        key={activeColor.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-600 shadow-sm flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: activeColor.hex }}></div>
                                                    <div className="flex-1">
                                                        <label className="text-xs text-slate-500 font-medium ml-1">Color Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Royal Blue"
                                                            value={activeColor.name}
                                                            onChange={(e) => updateColor(activeColor.id, 'name', e.target.value)}
                                                            className="bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-blue-600 outline-none text-slate-900 dark:text-slate-100 font-semibold text-lg w-full pb-1"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Compact Palette */}
                                                <div className="flex flex-wrap gap-2">
                                                    {PRESET_COLORS.map(preset => (
                                                        <button
                                                            key={preset.hex}
                                                            onClick={() => {
                                                                updateColor(activeColor.id, 'hex', preset.hex);
                                                                updateColor(activeColor.id, 'name', preset.name);
                                                            }}
                                                            className={`w-8 h-8 rounded-full border-2 transition-transform ${activeColor.hex === preset.hex ? 'border-blue-500 scale-110' : 'border-transparent hover:scale-105'}`}
                                                            style={{ backgroundColor: preset.hex }}
                                                            title={preset.name}
                                                        />
                                                    ))}
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                                                        <input
                                                            type="color"
                                                            value={activeColor.hex}
                                                            onChange={(e) => updateColor(activeColor.id, 'hex', e.target.value)}
                                                            className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {productData.colors.length > 1 && (
                                                <button onClick={() => removeColor(activeColor.id)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Image Upload for Active Color */}
                                        <div>
                                            <label className="text-xs text-slate-500 font-medium mb-2 block">Image for {activeColor.name || 'this color'}</label>
                                            <div className="flex gap-3">
                                                {activeColor.images.length > 0 ? (
                                                    <div className="relative aspect-[3/4] w-32 rounded-lg overflow-hidden group shadow-sm bg-slate-200 dark:bg-slate-700">
                                                        <Image src={URL.createObjectURL(activeColor.images[0])} alt="Preview" fill className="object-cover" />
                                                        <button
                                                            onClick={() => removeColorImage(activeColor.id, 0)}
                                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                            <ImagePlus className="w-5 h-5 text-white mb-1" />
                                                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleColorImageUpload(e, activeColor.id)} />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <label className="aspect-[3/4] w-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group bg-white dark:bg-slate-900">
                                                        <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                        <span className="text-xs text-slate-500 mt-2 font-medium">Add Image</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleColorImageUpload(e, activeColor.id)} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        Select a color to edit or add a new one.
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* SIZES SECTION */}
                        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Scissors className="w-4 h-4 text-purple-500" />
                                    </div>
                                    Sizes
                                </h3>
                                <button
                                    onClick={() => setSizeGuideOpen(true)}
                                    className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                                >
                                    <Ruler className="w-3 h-3" /> Size Guide
                                </button>
                            </div>

                            {/* Size Category Toggle */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        handleProductChange('sizeCategory', 'clothing');
                                        handleProductChange('sizes', []); // Reset sizes when switching
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${productData.sizeCategory === 'clothing'
                                        ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                                        }`}
                                >
                                    <Shirt className="w-4 h-4" /> Clothing
                                </button>
                                👟 Shoes
                            </button>
                            <button
                                onClick={() => {
                                    handleProductChange('sizeCategory', 'caps');
                                    handleProductChange('sizes', []); // Reset sizes when switching
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${productData.sizeCategory === 'caps'
                                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                                    }`}
                            >
                                🎓 Caps
                            </button>
                        </div>

                        {/* Size Chips */}
                        <div className="flex flex-wrap gap-2">
                            {getSizesForFashionCategory(productData.sizeCategory).map((size) => {
                                const isSelected = productData.sizes.includes(size);
                                return (
                                    <button
                                        key={size}
                                        onClick={() => toggleSize(size)}
                                        className={`min-w-[3rem] h-10 px-3 rounded-lg border font-medium transition-all ${isSelected
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md transform scale-105'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {
                                productData.sizeCategory === 'clothing'
                                    ? 'Standard Nigerian/UK sizing'
                                    : productData.sizeCategory === 'shoes'
                                        ? 'European shoe sizing'
                                        : 'Nigerian cap sizing (circumference in inches)'
                            }
                        </p>
                    </div>

                    </MotionDiv >
                );

            case 2: // Pricing
const commissionAmount = (productData.isPromo ? productData.promoPrice || 0 : productData.price || 0) * (productData.commission / 100);
return (
    <MotionDiv key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <FloatingLabelInput label="Price (₦)" type="number" value={productData.price} onChange={(e) => handleProductChange('price', parseFloat(e.target.value) || 0)} />

        <div className="space-y-4">
            <ModernToggle label="Run a Promotion?" description="Set a discounted price for this item" checked={productData.isPromo} onChange={checked => handleProductChange('isPromo', checked)} />
            <AnimatePresence>
                {productData.isPromo && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <FloatingLabelInput label="Promo Price (₦)" type="number" value={productData.promoPrice || ''} onChange={(e) => handleProductChange('promoPrice', parseFloat(e.target.value) || 0)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <ModernToggle label="Watermark Images" description="Add store name & Atlas verified to images" checked={useWatermark} onChange={setUseWatermark} />
            <ModernToggle label="Limited Stock" description="Show 'Low Stock' badge to customers" checked={productData.limitedStock} onChange={checked => handleProductChange('limitedStock', checked)} />
            <ModernToggle label="Sold Out" description="Mark as currently unavailable" checked={productData.soldOut} onChange={checked => handleProductChange('soldOut', checked)} />
        </div>
    </MotionDiv>
);

            case 3: // Review
return (
    <MotionDiv key={3} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Review Product</h3>
            <p className="text-slate-500 dark:text-slate-400">Double check everything before uploading</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-right">{productData.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Price</span>
                <div className="text-right">
                    {productData.isPromo ? (
                        <>
                            <span className="block font-semibold text-red-500">{formatPrice(productData.promoPrice!)}</span>
                            <span className="text-xs text-slate-400 line-through">{formatPrice(productData.price)}</span>
                        </>
                    ) : (
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPrice(productData.price)}</span>
                    )}
                </div>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Category</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{categories.find(c => c.id === productData.categoryId)?.name}</span>
            </div>
            <div className="py-2">
                <span className="block text-slate-500 dark:text-slate-400 mb-2">Variants</span>
                <div className="flex flex-wrap gap-2">
                    {productData.colors.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.hex }}></span>
                            {c.name} ({c.images.length} imgs)
                        </span>
                    ))}
                </div>
            </div>
            <div className="py-2">
                <span className="block text-slate-500 dark:text-slate-400 mb-2">Sizes</span>
                <div className="flex flex-wrap gap-1">
                    {productData.sizes.map(s => (
                        <span key={s} className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">{s}</span>
                    ))}
                </div>
            </div>
        </div>
    </MotionDiv>
);

            case 4: // Uploading
return (
    <MotionDiv key={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Uploading Product...</h3>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we compress and upload your images.</p>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {uploadProgress.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
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
            Your product has been successfully added to the store.
        </p>
        {failures > 0 && <p className="text-sm text-red-500 mt-4">{failures} images failed to upload.</p>}
    </MotionDiv>
);

            default: return null;
        }
    }

const STEPS = [{ name: 'Details' }, { name: 'Variants' }, { name: 'Pricing' }, { name: 'Review' }];
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
                <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                                {currentStep === 4 ? 'Uploading...' : currentStep === 5 ? 'Success' : 'Add Fashion Product'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Step {Math.min(currentStep + 1, 4)} of 4
                            </p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Shirt className="w-6 h-6 text-white" />
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
                    <div className="max-w-5xl mx-auto flex gap-4">
                        {currentStep === 0 && (
                            <button onClick={handleClose} className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                Cancel
                            </button>
                        )}

                        {currentStep > 0 && currentStep < 4 && (
                            <button onClick={() => setCurrentStep(s => s - 1)} className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                <ChevronLeft className="w-5 h-5" /> Back
                            </button>
                        )}

                        {currentStep < 3 && (
                            <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
                                Next <ChevronRight className="w-5 h-5" />
                            </button>
                        )}

                        {currentStep === 3 && (
                            <button onClick={handleSubmit} disabled={isUploading} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2">
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Product'}
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
                    selectedCategoryId={productData.categoryId}
                    onSelect={(categoryId: string) => {
                        handleProductChange('categoryId', categoryId);
                        setCategorySelectorOpen(false);
                    }}
                    onAddCategory={onAddCategory}
                />

                {/* Size Guide Modal */}
                <AnimatePresence>
                    {isSizeGuideOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setSizeGuideOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {productData.sizeCategory === 'clothing' ? 'Size Guide (UK/NG)' : 'Shoe Size Guide (EU)'}
                                    </h3>
                                    <button onClick={() => setSizeGuideOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {productData.sizeCategory === 'clothing' ? (
                                        <>
                                            <div className="grid grid-cols-3 gap-2 text-sm font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
                                                <span>Size</span>
                                                <span>Bust</span>
                                                <span>Waist</span>
                                            </div>
                                            {NIGERIAN_SIZE_CHART.map((item) => (
                                                <div key={item.size} className="grid grid-cols-3 gap-2 text-sm text-slate-900 dark:text-slate-100">
                                                    <span className="font-bold">UK {item.size}</span>
                                                    <span>{item.bust}"</span>
                                                    <span>{item.waist}"</span>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-2 text-sm font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
                                                <span>Size (EU)</span>
                                                <span>Foot Length</span>
                                            </div>
                                            {EUROPEAN_SHOE_CHART.map((item) => (
                                                <div key={item.size} className="grid grid-cols-2 gap-2 text-sm text-slate-900 dark:text-slate-100">
                                                    <span className="font-bold">{item.size}</span>
                                                    <span>{item.footLength} cm</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                                    <Info className="w-4 h-4 flex-shrink-0" />
                                    <p>{productData.sizeCategory === 'clothing' ? 'Measurements are in inches. This is a standard guide, actual fit may vary by style.' : 'Measure your foot length in cm to find your size. Sizes may vary by brand.'}</p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        )}
    </AnimatePresence>
);
};

export default AddFashionComposer;
