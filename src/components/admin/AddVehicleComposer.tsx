'use client';
import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Trash2,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    Car,
    Fuel,
    Gauge,
    Calendar,
    MapPin,
    Database,
    Paintbrush,
    Coins,
    Loader2,
    X
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { VehicleProduct } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import { formatPrice } from '../../utils/price';
import ProductUploadTips from './ProductUploadTips';
import CategorySelectorModal from './modals/CategorySelectorModal';

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

interface VehicleFormData {
    id: string;
    files: ImageItem[];
    make: string;
    model: string;
    year: number;
    mileage: number;
    condition: 'brand-new' | 'foreign-used' | 'nigerian-used';
    transmission: 'automatic' | 'manual';
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    bodyType: 'sedan' | 'suv' | 'truck' | 'bus' | 'coupe' | 'van';
    color: string;
    location: string;
    price: number;
    commission: number;
    description: string;
    customsDuty: 'paid' | 'unpaid' | 'n/a';
    categoryId: string;
}

interface AddVehicleComposerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    onProductAdded: () => void;
    categories: { id: string; name: string }[];
    onAddCategory: (name: string) => Promise<void>;
}

// --- HELPER COMPONENTS ---

const FloatingLabelInput = ({ label, type = "text", value, onChange, placeholder = "", prefix = "", id, as = 'input', options }: { label: string, type?: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void, placeholder?: string, prefix?: string, id?: string, as?: 'input' | 'textarea' | 'select', options?: { label: string, value: string }[] }) => {
    const defaultId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const inputId = id || defaultId;

    return (
        <div className="relative">
            {prefix && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-zinc-500 dark:text-zinc-400 sm:text-sm">{prefix}</span>
                </div>
            )}
            {as === 'select' ? (
                <select
                    id={inputId}
                    value={value}
                    onChange={onChange}
                    className="block w-full rounded-xl border-0 py-4 pl-4 pr-10 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all appearance-none"
                >
                    {options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ) : as === 'textarea' ? (
                <textarea
                    id={inputId}
                    value={value}
                    onChange={onChange}
                    className="block w-full rounded-xl border-0 py-4 pl-4 pr-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 placeholder:text-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all peer h-32 resize-none"
                    placeholder={placeholder || label}
                />
            ) : (
                <input
                    id={inputId}
                    type={type}
                    value={value}
                    onChange={onChange}
                    className={`block w-full rounded-xl border-0 py-4 ${prefix ? 'pl-8' : 'pl-4'} pr-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 placeholder:text-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all peer`}
                    placeholder={placeholder || label}
                />
            )}
            <label
                htmlFor={inputId}
                className="absolute left-4 -top-2.5 bg-white dark:bg-zinc-950 px-1 text-xs font-medium text-blue-600 dark:text-blue-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 pointer-events-none"
            >
                {label}
            </label>
            {as === 'select' && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronRight className="w-5 h-5 text-zinc-400 transform rotate-90" />
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPOSER COMPONENT ---

const AddVehicleComposer: React.FC<AddVehicleComposerProps> = ({ isOpen, onClose, storeId, onProductAdded, categories, onAddCategory }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [vehicleData, setVehicleData] = useState<VehicleFormData>({
        id: Date.now().toString(),
        files: [],
        make: '',
        model: '',
        year: 2015,
        mileage: 0,
        condition: 'foreign-used',
        transmission: 'automatic',
        fuelType: 'petrol',
        bodyType: 'sedan',
        color: '',
        location: 'Lagos',
        price: 0,
        commission: 5,
        description: '',
        customsDuty: 'paid',
        categoryId: ''
    });

    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setVehicleData({
            id: Date.now().toString(),
            files: [],
            make: '',
            model: '',
            year: 2015,
            mileage: 0,
            condition: 'foreign-used',
            transmission: 'automatic',
            fuelType: 'petrol',
            bodyType: 'sedan',
            color: '',
            location: 'Lagos',
            price: 0,
            commission: 5,
            description: '',
            customsDuty: 'paid',
            categoryId: ''
        });
        setUploadProgress([]);
        setIsUploading(false);
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    }

    const startBackgroundUpload = async (imageItem: ImageItem) => {
        setVehicleData(prev => ({
            ...prev,
            files: prev.files.map(f => f.id === imageItem.id ? { ...f, status: 'compressing' } : f)
        }));

        try {
            const compressedFile = await compressImage(imageItem.file);
            setVehicleData(prev => ({
                ...prev,
                files: prev.files.map(f => f.id === imageItem.id ? { ...f, status: 'uploading' } : f)
            }));

            const imageUrl = await uploadImageToCloudinary(compressedFile, storeId);
            setVehicleData(prev => ({
                ...prev,
                files: prev.files.map(f => f.id === imageItem.id ? { ...f, status: 'success', url: imageUrl } : f)
            }));

        } catch (error) {
            console.error("Background upload failed", error);
            setVehicleData(prev => ({
                ...prev,
                files: prev.files.map(f => f.id === imageItem.id ? { ...f, status: 'error', error: 'Upload failed' } : f)
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                status: 'idle' as UploadStatus
            }));

            if (newFiles.length > 0) {
                setVehicleData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
                newFiles.forEach(item => startBackgroundUpload(item));
                if (currentStep === 0) setCurrentStep(1);
            }
        }
    };

    const removeFile = (index: number) => {
        setVehicleData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
    };

    const handleChange = (field: keyof VehicleFormData, value: any) => {
        setVehicleData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!vehicleData.make || !vehicleData.model || !vehicleData.price || !vehicleData.categoryId) {
            toast.error("Please fill in all required fields including category.");
            return;
        }

        setIsUploading(true);
        setCurrentStep(4); // Move to uploading screen

        const vehicleName = `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`.trim() || 'Vehicle';

        const initialProgress: UploadProgress[] = vehicleData.files.map((f, i) => ({
            id: f.id,
            fileName: `${vehicleName} - Image ${i + 1}`,
            status: f.status,
            statusText: f.status === 'success' ? 'Ready' : 'Processing...',
            error: f.error
        }));
        setUploadProgress(initialProgress);

        const uploadedImageUrls: string[] = [];
        let successCount = 0;

        for (let i = 0; i < vehicleData.files.length; i++) {
            const item = vehicleData.files[i];

            if (item.status === 'success' && item.url) {
                uploadedImageUrls.push(item.url);
                successCount++;
                continue;
            }

            try {
                setUploadProgress(prev => prev.map(p => p.id === item.id ? { ...p, status: 'compressing', statusText: 'Compressing...' } : p));
                const compressedFile = await compressImage(item.file);

                setUploadProgress(prev => prev.map(p => p.id === item.id ? { ...p, status: 'uploading', statusText: 'Uploading...' } : p));
                const imageUrl = await uploadImageToCloudinary(compressedFile, storeId);

                uploadedImageUrls.push(imageUrl);
                successCount++;
                setUploadProgress(prev => prev.map(p => p.id === item.id ? { ...p, status: 'success', statusText: 'Success!' } : p));

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                setUploadProgress(prev => prev.map(p => p.id === item.id ? {
                    ...p,
                    status: 'error',
                    statusText: 'Failed',
                    error: errorMessage
                } : p));
            }
        }

        if (successCount > 0) {
            try {
                const vehicleProduct: Omit<VehicleProduct, 'id'> = {
                    productType: 'vehicle',
                    name: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`,
                    price: vehicleData.price,
                    description: vehicleData.description,
                    images: uploadedImageUrls,
                    vehicleDetails: {
                        make: vehicleData.make,
                        model: vehicleData.model,
                        year: vehicleData.year,
                        mileage: vehicleData.mileage,
                        condition: vehicleData.condition,
                        transmission: vehicleData.transmission,
                        fuelType: vehicleData.fuelType,
                        bodyType: vehicleData.bodyType,
                        color: vehicleData.color,
                        location: vehicleData.location,
                        customsDuty: vehicleData.customsDuty,
                    },
                    available: true,
                    storeId: storeId,
                    views: 0,
                    commission: vehicleData.commission,
                    categoryId: vehicleData.categoryId,
                    createdAt: { toMillis: () => Date.now() } as any
                };

                await addProduct(storeId, vehicleProduct);
                onProductAdded();
                setCurrentStep(5); // Success summary
            } catch (error) {
                console.error("Failed to create product doc:", error);
                toast.error("Failed to save vehicle details.");
            }
        }

        setIsUploading(false);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Initial Upload Step
                return (
                    <motion.div key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                        <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
                            <div className="border-3 border-dashed border-zinc-300 dark:border-zinc-700 rounded-[2rem] p-12 text-center group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-all bg-zinc-50 dark:bg-zinc-800/50">
                                <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera className="w-10 h-10 text-zinc-400 group-hover:text-blue-500" />
                                </div>
                                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tap to upload vehicle photos</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Add exterior, interior, and engine bay shots</p>
                            </div>
                        </div>
                        <ProductUploadTips />
                    </motion.div>
                );

            case 1: // Details Step
                return (
                    <motion.div key={1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        {/* Image Preview Strip */}
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                            {vehicleData.files.map((item, i) => (
                                <div key={item.id} className="relative flex-none w-24 h-24 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden group snap-center shadow-sm">
                                    <Image src={URL.createObjectURL(item.file)} alt="preview" fill className="object-cover" />

                                    {/* Status Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm py-1 flex justify-center">
                                        {item.status === 'uploading' && <Loader2 className="w-3 h-3 text-white animate-spin" />}
                                        {item.status === 'compressing' && <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />}
                                        {item.status === 'success' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                                        {item.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                    </div>

                                    {/* Hover Delete Action */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-none w-24 h-24 rounded-2xl border-3 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-blue-500 hover:border-blue-500 transition-all bg-zinc-50/50 dark:bg-zinc-800/30"
                            >
                                <Camera className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput label="Make (e.g. Toyota)" value={vehicleData.make} onChange={(e) => handleChange('make', e.target.value)} />
                            <FloatingLabelInput label="Model (e.g. Camry)" value={vehicleData.model} onChange={(e) => handleChange('model', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput label="Year" type="number" value={vehicleData.year} onChange={(e) => handleChange('year', parseInt(e.target.value))} />
                            <FloatingLabelInput label="Mileage (km)" type="number" value={vehicleData.mileage} onChange={(e) => handleChange('mileage', parseInt(e.target.value))} />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block pl-1">Condition</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {['brand-new', 'foreign-used', 'nigerian-used'].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => handleChange('condition', c)}
                                        className={`flex-none px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${vehicleData.condition === c ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                    >
                                        {c.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">Store Category</label>
                            <button
                                onClick={() => setCategorySelectorOpen(true)}
                                className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex justify-between items-center hover:border-blue-400 transition-colors"
                            >
                                <span className={`font-medium ${vehicleData.categoryId ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                                    {categories.find(c => c.id === vehicleData.categoryId)?.name || 'Select Category...'}
                                </span>
                                <ChevronRight className="text-zinc-400 w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                );

            case 2: // Specs Step
                return (
                    <motion.div key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                                label="Transmission"
                                as="select"
                                value={vehicleData.transmission}
                                onChange={(e) => handleChange('transmission', e.target.value)}
                                options={[{ label: 'Automatic', value: 'automatic' }, { label: 'Manual', value: 'manual' }]}
                            />
                            <FloatingLabelInput
                                label="Fuel Type"
                                as="select"
                                value={vehicleData.fuelType}
                                onChange={(e) => handleChange('fuelType', e.target.value)}
                                options={[
                                    { label: 'Petrol', value: 'petrol' },
                                    { label: 'Diesel', value: 'diesel' },
                                    { label: 'Hybrid', value: 'hybrid' },
                                    { label: 'Electric', value: 'electric' }
                                ]}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                                label="Body Type"
                                as="select"
                                value={vehicleData.bodyType}
                                onChange={(e) => handleChange('bodyType', e.target.value)}
                                options={[
                                    { label: 'Sedan', value: 'sedan' },
                                    { label: 'SUV', value: 'suv' },
                                    { label: 'Truck', value: 'truck' },
                                    { label: 'Bus', value: 'bus' },
                                    { label: 'Coupe', value: 'coupe' },
                                    { label: 'Van', value: 'van' }
                                ]}
                            />
                            <FloatingLabelInput label="Color" value={vehicleData.color} onChange={(e) => handleChange('color', e.target.value)} placeholder="e.g. Metallic Blue" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput label="Location" value={vehicleData.location} onChange={(e) => handleChange('location', e.target.value)} />
                            <FloatingLabelInput
                                label="Customs Duty"
                                as="select"
                                value={vehicleData.customsDuty}
                                onChange={(e) => handleChange('customsDuty', e.target.value)}
                                options={[
                                    { label: 'Paid', value: 'paid' },
                                    { label: 'Unpaid', value: 'unpaid' },
                                    { label: 'N/A', value: 'n/a' }
                                ]}
                            />
                        </div>
                    </motion.div>
                );

            case 3: // Pricing Step
                const commissionAmount = (vehicleData.price || 0) * (vehicleData.commission / 100);
                return (
                    <motion.div key={3} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FloatingLabelInput label="Price" type="number" prefix="₦" value={vehicleData.price === 0 ? '' : vehicleData.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />

                        <FloatingLabelInput label="Description / Seller Notes" as="textarea" value={vehicleData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Any faults? Key features?..." />

                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 block">Commission + Referral Bonus</label>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black text-blue-600">{vehicleData.commission}%</span>
                                        <span className="text-zinc-400">rate</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(commissionAmount)}</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-tighter">Bonus Amount</div>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="2" max="15" step="0.5"
                                    value={vehicleData.commission}
                                    onChange={e => handleChange('commission', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    <span>Standard (2%)</span>
                                    <span>Premium (15%)</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 4: // Uploading
                return (
                    <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-12 flex flex-col items-center justify-center space-y-6">
                        <div className="w-20 h-20 border-4 border-zinc-100 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin"></div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Uploading Vehicle...</h3>
                        <div className="w-full max-w-sm space-y-4">
                            {uploadProgress.map(p => (
                                <div key={p.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">{p.fileName}</span>
                                        <span className={`text-[10px] font-bold uppercase ${p.status === 'success' ? 'text-green-500' : p.status === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                                            {p.statusText}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${p.status === 'error' ? 'bg-red-500' : p.status === 'success' ? 'bg-green-500' : 'bg-blue-600'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: p.status === 'success' ? '100%' : p.status === 'uploading' ? '70%' : '30%' }}
                                        />
                                    </div>
                                    {p.error && <p className="text-xs text-red-500 mt-2">{p.error}</p>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 5: // Summary
                return (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16 text-center space-y-6">
                        <div className="w-24 h-24 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Vehicle Added!</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg">Your vehicle is now live on the marketplace.</p>
                    </motion.div>
                );

            default: return null;
        }
    }

    const STEPS = [{ name: 'Photos' }, { name: 'Details' }, { name: 'Specs' }, { name: 'Pricing' }];
    const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

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
                                    {currentStep === 4 ? 'Uploading...' : currentStep === 5 ? 'Summary' : 'Add New Vehicle'}
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {currentStep < 4 ? `Step ${currentStep + 1} of ${STEPS.length}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                            <button onClick={handleClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <X className="w-6 h-6 text-zinc-500" />
                            </button>
                        </div>
                    </header>

                    {/* --- Progress Bar --- */}
                    {currentStep < 4 && (
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1">
                            <motion.div
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1"
                                initial={{ width: '0%' }}
                                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                                transition={{ ease: "easeInOut", duration: 0.5 }}
                            />
                        </div>
                    )}

                    {/* --- Main Content --- */}
                    <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                        <AnimatePresence mode="wait">
                            {renderStepContent()}
                        </AnimatePresence>
                    </main>

                    {/* --- Footer --- */}
                    <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10">
                        <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
                        <div className="max-w-5xl mx-auto flex gap-4">
                            {currentStep === 0 && (
                                <button onClick={handleClose} className="flex-1 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                    Cancel
                                </button>
                            )}
                            {currentStep > 0 && currentStep < 4 && (
                                <>
                                    <button onClick={() => setCurrentStep(s => s - 1)} className="flex-1 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                                        <ChevronLeft className="w-5 h-5" /> Back
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (currentStep === 3) handleSubmit();
                                            else setCurrentStep(s => s + 1);
                                        }}
                                        disabled={isUploading}
                                        className="flex-1 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                    >
                                        {currentStep === 3 ? (isUploading ? 'Uploading...' : 'Upload Vehicle') : 'Next'} <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            {currentStep === 5 && (
                                <>
                                    <button onClick={handleClose} className="flex-1 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                        Close
                                    </button>
                                    <button onClick={resetState} className="flex-1 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-opacity shadow-lg">
                                        Add Another
                                    </button>
                                </>
                            )}
                        </div>
                    </footer>

                    {/* Move Category Selector INSIDE the motion.div to layer properly */}
                    <CategorySelectorModal
                        isOpen={isCategorySelectorOpen}
                        onClose={() => setCategorySelectorOpen(false)}
                        categories={categories}
                        selectedCategoryId={vehicleData.categoryId}
                        onSelect={(categoryId: string) => {
                            handleChange('categoryId', categoryId);
                            setCategorySelectorOpen(false);
                        }}
                        onAddCategory={onAddCategory}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddVehicleComposer;
