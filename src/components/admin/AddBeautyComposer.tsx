'use client';
import React, { useState, useRef, Fragment, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Product, BeautyProduct, BeautyShade, BeautyBottleSize } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import { applyWatermark } from '../../utils/watermark';
import { formatPrice } from '../../utils/price';
import CategorySelectorModal from './modals/CategorySelectorModal';
import {
    X,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Plus,
    Trash2,
    ImagePlus,
    Loader2,
    Pipette,
    Droplets,
    Activity,
    FlaskConical,
    Zap,
    Info,
    Fingerprint,
    Tag,
    Clock
} from 'lucide-react';

// --- TYPES ---
type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'success' | 'error';

interface ImageItem {
    id: string;
    file: File;
    url?: string;
    status: UploadStatus;
    error?: string;
}

interface BeautyVariant {
    id: string;
    name: string; // Shade Name or Volume (e.g. "30ml")
    hex?: string; // For Shades
    price?: number; // Optional override for different sizes
    images: ImageItem[];
}

interface BatchBeautyProduct {
    id: string;
    name: string;
    brand: string;
    price: number;
    isPromo: boolean;
    promoPrice?: number;
    categoryId: string;
    limitedStock: boolean;
    soldOut: boolean;

    // Beauty Specific
    beautyType: 'makeup' | 'skincare' | 'haircare' | 'fragrance';
    subType?: string;
    variants: BeautyVariant[];
    skinTypes: string[];
    hairTypes: string[];
    ingredients: string;
    howToUse: string;
    benefits: string;
}

interface AddBeautyComposerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    categories: { id: string; name: string }[];
    onProductAdded: () => void;
    onAddCategory: (name: string) => Promise<void>;
    storeName: string;
    instagramHandle?: string;
}

// --- CONSTANTS ---
const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'Acne-Prone', 'Mature'];
const HAIR_TYPES = ['Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Thick', 'Color-Treated', 'Damaged', 'Dry', 'Oily'];
const BOTTLE_SIZES = ['15ml', '30ml', '50ml', '100ml', '200ml', '250ml', '500ml', '1L', 'Travel Size', 'Full Size'];

const PRESET_SKIN_COLORS = [
    { name: 'Porcelain', hex: '#F8E7D8' },
    { name: 'Ivory', hex: '#F3E0C9' },
    { name: 'Warm Beige', hex: '#D9B99B' },
    { name: 'Honey', hex: '#C69C6D' },
    { name: 'Golden', hex: '#B38B5D' },
    { name: 'Almond', hex: '#9E7249' },
    { name: 'Chestnut', hex: '#7B5136' },
    { name: 'Espresso', hex: '#4B2C1C' },
    { name: 'Deep', hex: '#321B0F' },
];

// --- HELPER COMPONENTS ---

const ModernToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
    <label className="flex items-center cursor-pointer justify-between w-full py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
            {description && <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>}
        </div>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-12 h-7 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </label>
);

const FloatingLabelInput: React.FC<{ label: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type?: string, multiline?: boolean, placeholder?: string }> = ({ label, value, onChange, type = 'text', multiline = false, placeholder = ' ' }) => (
    <div className="relative">
        {multiline ? (
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={3}
                className="block w-full px-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 peer transition-all"
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 peer transition-all"
            />
        )}
        <label className={`absolute text-sm text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-2 peer-focus:px-2 peer-focus:text-indigo-600 ${multiline ? 'peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-4' : 'peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-6'} peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 cursor-text`}>
            {label}
        </label>
    </div>
);

