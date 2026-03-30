'use client';
import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Sun, Zap, Battery, Cpu, Tv, Wind, Package, Loader2, Gauge, X } from 'lucide-react';
import Image from 'next/image';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { compressImage } from '../../utils/imageCompression';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { ProductCache } from '../../lib/productCache';
import CategorySelectorModal from './modals/CategorySelectorModal';

// --- Shared Helper Components ---

const ModernToggle = ({ label, description, checked, onChange }: { label: string, description?: string, checked: boolean, onChange: (c: boolean) => void }) => (
    <label className="flex items-center cursor-pointer justify-between w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:border-amber-200 dark:hover:border-amber-900/50">
        <div className="flex flex-col flex-1 pr-4">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
            {description && <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</span>}
        </div>
        <div className="relative shrink-0">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-12 h-7 rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
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
                className={`block w-full rounded-xl border-0 py-4 ${prefix ? 'pl-8' : 'pl-4'} pr-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 placeholder:text-transparent focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6 transition-all peer`}
                placeholder={placeholder || label}
            />
            <label
                htmlFor={inputId}
                className="absolute left-4 -top-2.5 bg-white dark:bg-zinc-900 px-1 text-xs font-medium text-amber-600 dark:text-amber-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-amber-600 pointer-events-none"
            >
                {label}
            </label>
        </div>
    );
};

// --- Core Data Structures ---

export interface BatchSolarProduct {
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

    // Solar Specifics
    brand: string;
    condition: 'brand-new' | 'open-box' | 'used-good' | 'used-fair' | 'refurbished';
    subtype: 'solar-panels' | 'inverters' | 'batteries' | 'charge-controllers' | 'dc-appliances' | 'ac-appliances' | 'solar-kits' | 'accessories';

    // Panels
    wattage: string;
    cellType: string;
    nominalVoltage: string;
    efficiencyRating: string;

    // Inverters
    powerCapacity: string;
    inverterType: string;
    systemVoltage: string;
    smartFeatures: boolean;

    // Batteries
    batteryCapacity: string;
    batteryChemistry: string;
    lifeCycles: string;
    depthOfDischarge: string;

    // Charge Controllers
    controllerType: string;
    maxCurrentRating: string;
    maxPvInputVoltage: string;

    // Appliances
    applianceCategory: string;
    operatingVoltage: string;
    powerConsumption: string;
    directSolarConnect: boolean;
    energyStarRating: string;
    inverterCompressor: boolean;

    // Kits
    totalSystemCapacity: string;
    estimatedDailyYield: string;
    componentsIncluded: string[];

    warranty: boolean;
    warrantyDuration: string;
    whatsInBox: string[];
    bulkPurchasing: boolean;
    installationIncluded: boolean;

    useAsTemplate: boolean;
    uploadStatus: 'idle' | 'compressing' | 'uploading' | 'saving' | 'success' | 'error';
    uploadProgress: number;
    errorMessage?: string;
}

const SOLAR_BRANDS = [
    'Felicity', 'Luminous', 'Sun King', 'Deye', 'Growatt', 'Jinko', 'Canadian Solar', 'Longi', 'JA Solar', 'Trina Solar', 'Victron', 'Must', 'Prag', 'Schneider', 'Sukam', 'Gamatronic', 'Quattro', 'Huawei'
];

