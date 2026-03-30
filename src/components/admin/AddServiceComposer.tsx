'use client';
import React, { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { MediaInfluencerProduct } from '../../types/product';
import { addProduct } from '../../lib/db';
import { uploadImageToCloudinary } from '../../lib/cloudinaryClient';
import { compressImage } from '../../utils/imageCompression';
import {
    X, Plus, Trash2, ImagePlus, Loader2, ArrowLeft, Briefcase, Clock, FileEdit, CheckCircle2, ChevronRight
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

export default function AddServiceComposer({ isOpen, onClose, onBack, storeId, categories, onProductAdded, onAddCategory, storeName, instagramHandle }: AddServiceComposerProps) {
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
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    };

    const handleSubmit = async () => {
        if (!name || !price || !categoryId || !imageFile) {
            toast.error('Please complete all required fields and upload an image.');
            return;
        }

        setIsUploading(true);
        try {
            const compressedFile = await compressImage(imageFile);
            const imageUrl = await uploadImageToCloudinary(compressedFile, storeId);

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
                commission: 10, // 10% escrow fee
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
            toast.success('Service added successfully');
            onProductAdded();
            handleClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to add service.');
        } finally {
            setIsUploading(false);
        }
    };

    const categoryName = categories.find(c => c.id === categoryId)?.name || 'Select a Category';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm sm:items-end sm:p-0">
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl sm:rounded-b-none overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            {onBack && (
                                <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-full">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Add Collab Service</h2>
                                <p className="text-sm text-slate-500 mt-1">Create a bookable PR or campaign service</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-slate-800 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                        {/* Image Upload */}
                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">Service Cover Image *</label>
                            {imagePreview ? (
                                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                    <button onClick={handleClearImage} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900">
                                    <ImagePlus className="w-10 h-10 text-slate-400" />
                                    <span className="text-sm text-slate-500 font-medium mt-3">Tap to upload cover image</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <FloatingLabelInput
                                label="Service Title"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. 15s TikTok Shoutout"
                            />

                            <FloatingLabelInput
                                label="Price (₦)"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g. 150000"
                            />

                            <button onClick={() => setCategorySelectorOpen(true)} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group">
                                <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Category</span>
                                <div className="flex justify-between items-center">
                                    <span className={`text-base font-medium ${categoryId ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>{categoryName}</span>
                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </button>

                            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                                                    label="Promo Price (₦)"
                                                    type="number"
                                                    value={promoPrice}
                                                    onChange={(e) => setPromoPrice(e.target.value)}
                                                    placeholder="e.g. 120000"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Description</label>
                                <textarea
                                    placeholder="Describe what the brand gets (e.g. 1x video post, link in bio for 24hrs)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Specfic Fields */}
                        <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-4">
                            <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Service Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1 block">Platform</label>
                                    <select
                                        value={platform}
                                        onChange={(e) => setPlatform(e.target.value as any)}
                                        className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm outline-none"
                                    >
                                        <option value="Instagram">Instagram</option>
                                        <option value="TikTok">TikTok</option>
                                        <option value="YouTube">YouTube</option>
                                        <option value="Twitter">Twitter</option>
                                        <option value="Cross-Platform">Cross-Platform</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1 block">Max Revisions</label>
                                    <input
                                        type="number"
                                        value={revisionsAllowed}
                                        onChange={e => setRevisionsAllowed(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1 block">Delivery Time (Days)</label>
                                    <input
                                        type="number"
                                        value={deliveryTimeDays}
                                        onChange={e => setDeliveryTimeDays(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <button
                            onClick={handleSubmit}
                            disabled={isUploading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                        >
                            {isUploading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Saving Service...</>
                            ) : (
                                <><CheckCircle2 className="w-5 h-5" /> Publish Service</>
                            )}
                        </button>
                    </div>
                </motion.div>
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
            </div>
        </AnimatePresence>
    );
}
