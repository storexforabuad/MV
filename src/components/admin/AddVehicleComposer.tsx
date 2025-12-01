'use client';
import React, { useState, useRef, Fragment, ChangeEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
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

interface VehicleFormData {
    id: string;
    files: File[];
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

const FloatingLabelInput: React.FC<{ label: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void, type?: string, placeholder?: string, as?: 'input' | 'textarea' | 'select', options?: { label: string, value: string }[] }> = ({ label, value, onChange, type = 'text', placeholder = ' ', as = 'input', options }) => (
    <div className="relative">
        {as === 'select' ? (
            <select
                value={value}
                onChange={onChange}
                className="block w-full px-4 py-3 text-base text-text-primary bg-input-background rounded-lg border-2 border-input-border appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            >
                {options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        ) : as === 'textarea' ? (
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full px-4 py-3 text-base text-text-primary bg-input-background rounded-lg border-2 border-input-border appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer h-32 resize-none"
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full px-4 py-3 text-base text-text-primary bg-input-background rounded-lg border-2 border-input-border appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            />
        )}
        <label className="absolute text-base text-text-secondary duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-input-background px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-3 pointer-events-none">
            {label}
        </label>
    </div>
);

// --- MAIN COMPOSER COMPONENT ---

const AddVehicleComposer: React.FC<AddVehicleComposerProps> = ({ isOpen, onClose, storeId, onProductAdded, categories, onAddCategory }) => {
    const [currentStep, setCurrentStep] = useState(0); // 0: Upload, 1: Details, 2: Specs, 3: Pricing, 4: Uploading, 5: Summary
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (newFiles.length > 0) {
                setVehicleData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
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
        // Validation
        if (!vehicleData.make || !vehicleData.model || !vehicleData.price || !vehicleData.categoryId) {
            toast.error("Please fill in all required fields including category.");
            return;
        }

        setIsUploading(true);
        setCurrentStep(4); // Move to uploading screen

        const vehicleName = `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`.trim() || 'Vehicle';
        const initialProgress: UploadProgress[] = [{
            id: 'vehicle-upload',
            fileName: vehicleName,
            status: 'idle',
            statusText: `Preparing to upload ${vehicleData.files.length} image${vehicleData.files.length > 1 ? 's' : ''}...`
        }];
        setUploadProgress(initialProgress);

        const uploadedImageUrls: string[] = [];
        let successCount = 0;

        for (let i = 0; i < vehicleData.files.length; i++) {
            const file = vehicleData.files[i];

            try {
                setUploadProgress([{
                    id: 'vehicle-upload',
                    fileName: vehicleName,
                    status: 'compressing',
                    statusText: `Compressing image ${i + 1} / ${vehicleData.files.length}...`
                }]);
                const compressedFile = await compressImage(file);

                setUploadProgress([{
                    id: 'vehicle-upload',
                    fileName: vehicleName,
                    status: 'uploading',
                    statusText: `Uploading image ${i + 1} / ${vehicleData.files.length}...`
                }]);
                const imageUrl = await uploadImageToCloudinary(compressedFile, storeId);
                uploadedImageUrls.push(imageUrl);
                successCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                setUploadProgress([{
                    id: 'vehicle-upload',
                    fileName: vehicleName,
                    status: 'error',
                    statusText: `Failed at image ${i + 1}`,
                    error: errorMessage
                }]);
                break;
            }
        }

        if (successCount === vehicleData.files.length) {
            setUploadProgress([{
                id: 'vehicle-upload',
                fileName: vehicleName,
                status: 'success',
                statusText: `All ${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully!`
            }]);
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
                    createdAt: { toMillis: () => Date.now() } as any // Placeholder, will be replaced by serverTimestamp in db function
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
        const MotionDiv = motion.div;

        switch (currentStep) {
            case 0: // Initial Upload Step
                return (
                    <MotionDiv key={0} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 sm:p-6">
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                        <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer w-full flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-input-background/50 border-2 border-dashed border-input-border text-text-secondary hover:bg-input-background transition-colors duration-300">
                            <PhotoIcon className="w-16 h-16 mb-4 text-gray-400" />
                            <span className="font-semibold text-xl text-text-primary">Tap to upload vehicle photos</span>
                            <span className="text-base text-text-secondary mt-1">Add exterior, interior, and engine bay shots</span>
                        </div>
                        <ProductUploadTips />
                    </MotionDiv>
                );

            case 1: // Details Step
                return (
                    <MotionDiv key={1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 space-y-6">
                        {/* Image Preview Strip */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {vehicleData.files.map((file, i) => (
                                <div key={i} className="relative w-20 h-20 flex-shrink-0">
                                    <Image src={URL.createObjectURL(file)} alt="preview" fill className="object-cover rounded-lg" />
                                    <button onClick={() => removeFile(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><XMarkIcon className="w-3 h-3" /></button>
                                </div>
                            ))}
                            <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-blue-500 hover:border-blue-500">
                                <PhotoIcon className="w-6 h-6" />
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
                            <label className="block text-sm font-medium text-text-secondary mb-2">Condition</label>
                            <div className="flex gap-2">
                                {['brand-new', 'foreign-used', 'nigerian-used'].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => handleChange('condition', c)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border ${vehicleData.condition === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-input-background text-text-secondary border-input-border'}`}
                                    >
                                        {c.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setCategorySelectorOpen(true)}
                            className="w-full text-left p-4 bg-input-background rounded-lg border-2 border-input-border"
                        >
                            <span className={vehicleData.categoryId ? 'text-text-primary' : 'text-text-secondary'}>
                                {categories.find(c => c.id === vehicleData.categoryId)?.name || 'Select a category'}
                            </span>
                        </button>
                    </MotionDiv>
                );

            case 2: // Specs Step
                return (
                    <MotionDiv key={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 space-y-6">
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
                            <FloatingLabelInput label="Color" value={vehicleData.color} onChange={(e) => handleChange('color', e.target.value)} />
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
                    </MotionDiv>
                );

            case 3: // Pricing Step
                const commissionAmount = (vehicleData.price || 0) * (vehicleData.commission / 100);
                return (
                    <MotionDiv key={3} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 space-y-6">
                        <FloatingLabelInput label="Price (₦)" type="number" value={vehicleData.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />

                        <FloatingLabelInput label="Description / Seller Notes" as="textarea" value={vehicleData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Any faults? Key features?..." />

                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Commission + Referral Bonus</label>
                            <div className="mt-2 bg-input-background p-4 rounded-lg">
                                <div className="flex justify-center items-center text-sm font-medium text-text-primary mb-2">
                                    <span>{vehicleData.commission}%</span>
                                    <span className="text-text-secondary mx-2">-</span>
                                    <span className="font-bold">{formatPrice(commissionAmount)}</span>
                                </div>
                                <input type="range" min="2" max="12" value={vehicleData.commission} onChange={e => handleChange('commission', parseInt(e.target.value))} className="w-full h-2.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer glass-slider" />
                            </div>
                        </div>
                    </MotionDiv>
                );

            case 4: // Uploading
                return (
                    <MotionDiv key={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
                        <h3 className="text-xl font-semibold text-center text-text-primary mb-4">Uploading Vehicle...</h3>
                        <div className="space-y-3">
                            {uploadProgress.map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-4 bg-input-background rounded-lg">
                                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {vehicleData.files[0] && (
                                            <Image
                                                src={URL.createObjectURL(vehicleData.files[0])}
                                                alt="Vehicle preview"
                                                width={64}
                                                height={64}
                                                className="object-cover w-full h-full"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-text-primary truncate">{p.fileName}</p>
                                        <p className="text-sm text-text-secondary">{p.statusText}</p>
                                        {p.error && <p className="text-xs text-red-500 mt-1">{p.error}</p>}
                                    </div>
                                    <div className="flex-shrink-0">
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
                return (
                    <MotionDiv key={5} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center">
                        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-text-primary mb-2">Vehicle Added!</h3>
                        <p className="text-lg text-text-secondary">Your vehicle is now live on the marketplace.</p>
                    </MotionDiv>
                );

            default: return null;
        }
    }

    const STEPS = [{ name: 'Photos' }, { name: 'Details' }, { name: 'Specs' }, { name: 'Pricing' }];

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
                                <div className="relative flex w-full flex-col overflow-hidden md:rounded-2xl bg-card-background shadow-2xl">
                                    <div className="p-4 sm:p-6 flex justify-between items-center border-b border-border-color">
                                        <Dialog.Title as="h3" className="text-xl font-bold text-text-primary">
                                            {currentStep === 4 ? 'Uploading...' : currentStep === 5 ? 'Summary' : 'Add New Vehicle'}
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
                                            <button onClick={handleClose} className="w-full rounded-lg border border-border-color bg-button-secondary py-2 px-4 text-sm font-semibold text-text-primary shadow-sm hover:bg-button-secondary-hover">Cancel</button>
                                        )}
                                        {currentStep > 0 && currentStep < 4 && (
                                            <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-lg bg-button-secondary text-text-primary font-semibold hover:bg-button-secondary-hover transition">Back</button>
                                        )}
                                        {currentStep > 0 && currentStep < 3 && (
                                            <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Next</button>
                                        )}
                                        {currentStep === 3 && (
                                            <button onClick={handleSubmit} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition" disabled={isUploading}>
                                                {isUploading ? 'Please Wait...' : 'Upload Vehicle'}
                                            </button>
                                        )}
                                        {currentStep === 5 && (
                                            <>
                                                <button onClick={handleClose} className="px-6 py-3 rounded-lg bg-button-secondary text-text-primary font-semibold hover:bg-button-secondary-hover transition">Done</button>
                                                <button onClick={resetState} className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Add Another</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
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
        </Transition.Root>
    );
};

export default AddVehicleComposer;
