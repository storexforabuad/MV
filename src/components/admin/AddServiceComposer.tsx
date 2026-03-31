'use client';
import React, { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { MediaInfluencerProduct } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import {
    X, Plus, Trash2, ImagePlus, Loader2, ArrowLeft, Briefcase, Clock, FileEdit, CheckCircle2, ChevronRight, ChevronLeft, Globe, Zap, Sparkles, MessageCircle, Share2
} from 'lucide-react';
import Image from 'next/image';
import CategorySelectorModal from './modals/CategorySelectorModal';
import { ModernToggle, FloatingLabelInput } from '../ui/ComposerInputs';

interface AddServiceComposerProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    storeId: string;
    categories: { id: string; name: string }[];
    onProductAdded: () => void;
    onAddCategory: (name: string) => Promise<void>;
    storeName?: string;
    instagramHandle?: string;
}

const PLATFORMS = [
    { id: 'Instagram', name: 'Instagram', icon: Globe },
    { id: 'TikTok', name: 'TikTok', icon: Zap },
    { id: 'YouTube', name: 'YouTube', icon: Sparkles },
    { id: 'Twitter', name: 'X / Twitter', icon: MessageCircle },
    { id: 'Cross-Platform', name: 'Cross-Platform', icon: Share2 },
];

