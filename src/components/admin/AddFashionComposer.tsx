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
import { NIGERIAN_SIZE_CHART, EUROPEAN_SHOE_CHART, NIGERIAN_CAP_SIZE_CHART, JALLAB_SIZE_CHART, INSENCE_SIZE_CHART, OIL_PERFUMES_SIZE_CHART, FashionSizeCategory, getSizesForFashionCategory } from '../../utils/sizeUtils';
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

interface ImageItem {
    id: string;
    file: File;
    url?: string;
    status: UploadStatus;
    error?: string;
}

interface ColorVariant {
    id: string;
    name: string;
    hex: string;
    images: ImageItem[]; // Files with status
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
    hasSizes: boolean; // Whether this product has sizes (defaults to false)
    isTextile?: boolean;
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
    const [useWatermark, setUseWatermark] = useState(false);
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
        hasSizes: false, // Sizes are optional by default
        isTextile: false,
    });

    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
    const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [activeColorId, setActiveColorId] = useState<string | null>(null);
    const [highlightSizeSection, setHighlightSizeSection] = useState(false);
    const sizeSectionRef = useRef<HTMLDivElement>(null);
    const sizeCategoryContainerRef = useRef<HTMLDivElement>(null);
    const sizeCategoryButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const scrollToSizeCategory = (categoryId: string) => {
        const button = sizeCategoryButtonRefs.current.get(categoryId);
        const container = sizeCategoryContainerRef.current;
        if (button && container) {
            const scrollLeft =
                button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    };

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
        if (currentStep === 1 && productData.colors.length === 0 && !productData.isTextile) {
            addColor();
        }
    }, [currentStep, productData.isTextile]);

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
            hasSizes: false,
            isTextile: false,
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

    const startBackgroundUpload = async (imageItem: ImageItem, colorId: string) => {
        // Update status to compressing
        setProductData(prev => ({
            ...prev,
            colors: prev.colors.map(c => c.id === colorId ? {
                ...c,
                images: c.images.map(img => img.id === imageItem.id ? { ...img, status: 'compressing' } : img)
            } : c)
        }));

        try {
            let processedFile = await compressImage(imageItem.file);

            if (useWatermark) {
                // Update status to watermarking (using compressing status for simplicity or add new one)
                setProductData(prev => ({
                    ...prev,
                    colors: prev.colors.map(c => c.id === colorId ? {
                        ...c,
                        images: c.images.map(img => img.id === imageItem.id ? { ...img, status: 'compressing' } : img) // Keep as compressing or add 'watermarking' to types if needed
                    } : c)
                }));

                try {
                    let watermarkText = '';
                    if (instagramHandle) {
                        const cleanHandle = instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`;
                        watermarkText = `${cleanHandle} | Compass 🧭Verified`;
                    } else {
                        const formattedName = storeName
                            .replace(/\./g, ' ')
                            .split(' ')
                            .filter(Boolean)
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                        watermarkText = `${formattedName} | Compass 🧭Verified`;
                    }
                    processedFile = await applyWatermark(processedFile, watermarkText);
                } catch (err) {
                    console.error('Watermarking failed:', err);
                }
            }

            // Update status to uploading
            setProductData(prev => ({
                ...prev,
                colors: prev.colors.map(c => c.id === colorId ? {
                    ...c,
                    images: c.images.map(img => img.id === imageItem.id ? { ...img, status: 'uploading' } : img)
                } : c)
            }));

            const imageUrl = await uploadImageToCloudinary(processedFile, storeId);

            // Update status to success and save URL
            setProductData(prev => ({
                ...prev,
                colors: prev.colors.map(c => c.id === colorId ? {
                    ...c,
                    images: c.images.map(img => img.id === imageItem.id ? { ...img, status: 'success', url: imageUrl } : img)
                } : c)
            }));

        } catch (error) {
            console.error("Background upload failed", error);
            setProductData(prev => ({
                ...prev,
                colors: prev.colors.map(c => c.id === colorId ? {
                    ...c,
                    images: c.images.map(img => img.id === imageItem.id ? { ...img, status: 'error', error: 'Upload failed' } : img)
                } : c)
            }));
        }
    };

    const handleColorImageUpload = (e: ChangeEvent<HTMLInputElement>, colorId: string) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const newImageItems: ImageItem[] = files.map(file => ({
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                file,
                status: 'idle'
            }));

            setProductData(prev => ({
                ...prev,
                colors: prev.colors.map(c => c.id === colorId ? { ...c, images: [...c.images, ...newImageItems] } : c)
            }));

            // Start background upload immediately
            newImageItems.forEach(item => startBackgroundUpload(item, colorId));

            setTimeout(() => {
                sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);

            // Reset input value
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

    const handleTextileImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);

            const newColors: ColorVariant[] = files.map((file, index) => {
                const colorId = (Date.now() + index).toString() + Math.random().toString(36).substring(7);
                const imageItem: ImageItem = {
                    id: (Date.now() + index + 1000).toString() + Math.random().toString(36).substring(7),
                    file,
                    status: 'idle'
                };

                // Automatic naming D01, D02...
                const currentCount = productData.colors.length + index + 1;
                const designName = `D${String(currentCount).padStart(2, '0')}`;

                // Start background upload for this specific design immediately
                startBackgroundUpload(imageItem, colorId);

                return {
                    id: colorId,
                    name: designName,
                    hex: '#000000',
                    images: [imageItem]
                };
            });

            setProductData(prev => ({
                ...prev,
                colors: [...prev.colors, ...newColors]
            }));

            if (newColors.length > 0) {
                setActiveColorId(newColors[0].id);
            }

            e.target.value = '';
        }
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
        // Validate required fields
        if (!productData.name || !productData.price || !productData.categoryId || (productData.colors.length === 0 && !productData.isTextile)) {
            toast.error('Please fill all required fields.');
            return;
        }

        // Validate sizes if hasSizes is enabled
        if (productData.hasSizes && productData.sizes.length === 0) {
            toast.error('Please select at least one size');
            return;
        }

        // Validate that at least one color has images
        const colorsWithImages = productData.colors.filter(c => c.images.length > 0);
        if (colorsWithImages.length === 0) {
            toast.error('Please add at least one image to a color');
            return;
        }

        setIsUploading(true);
        setCurrentStep(4);

        const totalImages = productData.colors.reduce((acc, c) => acc + c.images.length, 0);
        let uploadedCount = 0;

        // Initialize progress for UI
        const initialProgress: UploadProgress[] = [];
        productData.colors.forEach(c => {
            c.images.forEach((img, idx) => {
                initialProgress.push({
                    id: img.id,
                    fileName: `${c.name} - Image ${idx + 1}`,
                    status: img.status,
                    statusText: img.status === 'success' ? 'Ready' : 'Processing...',
                    imageUrl: img.url
                });
            });
        });
        setUploadProgress(initialProgress);

        try {
            const uploadedColors = await Promise.all(productData.colors.map(async (color) => {
                const uploadedImages = [];
                for (let i = 0; i < color.images.length; i++) {
                    const imgItem = color.images[i];

                    // If already successful, just use the URL
                    if (imgItem.status === 'success' && imgItem.url) {
                        uploadedImages.push(imgItem.url);
                        uploadedCount++;
                        continue;
                    }

                    // If currently uploading or compressing, we wait (polling or just let the background process finish updating state? 
                    // Better to just retry/resume logic here for simplicity if it's not done)
                    // Actually, since startBackgroundUpload updates state, we can just wait for it? 
                    // But we don't have the promise handle. 
                    // Simple approach: If not success, re-run the upload logic (it's idempotent-ish if we check status, but `startBackgroundUpload` is void).
                    // Let's just re-run the upload logic for any non-success items to be safe and ensure completion.

                    const progressId = imgItem.id;

                    // If it's already uploading in background, we might want to wait, but we don't have a handle.
                    // So we'll just do the standard upload flow for anything not 'success'.
                    // This might double-upload if race condition, but it guarantees completion.
                    // Optimization: Check if we can just wait.

                    // For now, let's just re-do the upload for anything not finished. 
                    // Ideally we'd attach to the existing promise, but we didn't store it.

                    setUploadProgress(prev => prev.map(p => p.id === progressId ? { ...p, status: 'compressing', statusText: 'Compressing...' } : p));
                    let processedFile = await compressImage(imgItem.file);

                    if (useWatermark) {
                        setUploadProgress(prev => prev.map(p => p.id === progressId ? { ...p, status: 'compressing', statusText: 'Watermarking...' } : p));
                        try {
                            let watermarkText = '';
                            if (instagramHandle) {
                                const cleanHandle = instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`;
                                watermarkText = `${cleanHandle} | Compass 🧭Verified`;
                            } else {
                                const formattedName = storeName
                                    .replace(/\./g, ' ')
                                    .split(' ')
                                    .filter(Boolean)
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(' ');
                                watermarkText = `${formattedName} | Compass 🧭Verified`;
                            }
                            processedFile = await applyWatermark(processedFile, watermarkText);
                        } catch (err) {
                            console.error('Watermarking failed:', err);
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

            // Filter out colors with no images
            const validColors = uploadedColors.filter(color => color.images.length > 0);

            if (validColors.length === 0) {
                toast.error('No valid colors with images. Please check your uploads.');
                setIsUploading(false);
                return;
            }

            // Flatten all images for the main product image array
            const allImages = validColors.flatMap(c => c.images);

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
                colors: validColors,
                sizes: productData.hasSizes ? productData.sizes : undefined, // Only include sizes if hasSizes is true
                soldOutSizes: productData.hasSizes ? [] : undefined,
                sizeCategory: productData.sizeCategory,
                sizeChart: {
                    type: productData.sizeCategory === 'clothing'
                        ? 'nigerian-standard' as const
                        : productData.sizeCategory === 'shoes'
                            ? 'european-shoe' as const
                            : productData.sizeCategory === 'caps'
                                ? 'nigerian-cap' as const
                                : productData.sizeCategory === 'jallabs'
                                    ? 'jallab-standard' as const
                                    : productData.sizeCategory === 'insence'
                                        ? 'insence-volume' as const
                                        : productData.sizeCategory === 'waist-beads'
                                            ? 'waist-beads-inches' as const
                                            : 'oil-perfume-volume' as const
                },
                limitedStock: productData.limitedStock,
                soldOut: productData.soldOut,
                isTextile: productData.isTextile,
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

    const handleNextStep = () => {
        // Validate before advancing from step 1 (Variants)
        if (currentStep === 1) {
            // Check if colors without images exist
            const colorsWithoutImages = productData.colors.filter(c => c.images.length === 0);
            if (colorsWithoutImages.length > 0) {
                const colorNames = colorsWithoutImages.map(c => c.name || 'Unnamed').join(', ');
                toast.error(`Please add images to: ${colorNames}`);
                return;
            }

            // Check size requirement if hasSizes is enabled
            if (productData.hasSizes && productData.sizes.length === 0) {
                toast.error('Please select at least one size');
                setHighlightSizeSection(true);
                setTimeout(() => setHighlightSizeSection(false), 3000);
                return;
            }
        }

        // Validate step 0 (Details)
        if (currentStep === 0) {
            if (!productData.name || !productData.categoryId) {
                toast.error('Please fill in product name and category');
                return;
            }
        }

        // Validate step 2 (Pricing)
        if (currentStep === 2) {
            if (!productData.price || productData.price <= 0) {
                toast.error('Please enter a valid price');
                return;
            }
            if (productData.isPromo && (!productData.promoPrice || productData.promoPrice <= 0)) {
                toast.error('Please enter a valid promo price');
                return;
            }
        }

        setCurrentStep(s => s + 1);
    };

    const renderStepContent = () => {


        switch (currentStep) {
            case 0: // Details
                const categoryName = categories.find(c => c.id === productData.categoryId)?.name || 'Select a category';
                return (
                    <motion.div key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FloatingLabelInput label="Product Name" value={productData.name} onChange={(e) => handleProductChange('name', e.target.value)} />
                        <button onClick={() => setCategorySelectorOpen(true)} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group">
                            <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Category</span>
                            <div className="flex justify-between items-center">
                                <span className={`text-base font-medium ${productData.categoryId ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>{categoryName}</span>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </button>
                        <ModernToggle
                            label="Is Textile Product?"
                            description="Enable if this is a textile item where each image is a variant of the same design (skips color picking)."
                            checked={!!productData.isTextile}
                            onChange={(checked) => {
                                handleProductChange('isTextile', checked);
                                handleProductChange('colors', []); // Clear variants to avoid invalid state
                                setActiveColorId(null);
                            }}
                        />
                    </motion.div>
                );

            case 1: // Variants (Colors & Sizes)
                const activeColor = productData.colors.find(c => c.id === activeColorId);

                return (
                    <motion.div key={1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">

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

                            {/* Tab List - Hidden for Textile */}
                            {!productData.isTextile && (
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
                            )}

                            {/* Active Color Editor / Textile Designs List */}
                            <AnimatePresence mode="wait">
                                {productData.isTextile ? (
                                    <motion.div
                                        key="textile-designs"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {productData.colors.map((design, idx) => (
                                                <div key={design.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                                                    <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                                                        {design.images[0] && (
                                                            <Image src={URL.createObjectURL(design.images[0].file)} alt="Preview" fill className="object-cover" />
                                                        )}
                                                        <div className="absolute top-1 left-1">
                                                            {design.images[0]?.status === 'success' && <CheckCircle2 className="w-3 h-3 text-green-500 bg-white rounded-full" />}
                                                            {(design.images[0]?.status === 'uploading' || design.images[0]?.status === 'compressing') && <Loader2 className="w-3 h-3 text-blue-500 animate-spin bg-white rounded-full" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Design Name</label>
                                                        <input
                                                            type="text"
                                                            value={design.name}
                                                            onChange={(e) => updateColor(design.id, 'name', e.target.value)}
                                                            className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 font-semibold py-1"
                                                            placeholder="D01"
                                                        />
                                                    </div>
                                                    <button onClick={() => removeColor(design.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group bg-white dark:bg-slate-900 h-24 sm:h-auto">
                                                <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                <span className="text-xs text-slate-500 mt-2 font-semibold">Add Designs</span>
                                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleTextileImageUpload} />
                                            </label>
                                        </div>
                                    </motion.div>
                                ) : activeColor ? (
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

                                        {/* Image Upload Area */}
                                        <div>
                                            <label className="text-xs text-slate-500 font-medium mb-2 block">
                                                Images for {activeColor.name || 'this color'}
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                {activeColor.images.map((image, index) => (
                                                    <div key={image.id} className="relative aspect-[3/4] w-32 rounded-lg overflow-hidden group shadow-sm bg-slate-200 dark:bg-slate-700">
                                                        <Image src={URL.createObjectURL(image.file)} alt="Preview" fill className="object-cover" />
                                                        {/* Status Indicator */}
                                                        <div className="absolute top-1 left-1 z-10">
                                                            {image.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin drop-shadow-md" />}
                                                            {image.status === 'compressing' && <Loader2 className="w-4 h-4 text-amber-500 animate-spin drop-shadow-md" />}
                                                            {image.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 drop-shadow-md" />}
                                                            {image.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 drop-shadow-md" />}
                                                        </div>
                                                        <button
                                                            onClick={() => removeColorImage(activeColor.id, index)}
                                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="aspect-[3/4] w-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group bg-white dark:bg-slate-900">
                                                    <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                    <span className="text-xs text-slate-500 mt-2 font-medium">Add Image</span>
                                                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleColorImageUpload(e, activeColor.id)} />
                                                </label>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        Select a color to edit or add a new one.
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Warning for colors without images */}
                            {activeColor && activeColor.images.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{productData.isTextile ? 'Missing Design Images' : 'Missing Color Image'}</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            {productData.isTextile
                                                ? 'Add at least one design image before proceeding'
                                                : `Add at least one image to "${activeColor.name || 'this color'}" before proceeding`}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* SIZES SECTION */}
                        <div ref={sizeSectionRef} className={`space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-all duration-300 ${highlightSizeSection
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500 shadow-lg'
                            : ''
                            }`}>
                            {/* Sizes Optional Toggle */}
                            <ModernToggle
                                label="Add Sizes to This Product?"
                                description="Enable if this item comes in different sizes"
                                checked={productData.hasSizes}
                                onChange={checked => {
                                    handleProductChange('hasSizes', checked);
                                    if (!checked) handleProductChange('sizes', []); // Clear sizes if toggle is turned off
                                    if (checked) {
                                        setTimeout(() => {
                                            sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                        }, 100);
                                    }
                                }}
                            />

                            {/* Conditional Size Selection UI */}
                            {productData.hasSizes && (
                                <>
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
                                    <div ref={sizeCategoryContainerRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
                                        {[
                                            { id: 'clothing', label: 'Clothing' },
                                            { id: 'shoes', label: 'Shoes' },
                                            { id: 'caps', label: 'Caps' },
                                            { id: 'jallabs', label: 'Jallabs' },
                                            { id: 'insence', label: 'Insence' },
                                            { id: 'oil-perfumes', label: 'Oil Perfumes' },
                                            { id: 'waist-beads', label: 'Waist Beads' },
                                        ].map((category) => (
                                            <button
                                                key={category.id}
                                                ref={(el) => {
                                                    if (el) sizeCategoryButtonRefs.current.set(category.id, el);
                                                    else sizeCategoryButtonRefs.current.delete(category.id);
                                                }}
                                                onClick={() => {
                                                    handleProductChange('sizeCategory', category.id);
                                                    handleProductChange('sizes', []);
                                                    scrollToSizeCategory(category.id);
                                                }}
                                                className={`flex-shrink-0 whitespace-nowrap px-4 py-3 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${productData.sizeCategory === category.id
                                                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                                                    }`}
                                            >
                                                {category.label}
                                            </button>
                                        ))}
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
                                                    : productData.sizeCategory === 'caps'
                                                        ? 'Nigerian cap sizing (circumference in inches)'
                                                        : productData.sizeCategory === 'jallabs'
                                                            ? 'Jallab sizing (52-62)'
                                                            : productData.sizeCategory === 'insence'
                                                                ? 'Insence sizing (volume)'
                                                                : productData.sizeCategory === 'waist-beads'
                                                                    ? 'Waist beads sizing (inches)'
                                                                    : 'Oil perfumes sizing (volume)'
                                        }
                                    </p>
                                </>
                            )}
                        </div>

                    </motion.div>
                );

            case 2: // Pricing
                const commissionAmount = (productData.isPromo ? productData.promoPrice || 0 : productData.price || 0) * (productData.commission / 100);
                return (
                    <motion.div key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FloatingLabelInput label="Price (₦)" type="number" value={productData.price === 0 ? '' : productData.price} onChange={(e) => handleProductChange('price', parseFloat(e.target.value) || 0)} />

                        <div className="space-y-4">
                            <ModernToggle label="Run a Promotion?" description="Set a discounted price for this item" checked={productData.isPromo} onChange={checked => handleProductChange('isPromo', checked)} />
                            <AnimatePresence>
                                {productData.isPromo && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <FloatingLabelInput label="Promo Price (₦)" type="number" value={(productData.promoPrice === undefined || productData.promoPrice === 0) ? '' : productData.promoPrice} onChange={(e) => handleProductChange('promoPrice', parseFloat(e.target.value) || 0)} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <ModernToggle label="Watermark Images" description="Add store name & Compass ?? verified to images" checked={useWatermark} onChange={setUseWatermark} />
                            <ModernToggle label="Limited Stock" description="Show 'Low Stock' badge to customers" checked={productData.limitedStock} onChange={checked => handleProductChange('limitedStock', checked)} />
                            <ModernToggle label="Sold Out" description="Mark as currently unavailable" checked={productData.soldOut} onChange={checked => handleProductChange('soldOut', checked)} />
                        </div>
                    </motion.div>
                );

            case 3: // Review
                return (
                    <motion.div key={3} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
                    </motion.div>
                );

            case 4: // Uploading
                return (
                    <motion.div key={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
                    </motion.div>
                );

            case 5: // Summary
                const successes = uploadProgress.filter(p => p.status === 'success').length;
                const failures = uploadProgress.filter(p => p.status === 'error').length;
                return (
                    <motion.div key={5} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Upload Complete!</h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                            Your product has been successfully added to the store.
                        </p>
                        {failures > 0 && <p className="text-sm text-red-500 mt-4">{failures} images failed to upload.</p>}
                    </motion.div>
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
                                    {currentStep === 4 ? 'Uploading...' : currentStep === 5 ? 'Success' : 'Add Product'}
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
                                <button onClick={handleNextStep} className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
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
                                            {productData.sizeCategory === 'clothing' ? 'Size Guide (UK/NG)' : productData.sizeCategory === 'shoes' ? 'Shoe Size Guide (EU)' : productData.sizeCategory === 'caps' ? 'Cap Size Guide (NG)' : productData.sizeCategory === 'jallabs' ? 'Jallab Size Guide' : productData.sizeCategory === 'insence' ? 'Insence Size Guide' : 'Oil Perfumes Guide'}
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
                                        ) : productData.sizeCategory === 'shoes' ? (
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
                                        ) : productData.sizeCategory === 'caps' ? (
                                            <>
                                                <div className="grid grid-cols-1 gap-2 text-sm font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
                                                    <span>Size (Circumference in inches)</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {NIGERIAN_CAP_SIZE_CHART.map((item) => (
                                                        <div key={item.size} className="text-sm text-slate-900 dark:text-slate-100 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center font-bold">
                                                            {item.size}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : productData.sizeCategory === 'jallabs' ? (
                                            <>
                                                <div className="grid grid-cols-1 gap-2 text-sm font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
                                                    <span>Jallab Size</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {JALLAB_SIZE_CHART.map((item) => (
                                                        <div key={item.size} className="text-sm text-slate-900 dark:text-slate-100 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center font-bold">
                                                            {item.size}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : productData.sizeCategory === 'insence' ? (
                                            <>
                                                <div className="grid grid-cols-1 gap-2 text-sm font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
                                                    <span>Insence Size</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {INSENCE_SIZE_CHART.map((item) => (
                                                        <div key={item.size} className="text-sm text-slate-900 dark:text-slate-100 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center font-bold">
                                                            {item.size}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-1 gap-2 text-sm font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
                                                    <span>Oil Perfume Size</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {OIL_PERFUMES_SIZE_CHART.map((item) => (
                                                        <div key={item.size} className="text-sm text-slate-900 dark:text-slate-100 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center font-bold">
                                                            {item.size}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                                        <Info className="w-4 h-4 flex-shrink-0" />
                                        <p>{productData.sizeCategory === 'clothing' ? 'Measurements are in inches. This is a standard guide, actual fit may vary by style.' : productData.sizeCategory === 'shoes' ? 'Measure your foot length in cm to find your size. Sizes may vary by brand.' : productData.sizeCategory === 'caps' ? 'Measure the circumference of your head in inches to find your cap size.' : productData.sizeCategory === 'jallabs' ? 'Jallab sizes range from 52-62. Choose based on your usual sizing.' : productData.sizeCategory === 'insence' ? 'Standard insence sizes.' : 'Standard oil perfumes sizes.'}</p>
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
