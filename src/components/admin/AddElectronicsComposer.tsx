'use client';
import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Smartphone, Laptop, Battery, Sun, Headphones, Watch, Gamepad2, Cable, Package, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { X } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { ProductCache } from '../../lib/productCache';
import CategorySelectorModal from './modals/CategorySelectorModal';

// --- Shared Helper Components (from AddMenuComposer/others) ---

const ModernToggle = ({ label, description, checked, onChange }: { label: string, description?: string, checked: boolean, onChange: (c: boolean) => void }) => (
    <label className="flex items-center cursor-pointer justify-between w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:border-blue-200 dark:hover:border-blue-900/50">
        <div className="flex flex-col flex-1 pr-4">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
            {description && <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</span>}
        </div>
        <div className="relative shrink-0">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-12 h-7 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </label>
);

const FloatingLabelInput = ({ label, type = "text", value, onChange, placeholder = "", prefix = "", id }: { label: string, type?: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement>) => void, placeholder?: string, prefix?: string, id?: string }) => {
    const defaultId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const inputId = id || defaultId;

    return (
        <div className="relative">
            {prefix && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-zinc-500 dark:text-zinc-400 sm:text-sm">{prefix}</span>
                </div>
            )}
            <input
                id={inputId}
                type={type}
                value={value}
                onChange={onChange}
                className={`block w-full rounded-xl border-0 py-4 ${prefix ? 'pl-8' : 'pl-4'} pr-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 placeholder:text-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all peer`}
                placeholder={placeholder || label}
            />
            <label
                htmlFor={inputId}
                className="absolute left-4 -top-2.5 bg-white dark:bg-zinc-900 px-1 text-xs font-medium text-blue-600 dark:text-blue-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 pointer-events-none"
            >
                {label}
            </label>
        </div>
    );
};

// --- Core Data Structures ---

export interface BatchElectronicsProduct {
    id: string; // temp local id
    name: string;
    description: string;
    images: { file: File, preview: string, compressed?: Blob, url?: string, isMain?: boolean }[];
    price: number;
    isPromo: boolean;
    promoPrice: number;
    categoryId: string;
    quantity: number;
    limitedStock: boolean;
    soldOut: boolean;

    // Electronics Specifics
    brand: string;
    condition: 'brand-new' | 'open-box' | 'used-good' | 'used-fair' | 'refurbished';
    subtype: 'phone' | 'tablet' | 'laptop' | 'powerbank' | 'solar' | 'audio' | 'accessory' | 'smartwatch' | 'gaming' | 'other';

    storage: string;
    ram: string;
    color: string;
    network: '3G' | '4G' | '5G' | '';
    batteryCapacity: string;
    os: string;
    imeiVerified: boolean;

    // Audio-specific
    audioStyle: string;
    anc: boolean;

    // Power Bank-specific
    powerOutput: string;

    // Accessory-specific
    accessoryType: string;
    compatibleWith: string;
    connectivity: string;

    // Smartwatch-specific
    watchBatteryLife: string;
    watchFeatures: string[];

    // Gaming-specific
    gamingCategory: string;
    gamingPlatform: string;

    warranty: boolean;
    warrantyDuration: string;
    whatsInBox: string[]; // array of tags

    useAsTemplate: boolean;
    uploadStatus: 'idle' | 'compressing' | 'uploading' | 'saving' | 'success' | 'error';
    uploadProgress: number;
    errorMessage?: string;
}

const getBrandOptions = (subtype: string) => {
    switch (subtype) {
        case 'powerbank':
            return ['Oraimo', 'Itel', 'New Age', 'Anker', 'Romoss', 'Samsung', 'Xiaomi', 'Baseus'];
        case 'phone':
        case 'tablet':
            return ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo', 'Vivo', 'Nokia', 'Google'];
        case 'laptop':
            return ['Apple', 'HP', 'Dell', 'Lenovo', 'ASUS', 'Acer', 'Microsoft', 'MSI', 'Samsung', 'Alienware'];
        case 'accessory':
            return ['Apple', 'Samsung', 'Oraimo', 'Anker', 'Baseus', 'Ugreen', 'Belkin', 'Spigen'];
        case 'audio':
            return ['Apple', 'Sony', 'JBL', 'Bose', 'Samsung', 'Sennheiser', 'Beats', 'Oraimo'];
        case 'smartwatch':
            return ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei', 'Xiaomi', 'Amazfit', 'Oraimo'];
        case 'gaming':
            return ['Sony', 'Microsoft', 'Nintendo', 'Razer', 'Logitech', 'SteelSeries', 'Asus ROG', 'HyperX'];
        default:
            return ['Apple', 'Samsung', 'Sony', 'LG', 'Panasonic', 'Philips', 'Anker', 'Oraimo'];
    }
};

const getBatteryOptions = (subtype: string) => {
    if (subtype === 'powerbank') {
        return ['5000mAh', '10000mAh', '15000mAh', '20000mAh', '30000mAh', '40000mAh', '50000mAh'];
    }
    return ['3000mAh', '4000mAh', '4500mAh', '5000mAh', '5500mAh', '6000mAh', '8000mAh', '10000mAh'];
};