export default function AddServiceComposer({ isOpen, onClose, onBack, storeId, categories, onProductAdded, onAddCategory, storeName, instagramHandle }: AddServiceComposerProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isCategorySelectorOpen, setCategorySelectorOpen] = useState(false);

    // Service Specific Info
    const [platform, setPlatform] = useState<'Instagram' | 'TikTok' | 'YouTube' | 'Twitter' | 'Cross-Platform'>('Instagram');
    const [deliveryTimeDays, setDeliveryTimeDays] = useState('7');
    const [revisionsAllowed, setRevisionsAllowed] = useState('1');

    // Promo Logic
    const [isPromo, setIsPromo] = useState(false);
    const [promoPrice, setPromoPrice] = useState('');

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    if (!isOpen) return null;

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleClearImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const resetState = () => {
        setCurrentStep(0);
        setName('');
        setPrice('');
        setDescription('');
        setCategoryId('');
        setPlatform('Instagram');
        setDeliveryTimeDays('7');
        setRevisionsAllowed('1');
        setIsPromo(false);
        setPromoPrice('');
        setImageFile(null);
        setImagePreview(null);
        setIsUploading(false);
        setUploadProgress(0);
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    };

    const handleSubmit = async () => {
        if (!name || !price || !categoryId || !imageFile) {
            toast.error('Please complete all required fields.');
            return;
        }

        setIsUploading(true);
        setCurrentStep(4); // Move to loading step
        setUploadProgress(10);

        try {
            setUploadProgress(30);
            const compressedFile = await compressImage(imageFile);
            setUploadProgress(50);
            const imageUrl = await uploadImageToCloudinary(compressedFile, storeId);
            setUploadProgress(80);

            const serviceProduct: MediaInfluencerProduct = {
                id: '', // DB assigned
                storeId,
                name,
                description,
                price: isPromo ? Number(promoPrice) : Number(price),
                originalPrice: isPromo ? Number(price) : undefined,
                onPromo: isPromo,
                images: [imageUrl],
                views: 0,
                createdAt: { toMillis: () => Date.now() } as any,
                commission: 10,
                productType: 'media-influencer',
                subtype: 'service',
                platform,
                deliveryTimeDays: Number(deliveryTimeDays),
                revisionsAllowed: Number(revisionsAllowed),
                categoryId,
                category: categories.find(c => c.id === categoryId)?.name || '',
                isActive: true
            };

            await addProduct(storeId, serviceProduct);
            setUploadProgress(100);
            toast.success('Service added successfully');
            onProductAdded();
            // Show success state for a moment
            setTimeout(handleClose, 1500);
        } catch (error) {
            console.error(error);
            toast.error('Failed to add service.');
            setCurrentStep(3); // Go back to pricing to retry
        } finally {
            setIsUploading(false);
        }
    };

    const categoryName = categories.find(c => c.id === categoryId)?.name || 'Select a Category';

    const STEPS = [
        { name: 'Cover Photo', icon: ImagePlus },
        { name: 'Basic Info', icon: FileEdit },
        { name: 'Details', icon: Briefcase },
        { name: 'Pricing', icon: CheckCircle2 },
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="relative group">
                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="border-3 border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem] p-12 text-center group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-all bg-slate-50 dark:bg-slate-800/50">
                                {imagePreview ? (
                                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 mx-auto max-w-sm">
                                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white">
                                                <ImagePlus className="w-8 h-8" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform">
                                            <ImagePlus className="w-12 h-12 text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">Upload Cover Image</p>
                                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">This is the first thing brands will see. Make it professional!</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );

            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <FloatingLabelInput
                            label="Service Title"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. 15s TikTok Shoutout"
                        />

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block pl-1">Store Category</label>
                            <button
                                onClick={() => setCategorySelectorOpen(true)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex justify-between items-center hover:border-blue-400 transition-all group"
                            >
                                <span className={`text-lg font-semibold ${categoryId ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                    {categoryId ? categoryName : 'Select a Category...'}
                                </span>
                                <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block pl-1">Platform</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {PLATFORMS.map(p => {
                                    const Icon = p.icon;
                                    const isSelected = platform === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => setPlatform(p.id as any)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${isSelected
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-200'
                                                }`}
                                        >
                                            <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter text-center">{p.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 space-y-6">
                            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                                <Clock className="w-6 h-6" />
                                <h3 className="text-lg font-bold">Timeline & Revisions</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-blue-700/60 dark:text-blue-400/60 uppercase mb-2 block">Delivery Time</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={deliveryTimeDays}
                                            onChange={e => setDeliveryTimeDays(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border-0 ring-1 ring-blue-200 dark:ring-blue-800 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">Days</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-blue-700/60 dark:text-blue-400/60 uppercase mb-2 block">Max Revisions</label>
                                    <input
                                        type="number"
                                        value={revisionsAllowed}
                                        onChange={e => setRevisionsAllowed(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border-0 ring-1 ring-blue-200 dark:ring-blue-800 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block pl-1">Description</label>
                            <textarea
                                placeholder="Describe your service in detail. What exactly will the brand get? (e.g. 15s Video Post, Link in Bio, Story Mention)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-[2rem] px-6 py-5 outline-none focus:ring-2 focus:ring-blue-500 text-lg leading-relaxed"
                            />
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <FloatingLabelInput
                            label="Service Price"
                            type="number"
                            prefix="₦"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="e.g. 150000"
                        />

                        <ModernToggle
                            label="On Promotion"
                            description="Enable a discount badge for this service"
                            checked={isPromo}
                            onChange={setIsPromo}
                        />

                        <AnimatePresence>
                            {isPromo && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-2">
                                        <FloatingLabelInput
                                            label="Promo Price"
                                            type="number"
                                            prefix="₦"
                                            value={promoPrice}
                                            onChange={(e) => setPromoPrice(e.target.value)}
                                            placeholder="e.g. 120000"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Escrow Protected</h4>
                                    <p className="text-sm text-slate-500 mt-1">Payments are held securely by BCN until the service is delivered. A 10% commission applies.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 4:
                return (
                    <div className="py-20 flex flex-col items-center justify-center space-y-8 text-center">
                        {uploadProgress < 100 ? (
                            <>
                                <div className="relative">
                                    <Loader2 className="w-24 h-24 text-blue-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                                        {uploadProgress}%
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Optimizing Assets...</h3>
                                    <p className="text-slate-500 mt-2">Compressing cover photo and saving your service details.</p>
                                </div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="space-y-6"
                            >
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                                    <CheckCircle2 size={48} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Successfully Listed!</h3>
                                    <p className="text-slate-500 mt-2">Your collab service is now live on your store.</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 overflow-hidden"
            >
                {/* Header */}
                <header className="flex-shrink-0 flex items-center justify-between p-4 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={currentStep > 0 ? () => setCurrentStep(prev => prev - 1) : (onBack || onClose)}
                            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                        >
                            <ChevronLeft className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Add Service</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{STEPS[currentStep]?.name || 'Finalizing'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-xs font-bold text-slate-400">{currentStep + 1} / 4</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Briefcase className="w-8 h-8 text-white" />
                    </div>
                </header>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-4xl mx-auto w-full pb-40">
                    {renderStepContent()}
                </div>

                {/* Footer */}
                {currentStep < 4 && (
                    <footer className="fixed bottom-0 left-0 right-0 p-6 sm:p-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-20">
                        <div className="max-w-4xl mx-auto w-full">
                            <button
                                disabled={isUploading || (currentStep === 0 && !imageFile) || (currentStep === 1 && (!name || !categoryId))}
                                onClick={currentStep === 3 ? handleSubmit : () => setCurrentStep(prev => prev + 1)}
                                className={`w-full py-5 rounded-[2rem] font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3 ${isUploading || (currentStep === 0 && !imageFile) || (currentStep === 1 && (!name || !categoryId))
                                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                {currentStep === 3 ? (
                                    <>Publish Service <CheckCircle2 className="w-6 h-6" /></>
                                ) : (
                                    <>Continue <ChevronRight className="w-6 h-6" /></>
                                )}
                            </button>
                        </div>
                    </footer>
                )}

                <CategorySelectorModal
                    isOpen={isCategorySelectorOpen}
                    onClose={() => setCategorySelectorOpen(false)}
                    categories={categories}
                    selectedCategoryId={categoryId || undefined}
                    onSelect={(id: string) => {
                        setCategoryId(id);
                        setCategorySelectorOpen(false);
                    }}
                    onAddCategory={onAddCategory}
                />
            </motion.div>
        </AnimatePresence>
    );
}