const AddBeautyComposer: React.FC<AddBeautyComposerProps> = ({ isOpen, onClose, storeId, categories, onProductAdded, onAddCategory, storeName, instagramHandle }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [useWatermark, setUseWatermark] = useState(false);
    const [productData, setProductData] = useState<BatchBeautyProduct>({
        id: Date.now().toString(),
        name: '',
        brand: '',
        price: 0,
        isPromo: false,
        categoryId: '',
        limitedStock: false,
        soldOut: false,
        beautyType: 'skincare',
        variants: [],
        skinTypes: [],
        hairTypes: [],
        ingredients: '',
        howToUse: '',
        benefits: '',
    });

    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initial variant if needed
    useEffect(() => {
        if (currentStep === 1 && productData.variants.length === 0) {
            addVariant();
        }
    }, [currentStep]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (categories && categories.length > 0 && !productData.categoryId) {
                setProductData(prev => ({ ...prev, categoryId: categories[0].id }));
            }
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, categories]);

    const resetState = () => {
        setCurrentStep(0);
        setProductData({
            id: Date.now().toString(),
            name: '',
            brand: '',
            price: 0,
            isPromo: false,
            categoryId: '',
            limitedStock: false,
            soldOut: false,
            beautyType: 'skincare',
            variants: [],
            skinTypes: [],
            hairTypes: [],
            ingredients: '',
            howToUse: '',
            benefits: '',
        });
        setIsUploading(false);
        setActiveVariantId(null);
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    }

    const handleProductChange = (field: keyof BatchBeautyProduct, value: any) => {
        setProductData(prev => ({ ...prev, [field]: value }));
    };

    const addVariant = () => {
        const newVariant: BeautyVariant = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            name: productData.beautyType === 'makeup' ? '' : 'Full Size',
            hex: productData.beautyType === 'makeup' ? '#D9B99B' : undefined,
            images: [],
        };
        setProductData(prev => ({ ...prev, variants: [...prev.variants, newVariant] }));
        setActiveVariantId(newVariant.id);
    };

    const updateVariant = (id: string, field: keyof BeautyVariant, value: any) => {
        setProductData(prev => ({
            ...prev,
            variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
        }));
    };

    const removeVariant = (id: string) => {
        const newVariants = productData.variants.filter(v => v.id !== id);
        setProductData(prev => ({ ...prev, variants: newVariants }));
        if (activeVariantId === id) {
            setActiveVariantId(newVariants.length > 0 ? newVariants[0].id : null);
        }
    };

    const startBackgroundUpload = async (imageItem: ImageItem, variantId: string) => {
        setProductData(prev => ({
            ...prev,
            variants: prev.variants.map(v => v.id === variantId ? {
                ...v,
                images: v.images.map(img => img.id === imageItem.id ? { ...img, status: 'compressing' } : img)
            } : v)
        }));

        try {
            let processedFile = await compressImage(imageItem.file);
            if (useWatermark) {
                let watermarkText = instagramHandle || `${storeName} | BizconNet™Verified`;
                processedFile = await applyWatermark(processedFile, watermarkText);
            }

            setProductData(prev => ({
                ...prev,
                variants: prev.variants.map(v => v.id === variantId ? {
                    ...v,
                    images: v.images.map(img => img.id === imageItem.id ? { ...img, status: 'uploading' } : img)
                } : v)
            }));

            const imageUrl = await uploadImageToCloudinary(processedFile, storeId);

            setProductData(prev => ({
                ...prev,
                variants: prev.variants.map(v => v.id === variantId ? {
                    ...v,
                    images: v.images.map(img => img.id === imageItem.id ? { ...img, status: 'success', url: imageUrl } : img)
                } : v)
            }));

        } catch (error) {
            console.error("Upload failed", error);
            setProductData(prev => ({
                ...prev,
                variants: prev.variants.map(v => v.id === variantId ? {
                    ...v,
                    images: v.images.map(img => img.id === imageItem.id ? { ...img, status: 'error', error: 'Upload failed' } : img)
                } : v)
            }));
        }
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, variantId: string) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const newImageItems: ImageItem[] = files.map(file => ({
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                file,
                status: 'idle'
            }));

            setProductData(prev => ({
                ...prev,
                variants: prev.variants.map(v => v.id === variantId ? { ...v, images: [...v.images, ...newImageItems] } : v)
            }));

            newImageItems.forEach(item => startBackgroundUpload(item, variantId));
            e.target.value = '';
        }
    };

    const toggleMultiSelect = (field: 'skinTypes' | 'hairTypes', value: string) => {
        setProductData(prev => {
            const current = (prev[field] as string[]);
            const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            return { ...prev, [field]: next };
        });
    };

    const handleSubmit = async () => {
        if (!productData.name || !productData.categoryId || productData.variants.length === 0) {
            toast.error('Please fill required fields.');
            return;
        }

        setIsUploading(true);
        setCurrentStep(4);

        try {
            const uploadedVariants = await Promise.all(productData.variants.map(async (v) => {
                const images = v.images.filter(img => img.status === 'success' && img.url).map(img => img.url!);
                return {
                    name: v.name,
                    hex: v.hex,
                    price: v.price,
                    images
                };
            }));

            const validVariants = uploadedVariants.filter(v => v.images.length > 0);
            if (validVariants.length === 0) {
                toast.error('Please add at least one image.');
                setIsUploading(false);
                setCurrentStep(1);
                return;
            }

            const allImages = validVariants.flatMap(v => v.images);

            const product: BeautyProduct = {
                id: '',
                storeId,
                name: productData.name,
                brand: productData.brand,
                description: productData.benefits || '',
                price: productData.isPromo ? productData.promoPrice! : productData.price,
                images: allImages,
                views: 0,
                createdAt: { toMillis: () => Date.now() } as any,
                commission: 2.5,
                onPromo: productData.isPromo,
                productType: 'beauty',
                categoryId: productData.categoryId,
                category: categories.find(c => c.id === productData.categoryId)?.name || '',
                subtype: productData.beautyType as any,
                shades: productData.beautyType === 'makeup' ? validVariants as any : undefined,
                bottleSizes: productData.beautyType !== 'makeup' ? validVariants as any : undefined,
                skinTypes: productData.skinTypes,
                hairTypes: productData.hairTypes,
                ingredients: productData.ingredients,
                howToUse: productData.howToUse,
                benefits: productData.benefits,
                limitedStock: productData.limitedStock,
                soldOut: productData.soldOut,
            };

            await addProduct(storeId, product);
            onProductAdded();
            setCurrentStep(5);
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload product.');
        } finally {
            setIsUploading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Details
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <FloatingLabelInput label="Product Name" value={productData.name} onChange={(e) => handleProductChange('name', e.target.value)} />
                        <FloatingLabelInput label="Brand Name" value={productData.brand} onChange={(e) => handleProductChange('brand', e.target.value)} />

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Store Category</label>
                            <button onClick={() => setCategorySelectorOpen(true)} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group">
                                <span className={`font-medium ${productData.categoryId ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                                    {categories.find(c => c.id === productData.categoryId)?.name || 'Select Category'}
                                </span>
                                <ChevronRight size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Beauty Category</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['skincare', 'makeup', 'haircare', 'fragrance'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleProductChange('beautyType', type)}
                                        className={`p-3 rounded-xl border text-sm font-bold capitalize transition-all ${productData.beautyType === type
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );

            case 1: // Variants & Science
                const activeVariant = productData.variants.find(v => v.id === activeVariantId);
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        {/* Variants Header */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                        {productData.beautyType === 'makeup' ? <Pipette size={20} /> : <Droplets size={20} />}
                                    </div>
                                    {productData.beautyType === 'makeup' ? 'Shades' : 'Sizes / Volumes'}
                                </h3>
                                <button onClick={addVariant} className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-100 transition-colors">
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {productData.variants.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => setActiveVariantId(v.id)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-all flex items-center gap-2 ${activeVariantId === v.id
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200'}`}
                                    >
                                        {v.hex && <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: v.hex }} />}
                                        <span className="max-w-[100px] truncate">{v.name || 'Unnamed'}</span>
                                    </button>
                                ))}
                            </div>

                            {activeVariant && (
                                <div className="bg-white dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-5">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-4">
                                            <FloatingLabelInput label={productData.beautyType === 'makeup' ? 'Shade Name' : 'Volume / Size'} value={activeVariant.name} onChange={(e) => updateVariant(activeVariant.id, 'name', e.target.value)} />
                                            {productData.beautyType === 'makeup' && (
                                                <div className="flex flex-wrap gap-2">
                                                    {PRESET_SKIN_COLORS.map(p => (
                                                        <button key={p.hex} onClick={() => { updateVariant(activeVariant.id, 'hex', p.hex); updateVariant(activeVariant.id, 'name', p.name); }}
                                                            className={`w-8 h-8 rounded-full border-2 transition-transform ${activeVariant.hex === p.hex ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: p.hex }} />
                                                    ))}
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200">
                                                        <input type="color" value={activeVariant.hex} onChange={(e) => updateVariant(activeVariant.id, 'hex', e.target.value)} className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" />
                                                    </div>
                                                </div>
                                            )}
                                            {productData.beautyType !== 'makeup' && (
                                                <div className="flex flex-wrap gap-2">
                                                    {BOTTLE_SIZES.map(s => (
                                                        <button key={s} onClick={() => updateVariant(activeVariant.id, 'name', s)}
                                                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${activeVariant.name === s ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-500'}`}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {productData.variants.length > 1 && (
                                            <button onClick={() => removeVariant(activeVariant.id)} className="text-red-400 hover:text-red-500 p-2"><Trash2 size={20} /></button>
                                        )}
                                    </div>

                                    {/* Images Grid */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {activeVariant.images.map((img, idx) => (
                                            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200">
                                                {img.url ? <Image src={img.url} alt="Variant" fill className="object-cover" /> : null}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    {img.status === 'uploading' && <Loader2 className="animate-spin text-white" size={16} />}
                                                </div>
                                                <button onClick={() => updateVariant(activeVariant.id, 'images', activeVariant.images.filter((_, i) => i !== idx))} className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 dark:bg-black/60 text-slate-900 dark:text-white rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors"><X size={12} /></button>
                                            </div>
                                        ))}
                                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                            <ImagePlus size={20} className="text-slate-400" />
                                            <input type="file" multiple className="hidden" onChange={(e) => handleImageUpload(e, activeVariant.id)} />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Science & Usage */}
                        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2">
                                <FlaskConical className="text-indigo-600" size={18} />
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Beauty Science & Usage</h4>
                            </div>
                            <FloatingLabelInput label="Key Benefits (e.g. Brightening, Hydrating)" value={productData.benefits} onChange={(e) => handleProductChange('benefits', e.target.value)} multiline />
                            <FloatingLabelInput label="How to Use / Directions" value={productData.howToUse} onChange={(e) => handleProductChange('howToUse', e.target.value)} multiline />
                            <FloatingLabelInput label="Full Ingredients" value={productData.ingredients} onChange={(e) => handleProductChange('ingredients', e.target.value)} multiline />

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] block ml-1">Compatibility</label>
                                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                    <h5 className="text-[10px] font-bold text-slate-500 mb-3 flex items-center gap-2">
                                        <Fingerprint size={12} /> {productData.beautyType === 'haircare' ? 'HAIR TYPES' : 'SKIN TYPES'}
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {(productData.beautyType === 'haircare' ? HAIR_TYPES : SKIN_TYPES).map(type => (
                                            <button key={type} onClick={() => toggleMultiSelect(productData.beautyType === 'haircare' ? 'hairTypes' : 'skinTypes', type)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all border ${(productData.beautyType === 'haircare' ? productData.hairTypes : productData.skinTypes).includes(type)
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                                    }`}>
                                                {type.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 2: // Pricing & Options
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <FloatingLabelInput label="Regular Price (₦)" type="number" value={productData.price || ''} onChange={(e) => handleProductChange('price', parseFloat(e.target.value))} />
                        <ModernToggle label="Limited Stock?" description="Display a badge when stock is running low." checked={productData.limitedStock} onChange={(val) => handleProductChange('limitedStock', val)} />
                        <ModernToggle label="Mark as Sold Out?" checked={productData.soldOut} onChange={(val) => handleProductChange('soldOut', val)} />

                        <div className="p-4 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 space-y-4">
                            <ModernToggle label="Special Promo Price?" checked={productData.isPromo} onChange={(val) => handleProductChange('isPromo', val)} />
                            {productData.isPromo && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                    <FloatingLabelInput label="Discounted Price (₦)" type="number" value={productData.promoPrice || ''} onChange={(e) => handleProductChange('promoPrice', parseFloat(e.target.value))} />
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                );

            case 3: // Review
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
                        <div className="p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                                    {productData.variants[0]?.images[0]?.url ? <Image src={productData.variants[0].images[0].url} alt="Preview" fill className="object-cover" /> : <Sparkles className="m-auto text-slate-200" size={32} />}
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{productData.brand || 'No Brand'}</span>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{productData.name || 'Untitled Beauty Product'}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-lg font-black text-slate-900 dark:text-white">{formatPrice(productData.isPromo ? productData.promoPrice! : productData.price)}</span>
                                        {productData.isPromo && <span className="text-xs text-slate-400 line-through font-bold">{formatPrice(productData.price)}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Beauty Type</span>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{productData.beautyType}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Variants</span>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{productData.variants.length} {productData.beautyType === 'makeup' ? 'Shades' : 'Sizes'}</p>
                                </div>
                            </div>

                            {(productData.skinTypes.length > 0 || productData.hairTypes.length > 0) && (
                                <div className="pt-4">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Suitable For</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[...productData.skinTypes, ...productData.hairTypes].map(t => (
                                            <span key={t} className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-black text-indigo-600 uppercase tracking-tight">#{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );

            case 4: // Uploading
                return (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30" />
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Publishing Beauty Product</h3>
                            <p className="text-sm text-slate-500 mt-2">Almost ready! Finalizing details and uploading premium assets...</p>
                        </div>
                    </div>
                );

            case 5: // Success
                return (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 pb-24">
                        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mx-auto shadow-inner">
                            <CheckCircle2 size={48} className="animate-bounce" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Product Live!</h3>
                            <p className="text-slate-500 mt-2">Your beauty product is now available in your storefront.</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const STEPS = [{ name: 'Details' }, { name: 'Variants & Science' }, { name: 'Pricing' }, { name: 'Review' }, { name: 'Publishing' }, { name: 'Success' }];
    const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 shadow-2xl overflow-hidden" initial="hidden" animate="visible" exit="exit" variants={modalVariants}>
                    <header className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <button onClick={currentStep > 0 && currentStep < 4 ? () => setCurrentStep(currentStep - 1) : handleClose} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                                {currentStep > 0 && currentStep < 4 ? <ChevronLeft className="w-6 h-6 text-slate-900 dark:text-white" /> : <X className="w-6 h-6 text-slate-900 dark:text-white" />}
                            </button>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Beauty Product</h2>
                                <p className="text-xs text-slate-500">{STEPS[currentStep]?.name || 'Finalizing'} • {Math.min(currentStep + 1, 4)}/4</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full pb-32" ref={scrollContainerRef}>
                        {renderStepContent()}
                    </div>

                    {currentStep < 5 && (
                        <footer className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20">
                            <div className="max-w-3xl mx-auto w-full">
                                <button
                                    onClick={currentStep === 3 ? handleSubmit : () => {
                                        if (currentStep === 0 && (!productData.name || !productData.categoryId)) {
                                            toast.error('Product name and category are required.');
                                            return;
                                        }
                                        if (currentStep === 1 && productData.variants.some(v => v.images.length === 0)) {
                                            toast.error('All variants must have at least one image.');
                                            return;
                                        }
                                        setCurrentStep(currentStep + 1);
                                    }}
                                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg transition-all shadow-lg hover:bg-indigo-700 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {currentStep === 3 ? 'Publish Product' : 'Next Step'}
                                </button>
                            </div>
                        </footer>
                    )}
                    {currentStep === 5 && (
                        <footer className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20">
                            <div className="max-w-3xl mx-auto w-full flex justify-between gap-4">
                                <button onClick={() => setCurrentStep(0)} className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors break-words line-clamp-1 truncate active:scale-[0.98]">
                                    Add More
                                </button>
                                <button onClick={handleClose} className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-500/30 transition-transform active:scale-[0.98]">
                                    Done
                                </button>
                            </div>
                        </footer>
                    )}
                    <CategorySelectorModal
                        isOpen={isCategorySelectorOpen}
                        onClose={() => setCategorySelectorOpen(false)}
                        categories={categories}
                        selectedCategoryId={productData.categoryId}
                        onSelect={(id) => {
                            handleProductChange('categoryId', id);
                            setCategorySelectorOpen(false);
                        }}
                        onAddCategory={onAddCategory}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddBeautyComposer;