const POWER_OUTPUT_OPTIONS = ['5W', '10W', '18W Quick Charge', '20W', '22.5W', '33W', '45W', '65W', '100W'];
const AUDIO_STYLES = ['In-Ear', 'Over-Ear', 'On-Ear', 'Earbuds (TWS)', 'Speaker', 'Soundbar', 'Other'];
const ACCESSORY_TYPES = ['Case & Cover', 'Cable', 'Charger & Adapter', 'Screen Protector', 'Power Strip', 'Hub / Dock', 'Stand & Mount', 'Stylus', 'Memory Card', 'Other'];
const CONNECTIVITY_OPTIONS = ['Bluetooth', 'Wi-Fi', 'USB-C', 'Lightning', '3.5mm Jack', 'HDMI', 'USB-A', 'Wireless (RF)'];
const WATCH_BATTERY_OPTIONS = ['1 day', '2 days', '5 days', '7 days', '10 days', '14 days', '18 days', '21 days', '30 days'];
const WATCH_FEATURES = ['Heart Rate', 'SpO2 (Blood Oxygen)', 'GPS', 'Sleep Tracking', 'Step Counter', 'Calorie Tracking', 'NFC / Payments', 'Bluetooth Calls', 'ECG', 'Fall Detection'];
const GAMING_CATEGORIES = ['Controller / Gamepad', 'Gaming Headset', 'Game Console', 'Gaming Keyboard', 'Gaming Mouse', 'Gaming Chair', 'Gaming Monitor', 'Other'];
const GAMING_PLATFORMS = ['PS5', 'PS4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC', 'Mobile', 'Multi-Platform'];

const CONDITIONS = [
    { value: 'brand-new', label: '🆕 Brand New' },
    { value: 'open-box', label: '✨ Open Box' },
    { value: 'used-good', label: '👍 Used (Good)' },
    { value: 'used-fair', label: '⚠️ Used (Fair)' },
    { value: 'refurbished', label: '🔧 Refurbished' },
];