const PANEL_CELL_TYPES = ['Monocrystalline', 'Polycrystalline', 'Thin-Film', 'Bifacial'];
const INVERTER_TYPES = ['Pure Sine Wave', 'Modified Sine Wave', 'Hybrid', 'Grid-Tied', 'Microinverter', 'Off-Grid'];
const BATTERY_CHEMISTRIES = ['Lithium Iron Phosphate (LiFePO4)', 'Lithium-Ion', 'Tubular / Tall Tubular', 'Sealed Lead Acid (SLA)', 'Gel', 'Deep Cycle'];
const CONTROLLER_TYPES = ['MPPT', 'PWM'];
const APPLIANCE_CATEGORIES = ['TV', 'Fan', 'Fridge/Freezer', 'Lighting', 'Water Pump', 'Inverter AC', 'Washing Machine', 'Iron'];
const VOLTAGE_OPTIONS = ['12V', '24V', '48V', '96V', '220V AC'];
const SUBTYPES = [
    { value: 'solar-panels', label: 'Panels', icon: Sun },
    { value: 'inverters', label: 'Inverters', icon: Zap },
    { value: 'batteries', label: 'Batteries', icon: Battery },
    { value: 'charge-controllers', label: 'Controllers', icon: Cpu },
    { value: 'dc-appliances', label: 'DC Appliances', icon: Tv },
    { value: 'ac-appliances', label: 'Efficient AC', icon: Wind },
    { value: 'solar-kits', label: 'Solar Kits', icon: Package },
    { value: 'accessories', label: 'Accessories', icon: Gauge },
];

const CONDITIONS = [
    { value: 'brand-new', label: '🆕 Brand New' },
    { value: 'open-box', label: '✨ Open Box' },
    { value: 'used-good', label: '👍 Used (Good)' },
    { value: 'used-fair', label: '⚠️ Used (Fair)' },
    { value: 'refurbished', label: '🔧 Refurbished' },
];

export default function AddSolarProductComposer({
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
    const [products, setProducts] = useState<BatchSolarProduct[]>([]);
    const [activeProductIndex, setActiveProductIndex] = useState<number>(0);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
    const [customBrand, setCustomBrand] = useState('');
    const [boxItemInput, setBoxItemInput] = useState('');
    const [componentInput, setComponentInput] = useState('');

    const activeProduct = products[activeProductIndex];

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    const handleProductChange = (index: number, field: keyof BatchSolarProduct, value: any) => {
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
            const newProduct: BatchSolarProduct = {
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
                subtype: 'solar-panels',
                wattage: '',
                cellType: '',
                nominalVoltage: '',
                efficiencyRating: '',
                powerCapacity: '',
                inverterType: '',
                systemVoltage: '',
                smartFeatures: false,
                batteryCapacity: '',
                batteryChemistry: '',
                lifeCycles: '',
                depthOfDischarge: '',
                controllerType: '',
                maxCurrentRating: '',
                maxPvInputVoltage: '',
                applianceCategory: '',
                operatingVoltage: '',
                powerConsumption: '',
                directSolarConnect: false,
                energyStarRating: '',
                inverterCompressor: false,
                totalSystemCapacity: '',
                estimatedDailyYield: '',
                componentsIncluded: [],
                warranty: true,
                warrantyDuration: '',
                whatsInBox: [],
                bulkPurchasing: false,
                installationIncluded: false,
                useAsTemplate: false,
                uploadStatus: 'idle',
                uploadProgress: 0,
            };
            setProducts([newProduct]);
            setCurrentStep(1);
            setActiveProductIndex(0);
        } else {
            const newImages = newFiles.map(file => ({ file, preview: URL.createObjectURL(file), isMain: false }));
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
        if (removedWasMain && newImages.length > 0) newImages[0].isMain = true;
        handleProductChange(prodIndex, 'images', newImages);
    };

    const activeCategoryName = useMemo(() => {
        if (!activeProduct?.categoryId) return 'Uncategorized';
        return categories.find(c => c.id === activeProduct.categoryId)?.name || 'Uncategorized';
    }, [activeProduct?.categoryId, categories]);

    const startProcessing = async () => {
        setCurrentStep(5);
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            if (product.uploadStatus === 'success') continue;
            handleProductChange(i, 'uploadStatus', 'compressing');

            try {
                const processedImages = [];
                for (let j = 0; j < product.images.length; j++) {
                    const img = product.images[j];
                    const compressed = await compressImage(img.file);
                    processedImages.push({ ...img, compressed });
                }
                handleProductChange(i, 'uploadProgress', 30);

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

                uploadedUrls.sort((a, b) => (a.isMain === b.isMain) ? 0 : a.isMain ? -1 : 1);
                const finalUrls = uploadedUrls.map(u => u.url);

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
                    productType: 'solar',
                    subtype: product.subtype,
                    brand: product.brand,
                    condition: product.condition,
                    warranty: product.warranty,
                    warrantyDuration: product.warranty ? product.warrantyDuration : null,
                    whatsInBox: product.whatsInBox,
                    bulkPurchasing: product.bulkPurchasing,
                    available: true,
                    soldOut: product.soldOut,
                    limitedStock: product.limitedStock,
                    quantity: product.quantity,
                    categoryId: product.categoryId,
                    category: activeCategoryName,
                };

                // Add subtype specific fields
                if (product.subtype === 'solar-panels') {
                    productData.wattage = product.wattage;
                    productData.cellType = product.cellType;
                    productData.nominalVoltage = product.nominalVoltage;
                    productData.efficiencyRating = product.efficiencyRating;
                } else if (product.subtype === 'inverters') {
                    productData.powerCapacity = product.powerCapacity;
                    productData.inverterType = product.inverterType;
                    productData.systemVoltage = product.systemVoltage;
                    productData.smartFeatures = product.smartFeatures;
                } else if (product.subtype === 'batteries') {
                    productData.batteryCapacity = product.batteryCapacity;
                    productData.batteryChemistry = product.batteryChemistry;
                    productData.lifeCycles = product.lifeCycles;
                    productData.depthOfDischarge = product.depthOfDischarge;
                } else if (product.subtype === 'charge-controllers') {
                    productData.controllerType = product.controllerType;
                    productData.maxCurrentRating = product.maxCurrentRating;
                    productData.maxPvInputVoltage = product.maxPvInputVoltage;
                } else if (product.subtype === 'dc-appliances' || product.subtype === 'ac-appliances') {
                    productData.applianceCategory = product.applianceCategory;
                    productData.operatingVoltage = product.operatingVoltage;
                    productData.powerConsumption = product.powerConsumption;
                    productData.directSolarConnect = product.directSolarConnect;
                    productData.energyStarRating = product.energyStarRating;
                    productData.inverterCompressor = product.inverterCompressor;
                } else if (product.subtype === 'solar-kits') {
                    productData.totalSystemCapacity = product.totalSystemCapacity;
                    productData.estimatedDailyYield = product.estimatedDailyYield;
                    productData.componentsIncluded = product.componentsIncluded;
                    productData.installationIncluded = product.installationIncluded;
                }

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
        if (onProductAdded) onProductAdded();
    };

    const STEPS = [{ name: 'Photos' }, { name: 'Details' }, { name: 'Specs' }, { name: 'Warranty' }, { name: 'Pricing' }];
    const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

    const renderStepContent = () => {
        if (!activeProduct && currentStep > 0) return null;

        switch (currentStep) {
            case 0: // Photos
                return (
                    <motion.div key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="relative group">
                            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="border-3 border-dashed border-zinc-300 dark:border-zinc-700 rounded-[2rem] p-12 text-center group-hover:border-amber-500 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/10 transition-all bg-zinc-50 dark:bg-zinc-800/50">
                                <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera className="w-10 h-10 text-zinc-400 group-hover:text-amber-500" />
                                </div>
                                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Upload Solar Equipment Photos</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Add clear shots of the product and its specification sheet label.</p>
                            </div>
                        </div>

                        {activeProduct?.images?.length > 0 && (
                            <div className="mt-8">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 tracking-wide">Selected Images</h4>
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
                                                <span className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-md">Cover</span>
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
                        <FloatingLabelInput label="Product Title" value={activeProduct.name} onChange={(e) => handleProductChange(activeProductIndex, 'name', e.target.value)} placeholder="e.g. Felicity 5kVA Hybrid Inverter" />
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">Store Category</label>
                            <button onClick={() => setCategorySelectorOpen(true)} className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex justify-between items-center hover:border-amber-400 transition-colors">
                                <span className={`font-medium ${activeProduct.categoryId ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>{activeProduct.categoryId ? activeCategoryName : 'Select Category...'}</span>
                                <ChevronRight className="text-zinc-400 w-5 h-5" />
                            </button>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block pl-1">Solar Category</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {SUBTYPES.map(type => {
                                    const Icon = type.icon;
                                    const isSelected = activeProduct.subtype === type.value;
                                    return (
                                        <button
                                            key={type.value}
                                            onClick={() => handleProductChange(activeProductIndex, 'subtype', type.value)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                        >
                                            <Icon size={24} className="mb-2" />
                                            <span className="font-semibold text-[10px] text-center">{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block pl-1">Brand</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {SOLAR_BRANDS.map(brand => (
                                    <button
                                        key={brand}
                                        onClick={() => { handleProductChange(activeProductIndex, 'brand', brand); setCustomBrand(''); }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeProduct.brand === brand ? 'bg-amber-500 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    >
                                        {brand}
                                    </button>
                                ))}
                            </div>
                            <FloatingLabelInput label="Other Brand" value={activeProduct.brand && !SOLAR_BRANDS.includes(activeProduct.brand) ? activeProduct.brand : customBrand} onChange={(e) => { setCustomBrand(e.target.value); handleProductChange(activeProductIndex, 'brand', e.target.value); }} />
                        </div>
                    </motion.div>
                );

            case 2: // Tech Specs
                return (
                    <motion.div key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block pl-1">Condition</label>
                            <div className="grid grid-cols-2 gap-3">
                                {CONDITIONS.map(cond => (
                                    <button
                                        key={cond.value}
                                        onClick={() => handleProductChange(activeProductIndex, 'condition', cond.value)}
                                        className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center ${activeProduct.condition === cond.value ?
                                            (cond.value === 'brand-new' ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 text-zinc-700 dark:text-zinc-300' :
                                                cond.value === 'used-good' ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400' :
                                                    cond.value === 'used-fair' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-400' :
                                                        'bg-amber-50 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400')
                                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm'}`}
                                    >
                                        {cond.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamics Tech Specs based on Subtype */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl space-y-4 border border-zinc-100 dark:border-zinc-800">
                            {activeProduct.subtype === 'solar-panels' && (
                                <>
                                    <FloatingLabelInput label="Wattage (W)" value={activeProduct.wattage} onChange={e => handleProductChange(activeProductIndex, 'wattage', e.target.value)} placeholder="e.g. 550W" />
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block">Cell Type</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PANEL_CELL_TYPES.map(type => (
                                                <button key={type} onClick={() => handleProductChange(activeProductIndex, 'cellType', type)} className={`px-3 py-1.5 rounded-lg border text-xs ${activeProduct.cellType === type ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>{type}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <FloatingLabelInput label="Efficiency Rating (%)" value={activeProduct.efficiencyRating} onChange={e => handleProductChange(activeProductIndex, 'efficiencyRating', e.target.value)} placeholder="e.g. 21.3%" />
                                </>
                            )}

                            {activeProduct.subtype === 'inverters' && (
                                <>
                                    <FloatingLabelInput label="Power Capacity (kVA/kW)" value={activeProduct.powerCapacity} onChange={e => handleProductChange(activeProductIndex, 'powerCapacity', e.target.value)} placeholder="e.g. 5kVA or 10kW" />
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block">Inverter Type</label>
                                        <div className="flex flex-wrap gap-2">
                                            {INVERTER_TYPES.map(type => (
                                                <button key={type} onClick={() => handleProductChange(activeProductIndex, 'inverterType', type)} className={`px-3 py-1.5 rounded-lg border text-xs ${activeProduct.inverterType === type ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>{type}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block">System DC Voltage</label>
                                        <div className="flex flex-wrap gap-2">
                                            {VOLTAGE_OPTIONS.filter(v => v !== '220V AC').map(v => (
                                                <button key={v} onClick={() => handleProductChange(activeProductIndex, 'systemVoltage', v)} className={`px-3 py-1.5 rounded-lg border text-xs ${activeProduct.systemVoltage === v ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <ModernToggle label="Smart Monitoring" description="Does it have WiFi/Mobile App support?" checked={activeProduct.smartFeatures} onChange={c => handleProductChange(activeProductIndex, 'smartFeatures', c)} />
                                </>
                            )}

                            {activeProduct.subtype === 'batteries' && (
                                <>
                                    <FloatingLabelInput label="Battery Capacity (Ah/kWh)" value={activeProduct.batteryCapacity} onChange={e => handleProductChange(activeProductIndex, 'batteryCapacity', e.target.value)} placeholder="e.g. 200Ah or 5kWh" />
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block">Chemistry</label>
                                        <div className="flex flex-wrap gap-2">
                                            {BATTERY_CHEMISTRIES.map(c => (
                                                <button key={c} onClick={() => handleProductChange(activeProductIndex, 'batteryChemistry', c)} className={`px-3 py-1.5 rounded-lg border text-xs ${activeProduct.batteryChemistry === c ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>{c}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <FloatingLabelInput label="Life Cycles" value={activeProduct.lifeCycles} onChange={e => handleProductChange(activeProductIndex, 'lifeCycles', e.target.value)} placeholder="e.g. 6000 cycles" />
                                    <FloatingLabelInput label="Depth of Discharge (%)" value={activeProduct.depthOfDischarge} onChange={e => handleProductChange(activeProductIndex, 'depthOfDischarge', e.target.value)} placeholder="e.g. 80%" />
                                </>
                            )}

                            {activeProduct.subtype === 'charge-controllers' && (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block">Tech Type</label>
                                        <div className="flex gap-2">
                                            {CONTROLLER_TYPES.map(type => (
                                                <button key={type} onClick={() => handleProductChange(activeProductIndex, 'controllerType', type)} className={`flex-1 py-1.5 rounded-lg border text-xs ${activeProduct.controllerType === type ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>{type}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <FloatingLabelInput label="Max Charging Current (A)" value={activeProduct.maxCurrentRating} onChange={e => handleProductChange(activeProductIndex, 'maxCurrentRating', e.target.value)} placeholder="e.g. 60A" />
                                    <FloatingLabelInput label="Max PV Input (Voc)" value={activeProduct.maxPvInputVoltage} onChange={e => handleProductChange(activeProductIndex, 'maxPvInputVoltage', e.target.value)} placeholder="e.g. 150V" />
                                </>
                            )}

                            {(activeProduct.subtype === 'dc-appliances' || activeProduct.subtype === 'ac-appliances') && (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block">Appliance Type</label>
                                        <div className="flex flex-wrap gap-2">
                                            {APPLIANCE_CATEGORIES.map(cat => (
                                                <button key={cat} onClick={() => handleProductChange(activeProductIndex, 'applianceCategory', cat)} className={`px-3 py-1.5 rounded-lg border text-xs ${activeProduct.applianceCategory === cat ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>{cat}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block">Operating Voltage</label>
                                        <div className="flex flex-wrap gap-2">
                                            {VOLTAGE_OPTIONS.map(v => (
                                                <button key={v} onClick={() => handleProductChange(activeProductIndex, 'operatingVoltage', v)} className={`px-3 py-1.5 rounded-lg border text-xs ${activeProduct.operatingVoltage === v ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <FloatingLabelInput label="Power Consumption (Watts)" value={activeProduct.powerConsumption} onChange={e => handleProductChange(activeProductIndex, 'powerConsumption', e.target.value)} placeholder="e.g. 65W" />
                                    {activeProduct.subtype === 'dc-appliances' && <ModernToggle label="Direct Solar Connect" description="Can it run directly from a panel?" checked={activeProduct.directSolarConnect} onChange={c => handleProductChange(activeProductIndex, 'directSolarConnect', c)} />}
                                    {activeProduct.subtype === 'ac-appliances' && <ModernToggle label="Inverter Compressor" description="Uses energy efficient inverter tech" checked={activeProduct.inverterCompressor} onChange={c => handleProductChange(activeProductIndex, 'inverterCompressor', c)} />}
                                </>
                            )}

                            {activeProduct.subtype === 'solar-kits' && (
                                <>
                                    <FloatingLabelInput label="Total System Capacity" value={activeProduct.totalSystemCapacity} onChange={e => handleProductChange(activeProductIndex, 'totalSystemCapacity', e.target.value)} placeholder="e.g. 1kW Off-Grid" />
                                    <FloatingLabelInput label="Est. Daily Yield (kWh)" value={activeProduct.estimatedDailyYield} onChange={e => handleProductChange(activeProductIndex, 'estimatedDailyYield', e.target.value)} placeholder="e.g. 4kWh/day" />
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block">Components Included</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {activeProduct.componentsIncluded.map(item => (
                                                <span key={item} className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-[10px] border border-amber-200">
                                                    {item}
                                                    <X size={10} className="cursor-pointer" onClick={() => handleProductChange(activeProductIndex, 'componentsIncluded', activeProduct.componentsIncluded.filter(i => i !== item))} />
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" value={componentInput} onChange={e => setComponentInput(e.target.value)} onKeyDown={e => {
                                                if (e.key === 'Enter' && componentInput.trim()) {
                                                    e.preventDefault();
                                                    handleProductChange(activeProductIndex, 'componentsIncluded', [...activeProduct.componentsIncluded, componentInput.trim()]);
                                                    setComponentInput('');
                                                }
                                            }} placeholder="Add component (Inverter, Panel...)" className="flex-1 text-xs p-2 rounded-lg border border-zinc-200 bg-white" />
                                            <button onClick={() => { if (componentInput.trim()) { handleProductChange(activeProductIndex, 'componentsIncluded', [...activeProduct.componentsIncluded, componentInput.trim()]); setComponentInput(''); } }} className="p-2 bg-amber-500 text-white rounded-lg"><Plus size={16} /></button>
                                        </div>
                                    </div>
                                    <ModernToggle label="Installation Included" checked={activeProduct.installationIncluded} onChange={c => handleProductChange(activeProductIndex, 'installationIncluded', c)} />
                                </>
                            )}
                        </div>

                        <textarea value={activeProduct.description} onChange={e => handleProductChange(activeProductIndex, 'description', e.target.value)} rows={4} className="block w-full rounded-xl border-0 py-4 px-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-amber-500 sm:text-sm placeholder:text-zinc-400" placeholder="Product Description & Highlights" />
                    </motion.div>
                );

            case 3: // Warranty
                return (
                    <motion.div key={3} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <ModernToggle label="Includes Warranty?" description="Critical for trust in solar equipment" checked={activeProduct.warranty} onChange={c => handleProductChange(activeProductIndex, 'warranty', c)} />
                        {activeProduct.warranty && (
                            <FloatingLabelInput label="Warranty Duration" value={activeProduct.warrantyDuration} onChange={e => handleProductChange(activeProductIndex, 'warrantyDuration', e.target.value)} placeholder="e.g. 5 Years for Inverter, 25 Years for Panels" />
                        )}

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">What's in the Box?</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {activeProduct.whatsInBox?.map(item => (
                                    <div key={item} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item}</span>
                                        <button onClick={() => handleProductChange(activeProductIndex, 'whatsInBox', activeProduct.whatsInBox.filter(i => i !== item))} className="text-zinc-400 hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={boxItemInput} onChange={e => setBoxItemInput(e.target.value)} onKeyDown={e => {
                                    if (e.key === 'Enter' && boxItemInput.trim()) {
                                        e.preventDefault();
                                        handleProductChange(activeProductIndex, 'whatsInBox', [...(activeProduct.whatsInBox || []), boxItemInput.trim()]);
                                        setBoxItemInput('');
                                    }
                                }} placeholder="e.g. MC4 Connectors, Mounting Brackets" className="flex-1 p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-800/50" />
                                <button onClick={() => { if (boxItemInput.trim()) { handleProductChange(activeProductIndex, 'whatsInBox', [...(activeProduct.whatsInBox || []), boxItemInput.trim()]); setBoxItemInput(''); } }} className="p-3 bg-amber-500 text-white rounded-xl"><Plus size={20} /></button>
                            </div>
                        </div>
                    </motion.div>
                );

            case 4: // Pricing
                return (
                    <motion.div key={4} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FloatingLabelInput label="Selling Price" type="number" prefix="₦" value={activeProduct.price === 0 ? '' : activeProduct.price} onChange={(e) => handleProductChange(activeProductIndex, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))} />
                        <ModernToggle label="Current Promotion?" checked={activeProduct.isPromo} onChange={c => handleProductChange(activeProductIndex, 'isPromo', c)} />
                        {activeProduct.isPromo && <FloatingLabelInput label="Promo Price" type="number" prefix="₦" value={activeProduct.promoPrice === 0 ? '' : activeProduct.promoPrice} onChange={(e) => handleProductChange(activeProductIndex, 'promoPrice', e.target.value === '' ? 0 : parseFloat(e.target.value))} />}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Stock Quantity</label>
                                <input type="number" value={activeProduct.quantity} onChange={e => handleProductChange(activeProductIndex, 'quantity', parseInt(e.target.value) || 0)} className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-800/50" />
                            </div>
                            <div className="flex flex-col justify-end">
                                <ModernToggle label="Bulk Buying" description="For installers" checked={activeProduct.bulkPurchasing} onChange={c => handleProductChange(activeProductIndex, 'bulkPurchasing', c)} />
                            </div>
                        </div>
                    </motion.div>
                );

            case 5: // Uploading
                return (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6">
                        <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
                        <h3 className="text-xl font-bold">Uploading Solar Assets...</h3>
                        <div className="w-full max-w-xs h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-amber-500" initial={{ width: 0 }} animate={{ width: `${activeProduct.uploadProgress}%` }} />
                        </div>
                    </div>
                );

            case 6: // Success
                return (
                    <div className="py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-2xl font-bold">Product Listed Successfully!</h3>
                        <p className="text-zinc-500">Your solar equipment is now visible to customers.</p>
                        <button onClick={onClose} className="px-8 py-3 bg-zinc-900 text-white rounded-full font-bold">Back to Dashboard</button>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden" initial="hidden" animate="visible" exit="exit" variants={modalVariants}>
                    <header className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <button onClick={currentStep > 0 ? () => setCurrentStep(prev => prev - 1) : onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h2 className="text-lg font-bold">Add Solar Equipment</h2>
                                <p className="text-xs text-zinc-500">{STEPS[currentStep]?.name || 'Finalizing'} • {currentStep + 1}/5</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
                            <Sun className="w-6 h-6 text-white" />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full pb-32">
                        {renderStepContent()}
                    </div>

                    {currentStep < 5 && (
                        <footer className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-20">
                            <div className="max-w-3xl mx-auto w-full">
                                <button
                                    disabled={currentStep === 0 ? activeProduct?.images.length === 0 : !activeProduct?.name}
                                    onClick={currentStep === 4 ? startProcessing : () => setCurrentStep(prev => prev + 1)}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${currentStep === 0 && (!activeProduct || activeProduct.images.length === 0) ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98]'}`}
                                >
                                    {currentStep === 4 ? 'Launch Product' : 'Next Step'}
                                </button>
                            </div>
                        </footer>
                    )}

                    <CategorySelectorModal isOpen={isCategorySelectorOpen} onClose={() => setCategorySelectorOpen(false)} onSelect={(id) => handleProductChange(activeProductIndex, 'categoryId', id)} categories={categories} onAddCategory={onAddCategory} selectedCategoryId={activeProduct?.categoryId} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