const SUBTYPES = [
    { value: 'phone', label: 'Phone', icon: Smartphone },
    { value: 'tablet', label: 'Tablet', icon: Smartphone },
    { value: 'laptop', label: 'Laptop', icon: Laptop },
    { value: 'powerbank', label: 'Power Bank', icon: Battery },
    { value: 'audio', label: 'Audio', icon: Headphones },
    { value: 'accessory', label: 'Accessory', icon: Cable },
    { value: 'smartwatch', label: 'Watch', icon: Watch },
    { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { value: 'other', label: 'Other', icon: Package },
];

const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const RAM_OPTIONS = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB'];
const BATTERY_OPTIONS = ['3000mAh', '4000mAh', '4500mAh', '5000mAh', '5500mAh', '6000mAh', '8000mAh', '10000mAh'];
const getOSOptions = (subtype: string) => {
    switch (subtype) {
        case 'phone': return ['iOS', 'Android', 'Other'];
        case 'tablet': return ['iPadOS', 'Android', 'Windows', 'Other'];
        case 'laptop': return ['Windows', 'macOS', 'ChromeOS', 'Linux', 'Other'];
        default: return ['iOS', 'Android', 'Windows', 'Other'];
    }
};
const NETWORK_OPTIONS = ['3G', '4G', '5G'];
const WARRANTY_DURATIONS = ['1 week', '2 weeks', '1 month', '3 months', '6 months', '1 year', '2 years'];


export default function AddElectronicsComposer({
    storeId,
    isOpen,
    onClose,
    categories,
    onAddCategory,
    onProductAdded
}: {
    storeId: string;
    isOpen: boolean;
    onClose: () => void;
    categories: { id: string; name: string }[];
    onAddCategory: (name: string) => Promise<void>;
    onProductAdded?: () => void;
}) {
    // --- State ---
    const [products, setProducts] = useState<BatchElectronicsProduct[]>([]);
    const [activeProductIndex, setActiveProductIndex] = useState<number>(0);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);

    // --- Refs for auto-scrolling ---
    const deviceTypeRef = React.useRef<HTMLDivElement>(null);
    const specsBlockRef = React.useRef<HTMLDivElement>(null);
    const brandRef = React.useRef<HTMLDivElement>(null);
    const descriptionRef = React.useRef<HTMLDivElement>(null);
    const storageRef = React.useRef<HTMLDivElement>(null);
    const ramRef = React.useRef<HTMLDivElement>(null);
    const batteryRef = React.useRef<HTMLDivElement>(null);
    const osRef = React.useRef<HTMLDivElement>(null);
    const warrantyDurationRef = React.useRef<HTMLDivElement>(null);
    const promoPriceRef = React.useRef<HTMLDivElement>(null);

    const scrollToCenter = (container: HTMLElement, target: HTMLElement) => {
        const scrollLeft = target.offsetLeft - container.offsetWidth / 2 + target.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    };

    const smartScroll = (ref: React.RefObject<HTMLElement>) => {
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
    };
    const [customBrand, setCustomBrand] = useState('');
    const [boxItemInput, setBoxItemInput] = useState('');
    const [cloudName] = useState('dfoiugbva');
    const [uploadPreset] = useState('unsigned_preset');

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    // --- Core Operations ---
    const activeProduct = products[activeProductIndex];

    const handleProductChange = (index: number, field: keyof BatchElectronicsProduct, value: any) => {
        setProducts(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files);

        if (products.length === 0) {
            // First time upload, create first product
            const newProduct: BatchElectronicsProduct = {
                id: Math.random().toString(36).substr(2, 9),
                name: '',
                description: '',
                images: newFiles.map((file, i) => ({ file, preview: URL.createObjectURL(file), isMain: i === 0 })),
                price: 0,
                isPromo: false,
                promoPrice: 0,
                categoryId: categories[0]?.id || '',
                quantity: 1,
                limitedStock: false,
                soldOut: false,
                brand: '',
                condition: 'brand-new',
                subtype: 'phone',
                storage: '',
                ram: '',
                batteryCapacity: '',
                color: '',
                network: '',
                os: '',
                imeiVerified: false,
                audioStyle: '',
                anc: false,
                powerOutput: '',
                accessoryType: '',
                compatibleWith: '',
                connectivity: '',
                watchBatteryLife: '',
                watchFeatures: [],
                gamingCategory: '',
                gamingPlatform: '',
                warranty: false,
                warrantyDuration: '',
                whatsInBox: [],
                useAsTemplate: false,
                uploadStatus: 'idle',
                uploadProgress: 0,
            };
            setProducts([newProduct]);
            setCurrentStep(1);
            setActiveProductIndex(0);
        } else {
            // Add images to active product
            const newImages: { file: File, preview: string, isMain?: boolean }[] = newFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
            const currentImages = activeProduct.images || [];
            if (currentImages.length === 0 && newImages.length > 0) newImages[0].isMain = true;
            handleProductChange(activeProductIndex, 'images', [...currentImages, ...newImages]);
        }
    };

    const setMainImage = (prodIndex: number, imgIndex: number) => {
        const prod = products[prodIndex];
        const newImages = prod.images.map((img, i) => ({ ...img, isMain: i === imgIndex }));
        handleProductChange(prodIndex, 'images', newImages);
    };

    const removeImage = (prodIndex: number, imgIndex: number) => {
        const prod = products[prodIndex];
        let newImages = [...prod.images];
        const removedWasMain = newImages[imgIndex].isMain;
        URL.revokeObjectURL(newImages[imgIndex].preview);
        newImages.splice(imgIndex, 1);

        if (removedWasMain && newImages.length > 0) {
            newImages[0].isMain = true;
        }
        handleProductChange(prodIndex, 'images', newImages);
    };

    const createNewDraftFromTemplate = () => {
        const template = products.find(p => p.useAsTemplate) || activeProduct || products[0];
        if (!template) return;

        const newProduct: BatchElectronicsProduct = {
            ...template,
            id: Math.random().toString(36).substr(2, 9),
            images: [],
            name: '',
            useAsTemplate: false,
            uploadStatus: 'idle',
            uploadProgress: 0,
        };
        setProducts(prev => [...prev, newProduct]);
        setActiveProductIndex(products.length);
        setCurrentStep(0);
    };

    // --- Form Handlers ---
    const addBoxItem = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && boxItemInput.trim()) {
            e.preventDefault();
            const current = activeProduct.whatsInBox || [];
            if (!current.includes(boxItemInput.trim())) {
                handleProductChange(activeProductIndex, 'whatsInBox', [...current, boxItemInput.trim()]);
            }
            setBoxItemInput('');
        }
    };

    const removeBoxItem = (itemToRemove: string) => {
        const current = activeProduct.whatsInBox || [];
        handleProductChange(activeProductIndex, 'whatsInBox', current.filter(i => i !== itemToRemove));
    };

    const activeCategoryName = useMemo(() => {
        if (!activeProduct?.categoryId) return 'Uncategorized';
        return categories.find(c => c.id === activeProduct.categoryId)?.name || 'Uncategorized';
    }, [activeProduct?.categoryId, categories]);

    // --- Upload Process ---
    const startProcessing = async () => {
        setCurrentStep(5);

        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            if (product.uploadStatus === 'success') continue;
            handleProductChange(i, 'uploadStatus', 'compressing');

            try {
                // 1. Compression
                const processedImages = [];
                for (let j = 0; j < product.images.length; j++) {
                    const img = product.images[j];
                    const compressed = await compressImage(img.file);
                    processedImages.push({ ...img, compressed });
                }
                handleProductChange(i, 'uploadProgress', 30);

                // 2. Upload to Cloudinary
                handleProductChange(i, 'uploadStatus', 'uploading');
                const uploadedUrls = [];
                for (let j = 0; j < processedImages.length; j++) {
                    const item = processedImages[j];
                    if (item.compressed) {
                        const url = await uploadImageToCloudinary(item.compressed, storeId);
                        uploadedUrls.push({ url, isMain: item.isMain });
                    }
                }
                handleProductChange(i, 'uploadProgress', 70);

                // Sort main image first
                uploadedUrls.sort((a, b) => (a.isMain === b.isMain) ? 0 : a.isMain ? -1 : 1);
                const finalUrls = uploadedUrls.map(u => u.url);

                // 3. Save to Firebase
                handleProductChange(i, 'uploadStatus', 'saving');

                const productData: any = {
                    storeId,
                    name: product.name.trim(),
                    description: product.description.trim() || product.name.trim(),
                    price: product.isPromo ? product.promoPrice : product.price,
                    originalPrice: (product.isPromo && product.promoPrice > 0 && product.promoPrice < product.price) ? product.price : null,
                    images: finalUrls,
                    views: 0,
                    createdAt: serverTimestamp(),

                    productType: 'electronics',
                    subtype: product.subtype,
                    brand: product.brand,
                    condition: product.condition,

                    storage: product.storage,
                    ram: product.ram,
                    batteryCapacity: product.batteryCapacity,
                    color: product.color,
                    network: product.network,
                    os: product.os,
                    imeiVerified: product.imeiVerified,

                    // Audio-specific
                    audioStyle: product.audioStyle || null,
                    anc: product.anc || false,

                    // Power Bank-specific
                    powerOutput: product.powerOutput || null,

                    warranty: product.warranty,
                    warrantyDuration: product.warranty ? product.warrantyDuration : null,
                    whatsInBox: product.whatsInBox,

                    // Accessory-specific
                    accessoryType: product.accessoryType || null,
                    compatibleWith: product.compatibleWith || null,
                    connectivity: product.connectivity || null,

                    // Smartwatch-specific
                    watchBatteryLife: product.watchBatteryLife || null,
                    watchFeatures: product.watchFeatures?.length ? product.watchFeatures : null,

                    // Gaming-specific
                    gamingCategory: product.gamingCategory || null,
                    gamingPlatform: product.gamingPlatform || null,

                    available: true,
                    soldOut: product.soldOut,
                    limitedStock: product.limitedStock,
                    quantity: product.quantity,
                    categoryId: product.categoryId,
                    category: activeCategoryName,
                };

                await addDoc(collection(db, 'stores', storeId, 'products'), productData);
                await updateDoc(doc(db, 'stores', storeId), { productCount: increment(1) });

                handleProductChange(i, 'uploadStatus', 'success');
                handleProductChange(i, 'uploadProgress', 100);

            } catch (err: any) {
                console.error("Error processing product", err);
                handleProductChange(i, 'uploadStatus', 'error');
                handleProductChange(i, 'errorMessage', err.message);
            }
        }

        ProductCache.clear();
        setCurrentStep(6);
        if (onProductAdded) {
            onProductAdded();
        }
    };

    // --- Rendering ---
    const STEPS = [{ name: 'Photos' }, { name: 'Details' }, { name: 'Tech' }, { name: 'Warranty' }, { name: 'Pricing' }];
    const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

    const renderStepContent = () => {
        if (!activeProduct && currentStep > 0) return null;

        switch (currentStep) {
            case 0: // Upload
                return (
                    <motion.div key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        {products.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                                {products.map((p, idx) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setActiveProductIndex(idx)}
                                        className={`relative flex-none w-24 h-24 rounded-2xl border-2 overflow-hidden snap-center transition-all ${activeProductIndex === idx ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100'}`}
                                    >
                                        <Image src={p.images[0]?.preview || '/placeholder.png'} alt="Preview" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="relative group">
                            <input type="file" multiple accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="border-3 border-dashed border-zinc-300 dark:border-zinc-700 rounded-[2rem] p-12 text-center group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-all bg-zinc-50 dark:bg-zinc-800/50">
                                <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera className="w-10 h-10 text-zinc-400 group-hover:text-blue-500" />
                                </div>
                                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tap to upload device photos</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Add clear shots of front, back, and any wear/tear.</p>
                            </div>
                        </div>

                        {activeProduct?.images?.length > 0 && (
                            <div className="mt-8">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 tracking-wide">Device Images</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {activeProduct.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm border border-zinc-200 dark:border-zinc-800">
                                            <Image src={img.preview} alt="Upload" fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                {!img.isMain && (
                                                    <button onClick={() => setMainImage(activeProductIndex, idx)} className="px-3 py-1.5 bg-white text-zinc-900 text-xs font-bold rounded-full hover:scale-105 transition-transform shadow-lg">Main</button>
                                                )}
                                                <button onClick={() => removeImage(activeProductIndex, idx)} className="p-2 bg-red-500 text-white rounded-full hover:scale-105 transition-transform shadow-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                            {img.isMain && (
                                                <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-md">Cover</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                    </motion.div>
                );

            case 1: // Basic Details
                return (
                    <motion.div key={1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FloatingLabelInput label="Gadget Title" value={activeProduct.name} onChange={(e) => handleProductChange(activeProductIndex, 'name', e.target.value)} placeholder="e.g. iPhone 15 Pro Max 256GB" />

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">Store Category</label>
                            <button onClick={() => setCategorySelectorOpen(true)} className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex justify-between items-center hover:border-blue-400 transition-colors">
                                <span className={`font-medium ${activeProduct.categoryId ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>{activeProduct.categoryId ? activeCategoryName : 'Select Category...'}</span>
                                <ChevronRight className="text-zinc-400 w-5 h-5" />
                            </button>
                        </div>

                        {/* Subtype (Moved from Step 2) */}
                        <div ref={deviceTypeRef}>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block pl-1">Device Type</label>
                            <div
                                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x"
                                id="deviceScrollContainer"
                            >
                                {SUBTYPES.map(type => {
                                    const Icon = type.icon;
                                    const isSelected = activeProduct.subtype === type.value;
                                    return (
                                        <button
                                            key={type.value}
                                            onClick={(e) => {
                                                handleProductChange(activeProductIndex, 'subtype', type.value);
                                                const container = document.getElementById('deviceScrollContainer');
                                                if (container) scrollToCenter(container, e.currentTarget);
                                                smartScroll(brandRef);
                                            }}
                                            className={`flex-none px-4 py-3 rounded-xl border flex items-center gap-2 transition-all snap-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                        >
                                            <Icon size={16} />
                                            <span className="font-semibold text-sm">{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div ref={brandRef}>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block pl-1">Brand</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {getBrandOptions(activeProduct.subtype).map(brand => (
                                    <button
                                        key={brand}
                                        onClick={() => { handleProductChange(activeProductIndex, 'brand', brand); setCustomBrand(''); }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeProduct.brand === brand ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    >
                                        {brand}
                                    </button>
                                ))}
                            </div>
                            <FloatingLabelInput
                                label="Other Brand"
                                value={activeProduct.brand && !getBrandOptions(activeProduct.subtype).includes(activeProduct.brand) ? activeProduct.brand : customBrand}
                                onChange={(e) => {
                                    setCustomBrand(e.target.value);
                                    handleProductChange(activeProductIndex, 'brand', e.target.value);
                                }}
                                placeholder="Type brand name..."
                            />
                        </div>

                        <ModernToggle label="Use as Template" description="Apply these details to all other items you upload next" checked={activeProduct.useAsTemplate} onChange={c => handleProductChange(activeProductIndex, 'useAsTemplate', c)} />
                    </motion.div>
                );

            case 2: // Specs
                return (
                    <motion.div key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                        {/* Condition */}
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block pl-1">Item Condition</label>
                            <div className="grid grid-cols-2 gap-3">
                                {CONDITIONS.map(cond => (
                                    <button
                                        key={cond.value}
                                        onClick={() => {
                                            handleProductChange(activeProductIndex, 'condition', cond.value);
                                            smartScroll(descriptionRef);
                                        }}
                                        className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center ${activeProduct.condition === cond.value ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                    >
                                        {cond.label}
                                    </button>
                                ))}
                            </div>
                            {activeProduct.condition !== 'brand-new' && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 px-1 flex items-center gap-1">
                                    <AlertCircle size={12} /> Be sure to describe any wear and tear in the product description.
                                </p>
                            )}
                        </div>

                        <div ref={descriptionRef} className="relative">
                            <textarea
                                value={activeProduct.description}
                                onChange={(e) => {
                                    handleProductChange(activeProductIndex, 'description', e.target.value);
                                    if (e.target.value.length === 1) smartScroll(specsBlockRef);
                                }}
                                rows={4}
                                className="block w-full rounded-xl border-0 py-4 pl-4 pr-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6 placeholder:text-zinc-400"
                                placeholder="Describe Key Features (Optional)"
                            />
                        </div>

                        {/* Conditional Comboboxes for Phones/Laptops/Tablets */}
                        {['phone', 'tablet', 'laptop'].includes(activeProduct.subtype) && (
                            <div ref={specsBlockRef} className="space-y-5 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">

                                <div ref={batteryRef}>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Battery Capacity</label>
                                    <div className="flex flex-wrap gap-2 mb-2" id="batteryContainer">
                                        {getBatteryOptions(activeProduct.subtype).map(opt => (
                                            <button key={opt} onClick={(e) => {
                                                handleProductChange(activeProductIndex, 'batteryCapacity', opt);
                                                scrollToCenter(document.getElementById('batteryContainer')!, e.currentTarget);
                                                smartScroll(storageRef);
                                            }} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.batteryCapacity === opt ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Or type custom capacity..." value={activeProduct.batteryCapacity} onChange={(e) => handleProductChange(activeProductIndex, 'batteryCapacity', e.target.value)} className="w-full text-sm p-2 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-blue-500" />
                                </div>

                                <div ref={storageRef}>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Storage Capacity</label>
                                    <div className="flex flex-wrap gap-2 mb-2" id="storageContainer">
                                        {STORAGE_OPTIONS.map(opt => (
                                            <button key={opt} onClick={(e) => {
                                                handleProductChange(activeProductIndex, 'storage', opt);
                                                scrollToCenter(document.getElementById('storageContainer')!, e.currentTarget);
                                                smartScroll(ramRef);
                                            }} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.storage === opt ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Or type custom storage..." value={activeProduct.storage} onChange={(e) => handleProductChange(activeProductIndex, 'storage', e.target.value)} className="w-full text-sm p-2 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-blue-500" />
                                </div>

                                <div ref={ramRef}>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">RAM</label>
                                    <div className="flex flex-wrap gap-2 mb-2" id="ramContainer">
                                        {RAM_OPTIONS.map(opt => (
                                            <button key={opt} onClick={(e) => {
                                                handleProductChange(activeProductIndex, 'ram', opt);
                                                scrollToCenter(document.getElementById('ramContainer')!, e.currentTarget);
                                            }} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.ram === opt ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Or type custom RAM..." value={activeProduct.ram} onChange={(e) => handleProductChange(activeProductIndex, 'ram', e.target.value)} className="w-full text-sm p-2 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-blue-500" />
                                </div>

                                {['phone', 'tablet'].includes(activeProduct.subtype) && (
                                    <>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Network</label>
                                            <div className="flex gap-2">
                                                {NETWORK_OPTIONS.map(opt => (
                                                    <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'network', opt)} className={`flex-1 py-1.5 rounded-md text-xs font-medium border ${activeProduct.network === opt ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <ModernToggle label="IMEI Verified?" description="Builds trust for used phones" checked={activeProduct.imeiVerified} onChange={c => handleProductChange(activeProductIndex, 'imeiVerified', c)} />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Power Bank Specs */}
                        {activeProduct.subtype === 'powerbank' && (
                            <div className="space-y-5 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Battery Capacity</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {getBatteryOptions('powerbank').map(opt => (
                                            <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'batteryCapacity', opt)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.batteryCapacity === opt ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Or type custom capacity..." value={activeProduct.batteryCapacity} onChange={(e) => handleProductChange(activeProductIndex, 'batteryCapacity', e.target.value)} className="w-full text-sm p-2 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Output Power (Charging Speed)</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {POWER_OUTPUT_OPTIONS.map(opt => (
                                            <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'powerOutput', opt)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.powerOutput === opt ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-500 text-orange-700 dark:text-orange-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Or type custom output..." value={activeProduct.powerOutput} onChange={(e) => handleProductChange(activeProductIndex, 'powerOutput', e.target.value)} className="w-full text-sm p-2 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-blue-500" />
                                </div>
                            </div>
                        )}

                        {/* Audio Specs */}
                        {activeProduct.subtype === 'audio' && (
                            <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Audio Style</label>
                                    <div className="flex flex-wrap gap-2">
                                        {AUDIO_STYLES.map(opt => (
                                            <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'audioStyle', opt)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.audioStyle === opt ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500 text-purple-700 dark:text-purple-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <ModernToggle label="Active Noise Cancellation (ANC)" description="Does this product support ANC?" checked={activeProduct.anc} onChange={c => handleProductChange(activeProductIndex, 'anc', c)} />
                            </div>
                        )}

                        {/* Accessory Specs */}
                        {activeProduct.subtype === 'accessory' && (
                            <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Accessory Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ACCESSORY_TYPES.map(opt => (
                                            <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'accessoryType', opt)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.accessoryType === opt ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-500 text-teal-700 dark:text-teal-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Connectivity</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CONNECTIVITY_OPTIONS.map(opt => (
                                            <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'connectivity', opt)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.connectivity === opt ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-500 text-teal-700 dark:text-teal-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <FloatingLabelInput label="Compatible With (Optional)" value={activeProduct.compatibleWith} onChange={(e) => handleProductChange(activeProductIndex, 'compatibleWith', e.target.value)} placeholder="e.g. iPhone 15 Pro, Samsung Galaxy S24" />
                            </div>
                        )}

                        {/* Smartwatch / Watch Specs */}
                        {activeProduct.subtype === 'smartwatch' && (
                            <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Battery Life</label>
                                    <div className="flex flex-wrap gap-2">
                                        {WATCH_BATTERY_OPTIONS.map(opt => (
                                            <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'watchBatteryLife', opt)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.watchBatteryLife === opt ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Health & Fitness Features</label>
                                    <p className="text-xs text-zinc-400 mb-2">Tap to toggle — select all that apply</p>
                                    <div className="flex flex-wrap gap-2">
                                        {WATCH_FEATURES.map(feat => {
                                            const selected = activeProduct.watchFeatures?.includes(feat);
                                            return (
                                                <button key={feat} onClick={() => {
                                                    const current = activeProduct.watchFeatures || [];
                                                    const updated = selected ? current.filter(f => f !== feat) : [...current, feat];
                                                    handleProductChange(activeProductIndex, 'watchFeatures', updated);
                                                }} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${selected ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{feat}</button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Connectivity</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Bluetooth', 'Wi-Fi', 'LTE / Cellular', 'NFC'].map(opt => (
                                            <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'connectivity', opt)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.connectivity === opt ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gaming Specs */}
                        {activeProduct.subtype === 'gaming' && (
                            <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Gaming Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {GAMING_CATEGORIES.map(opt => (
                                            <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'gamingCategory', opt)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${activeProduct.gamingCategory === opt ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-700 dark:text-rose-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mb-2">Compatible Platform</label>
                                    <p className="text-xs text-zinc-400 mb-2">Tap to toggle — select all that apply</p>
                                    <div className="flex flex-wrap gap-2">
                                        {GAMING_PLATFORMS.map(platform => {
                                            const selected = activeProduct.gamingPlatform?.includes(platform);
                                            return (
                                                <button key={platform} onClick={() => {
                                                    // Store as comma-separated string for simplicity
                                                    const current = activeProduct.gamingPlatform ? activeProduct.gamingPlatform.split(', ').filter(Boolean) : [];
                                                    const updated = selected ? current.filter(p => p !== platform) : [...current, platform];
                                                    handleProductChange(activeProductIndex, 'gamingPlatform', updated.join(', '));
                                                }} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${selected ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-700 dark:text-rose-300' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{platform}</button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <FloatingLabelInput label="Color (Optional)" value={activeProduct.color} onChange={(e) => handleProductChange(activeProductIndex, 'color', e.target.value)} placeholder="e.g. Midnight Black" />



                        <div ref={osRef}>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">Operating System</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {getOSOptions(activeProduct.subtype).map(opt => (
                                    <button key={opt} onClick={() => handleProductChange(activeProductIndex, 'os', opt)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeProduct.os === opt ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{opt}</button>
                                ))}
                            </div>
                            <input type="text" placeholder="Or type OS (e.g. Windows 11)..." value={activeProduct.os} onChange={(e) => handleProductChange(activeProductIndex, 'os', e.target.value)} className="w-full text-sm p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-blue-500 transition-all shadow-sm" />
                        </div>

                    </motion.div>
                );

            case 3: // Warranty & Extras
                return (
                    <motion.div key={3} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                        <div className="bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <ModernToggle label="Includes Warranty?" checked={activeProduct.warranty} onChange={c => { handleProductChange(activeProductIndex, 'warranty', c); if (c) smartScroll(warrantyDurationRef); }} />
                            <AnimatePresence>
                                {activeProduct.warranty && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div ref={warrantyDurationRef} className="p-4 pt-0 space-y-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                                            <div>
                                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">Warranty Duration</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {WARRANTY_DURATIONS.map(dur => (
                                                        <button key={dur} onClick={() => handleProductChange(activeProductIndex, 'warrantyDuration', dur)} className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${activeProduct.warrantyDuration === dur ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>{dur}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">What's in the Box?</label>
                            <p className="text-xs text-zinc-400 mb-3 pl-1">Type an item and press Enter. (e.g., Phone, Charger, Case)</p>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {activeProduct.whatsInBox?.map(item => (
                                    <div key={item} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item}</span>
                                        <button onClick={() => removeBoxItem(item)} className="text-zinc-400 hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>

                            <FloatingLabelInput label="Add item..." value={boxItemInput} onChange={(e) => setBoxItemInput(e.target.value)} />
                            {/* Hidden enter handler, input handles it via onKeyDown conceptually, but let's wire it directly: */}
                            <div className="hidden">
                                {/* Simple hack to bind keydown to state change since FloatingLabelInput doesn't expose it directly in this simplified version. We'll just rely on a button below instead for safety. */}
                            </div>
                            <button onClick={() => {
                                if (boxItemInput.trim()) {
                                    const current = activeProduct.whatsInBox || [];
                                    if (!current.includes(boxItemInput.trim())) handleProductChange(activeProductIndex, 'whatsInBox', [...current, boxItemInput.trim()]);
                                    setBoxItemInput('');
                                }
                            }} className="mt-2 text-sm text-blue-600 font-semibold px-2 py-1 bg-blue-50 rounded-lg">+ Add Item</button>
                        </div>

                    </motion.div>
                );

            case 4: // Pricing
                return (
                    <motion.div key={4} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FloatingLabelInput label="Current Selling Price" type="number" prefix="₦" value={activeProduct.price === 0 ? '' : activeProduct.price} onChange={(e) => handleProductChange(activeProductIndex, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))} />

                        <div className="bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <ModernToggle label="Run a Promotion?" description="Set a discounted price" checked={activeProduct.isPromo} onChange={c => handleProductChange(activeProductIndex, 'isPromo', c)} />
                            <AnimatePresence>
                                {activeProduct.isPromo && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div ref={promoPriceRef} className="p-4 pt-0 mt-2">
                                            <FloatingLabelInput label="Promo Price" type="number" prefix="₦" value={activeProduct.promoPrice === 0 ? '' : activeProduct.promoPrice} onChange={(e) => handleProductChange(activeProductIndex, 'promoPrice', e.target.value === '' ? 0 : parseFloat(e.target.value))} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="w-full max-w-xs">
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">Quantity Available</label>
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2 border border-zinc-200 dark:border-zinc-700 w-full overflow-hidden">
                                <button onClick={() => handleProductChange(activeProductIndex, 'quantity', Math.max(1, activeProduct.quantity - 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex-shrink-0 flex items-center justify-center font-bold text-xl hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors">-</button>
                                <input type="number" value={activeProduct.quantity} onChange={(e) => handleProductChange(activeProductIndex, 'quantity', Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 min-w-0 text-center bg-transparent border-none font-bold text-lg focus:ring-0" />
                                <button onClick={() => handleProductChange(activeProductIndex, 'quantity', activeProduct.quantity + 1)} className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex-shrink-0 flex items-center justify-center font-bold text-xl hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors">+</button>
                            </div>
                            {activeProduct.condition !== 'brand-new' && activeProduct.quantity > 1 && (
                                <p className="text-xs text-orange-500 mt-2 flex items-center gap-1"><AlertCircle size={12} /> Used items are usually single quantity.</p>
                            )}
                        </div>

                        <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                            <ModernToggle label="Limited Stock Warning" checked={activeProduct.limitedStock} onChange={c => handleProductChange(activeProductIndex, 'limitedStock', c)} />
                            <ModernToggle label="Mark as Sold Out" checked={activeProduct.soldOut} onChange={c => handleProductChange(activeProductIndex, 'soldOut', c)} />
                        </div>
                    </motion.div>
                );

            case 5: // Processing
                return (
                    <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-12 flex flex-col items-center justify-center space-y-6">
                        <div className="w-20 h-20 border-4 border-zinc-100 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin"></div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Processing Uploads</h3>

                        <div className="w-full max-w-sm space-y-4">
                            {products.map((p, i) => (
                                <div key={p.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">{p.name || `Item ${i + 1}`}</span>
                                        <span className="text-xs font-bold uppercase text-zinc-500">{p.uploadStatus}</span>
                                    </div>
                                    <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${p.uploadStatus === 'error' ? 'bg-red-500' : p.uploadStatus === 'success' ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${p.uploadProgress}%` }}></div>
                                    </div>
                                    {p.errorMessage && <p className="text-xs text-red-500 mt-2">{p.errorMessage}</p>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 6: // Success
                const hasErrors = products.some(p => p.uploadStatus === 'error');
                return (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16 text-center space-y-6">
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${hasErrors ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            {hasErrors ? <AlertCircle className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
                        </div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
                            {hasErrors ? 'Almost There!' : 'All Done!'}
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                            {hasErrors ? 'Some items failed to upload.' : 'Your gadgets are now live.'}
                        </p>
                    </motion.div>
                );

            default: return null;
        }
    };

    // --- Validation ---
    const isStepValid = () => {
        if (!activeProduct) return false;
        if (currentStep === 0) return activeProduct.images.length > 0;
        if (currentStep === 1) return activeProduct.name.trim().length > 0 && activeProduct.brand.trim().length > 0 && activeProduct.categoryId;
        if (currentStep === 2) return true; // condition/description/specs/os/color
        if (currentStep === 3) return !activeProduct.warranty || (activeProduct.warranty && activeProduct.warrantyDuration);
        if (currentStep === 4) return activeProduct.price > 0 && (!activeProduct.isPromo || (activeProduct.promoPrice > 0 && activeProduct.promoPrice < activeProduct.price));
        return true;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                    initial="hidden" animate="visible" exit="exit"
                    variants={modalVariants}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                >
                    {/* --- Header --- */}
                    <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg z-10 sticky top-0">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {currentStep === 5 ? 'Uploading...' : currentStep === 6 ? 'Success' : 'Add Gadgets'}
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {currentStep < 5 ? `Step ${currentStep + 1} of ${STEPS.length}` : ''}
                                    {products.length > 1 && currentStep > 0 && currentStep < 5 ? ` · Item ${activeProductIndex + 1} of ${products.length}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                    </header>

                    {/* --- Progress Bar --- */}
                    {currentStep < 5 && (
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1">
                            <motion.div
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1"
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
                    <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10">
                        <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
                        <div className="max-w-5xl mx-auto flex gap-4">
                            {/* Step 0: Cancel + Next (or just Cancel if no images) */}
                            {currentStep === 0 && (
                                <>
                                    <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                        Cancel
                                    </button>
                                    {products.length > 0 && activeProduct?.images?.length > 0 && (
                                        <button onClick={() => setCurrentStep(1)} className="flex-1 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
                                            Next <ChevronRight className="w-5 h-5" />
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Steps 1-3: Back + Next */}
                            {currentStep > 0 && currentStep < 4 && (
                                <>
                                    <button onClick={() => setCurrentStep(s => s - 1)} className="flex-1 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                                        <ChevronLeft className="w-5 h-5" /> Back
                                    </button>
                                    <button
                                        onClick={() => setCurrentStep(s => s + 1)}
                                        disabled={!isStepValid()}
                                        className="flex-1 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                    >
                                        Next <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            {/* Step 4: Back + Upload */}
                            {currentStep === 4 && (
                                <>
                                    <button onClick={() => setCurrentStep(s => s - 1)} className="flex-1 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                                        <ChevronLeft className="w-5 h-5" /> Back
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (activeProductIndex < products.length - 1) {
                                                setActiveProductIndex(prev => prev + 1);
                                                setCurrentStep(1);
                                            } else {
                                                startProcessing();
                                            }
                                        }}
                                        disabled={!isStepValid()}
                                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {activeProductIndex === products.length - 1 ? 'Upload' : 'Next Item'} <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            {/* Step 6 (Success): Close + Add Another */}
                            {currentStep === 6 && (
                                <>
                                    <button onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                        Close
                                    </button>
                                    <button onClick={() => { setProducts([]); setCurrentStep(0); setActiveProductIndex(0); }} className="flex-1 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-opacity shadow-lg">
                                        Add Another
                                    </button>
                                </>
                            )}
                        </div>
                    </footer>

                    {/* Batch add button (floating above footer on step 0) */}
                    {currentStep === 0 && products.length > 0 && activeProduct?.images?.length > 0 && (
                        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-2 -mt-2">
                            <button onClick={createNewDraftFromTemplate} className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-bold px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors w-full">
                                <Plus className="w-5 h-5" /> Add Another Item to Batch
                            </button>
                        </div>
                    )}

                    <CategorySelectorModal
                        isOpen={isCategorySelectorOpen}
                        onClose={() => setCategorySelectorOpen(false)}
                        categories={categories}
                        selectedCategoryId={activeProduct?.categoryId}
                        onSelect={(catId) => { handleProductChange(activeProductIndex, 'categoryId', catId); setCategorySelectorOpen(false); }}
                        onAddCategory={onAddCategory}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
