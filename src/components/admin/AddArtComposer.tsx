'use client';

import React, { useState } from 'react';
import { Palette, Ruler, Calendar, CheckCircle2, Image as ImageIcon, Plus, X, Upload, Info, Type, Tag, PenTool } from 'lucide-react';
import { ArtProduct } from '@/types/product';
import toast from 'react-hot-toast';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Category } from '@/types/category';
import { addProduct } from '@/lib/db';

interface AddArtComposerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    categories: Category[];
    onProductAdded: () => Promise<void>;
    onAddCategory: (name: string) => Promise<void>;
}

const ART_MEDIUMS = [
    'Oil', 'Acrylic', 'Watercolour', 'Gouache', 'Pastel', 'Digital Art',
    'Mixed Media', 'Charcoal', 'Pencil', 'Ink', 'Photography', 'Sculpture'
];

const ART_SURFACES = [
    'Canvas', 'Paper', 'Wood Panel', 'Metal', 'Glass', 'Digital File',
    'Cardboard', 'Fabric', 'Masonite'
];

const ART_STYLES = [
    'Abstract', 'Realism', 'Impressionism', 'Surrealism', 'Modern',
    'Contemporary', 'Minimalism', 'Pop Art', 'Folk Art'
];

export default function AddArtComposer({
    isOpen, onClose, storeId, categories, onProductAdded, onAddCategory
}: AddArtComposerProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<ArtProduct>>({
        productType: 'art',
        name: '',
        description: '',
        price: 0,
        images: [],
        artDetails: {
            medium: 'Oil',
            surface: 'Canvas',
            dimensions: '',
            year: new Date().getFullYear().toString(),
            edition: 'original',
            isSigned: true,
            isFramed: false,
            hasCertificate: false,
            subject: '',
            style: 'Modern'
        },
        available: true
    });

    const [newImage, setNewImage] = useState('');

    const handleInputChange = (field: string, value: any) => {
        if (field.startsWith('artDetails.')) {
            const subField = field.split('.')[1];
            setFormData(prev => ({
                ...prev,
                artDetails: {
                    ...prev.artDetails!,
                    [subField]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const addImage = () => {
        if (newImage && !formData.images?.includes(newImage)) {
            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), newImage]
            }));
            setNewImage('');
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index)
        }));
    };

    const validateStep = (s: number) => {
        if (s === 1) {
            if (!formData.name) return "Artwork title is required";
            if (!formData.price || formData.price <= 0) return "Price must be greater than 0";
        }
        if (s === 2) {
            if (!formData.artDetails?.dimensions) return "Dimensions are required";
        }
        if (s === 3) {
            if (!formData.images || formData.images.length === 0) return "At least one image is required";
        }
        return null;
    };

    const nextStep = () => {
        const error = validateStep(step);
        if (error) {
            toast.error(error);
            return;
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        const error = validateStep(step);
        if (error) {
            toast.error(error);
            return;
        }
        setIsSubmitting(true);
        try {
            await addProduct(storeId, formData as any);
            toast.success("Artwork published successfully!");
            await onProductAdded();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to publish artwork");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform rounded-3xl bg-white dark:bg-gray-950 text-left shadow-xl transition-all sm:my-8 w-full max-w-4xl overflow-hidden">
                                <div className="bg-white dark:bg-gray-950 rounded-3xl overflow-hidden">
                                    {/* Progress Header */}
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Palette className="w-6 h-6 text-amber-500" />
                                                Add New Artwork
                                            </h2>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of 4</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 transition-all duration-500"
                                                style={{ width: `${(step / 4) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                                        {step === 1 && (
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                        <Type className="w-4 h-4" /> Artwork Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                                        placeholder="e.g. Sunset in Lagos"
                                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 focus:ring-0 transition-all text-sm font-medium"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                        <Tag className="w-4 h-4" /> Price (₦)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={formData.price}
                                                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                                                        placeholder="0.00"
                                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 focus:ring-0 transition-all text-sm font-medium"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                        <Info className="w-4 h-4" /> Description
                                                    </label>
                                                    <textarea
                                                        value={formData.description}
                                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                                        placeholder="Tell the story behind this piece..."
                                                        rows={4}
                                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 focus:ring-0 transition-all text-sm font-medium resize-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Medium</label>
                                                        <select
                                                            value={formData.artDetails?.medium}
                                                            onChange={(e) => handleInputChange('artDetails.medium', e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 text-sm font-medium"
                                                        >
                                                            {ART_MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Surface</label>
                                                        <select
                                                            value={formData.artDetails?.surface}
                                                            onChange={(e) => handleInputChange('artDetails.surface', e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 text-sm font-medium"
                                                        >
                                                            {ART_SURFACES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                            <Ruler className="w-4 h-4" /> Dimensions
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.artDetails?.dimensions}
                                                            onChange={(e) => handleInputChange('artDetails.dimensions', e.target.value)}
                                                            placeholder="e.g. 60 x 80 cm"
                                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" /> Year
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.artDetails?.year}
                                                            onChange={(e) => handleInputChange('artDetails.year', e.target.value)}
                                                            placeholder="2024"
                                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 text-sm font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Style</label>
                                                    <select
                                                        value={formData.artDetails?.style}
                                                        onChange={(e) => handleInputChange('artDetails.style', e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 text-sm font-medium"
                                                    >
                                                        {ART_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <button
                                                        onClick={() => handleInputChange('artDetails.isSigned', !formData.artDetails?.isSigned)}
                                                        className={`py-3 px-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.artDetails?.isSigned ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
                                                    >
                                                        {formData.artDetails?.isSigned ? '✓ Signed' : 'Signed?'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleInputChange('artDetails.isFramed', !formData.artDetails?.isFramed)}
                                                        className={`py-3 px-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.artDetails?.isFramed ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
                                                    >
                                                        {formData.artDetails?.isFramed ? '✓ Framed' : 'Framed?'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleInputChange('artDetails.hasCertificate', !formData.artDetails?.hasCertificate)}
                                                        className={`py-3 px-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.artDetails?.hasCertificate ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
                                                    >
                                                        {formData.artDetails?.hasCertificate ? '✓ Certify' : 'COA?'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                        <ImageIcon className="w-4 h-4" /> Artwork Images
                                                    </label>
                                                    <div className="flex gap-2 mb-4">
                                                        <input
                                                            type="text"
                                                            value={newImage}
                                                            onChange={(e) => setNewImage(e.target.value)}
                                                            placeholder="Paste image URL here..."
                                                            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-amber-500 text-sm font-medium"
                                                        />
                                                        <button
                                                            onClick={addImage}
                                                            className="px-4 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4">
                                                        {formData.images?.map((img, idx) => (
                                                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100 dark:border-gray-800">
                                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                                <button
                                                                    onClick={() => removeImage(idx)}
                                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                                {idx === 0 && (
                                                                    <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 text-[8px] text-center text-white font-black uppercase tracking-widest">Cover</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {(formData.images?.length || 0) < 6 && (
                                                            <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-1">
                                                                <Upload className="w-6 h-6" />
                                                                <span className="text-[10px] font-bold">{formData.images?.length}/6</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {step === 4 && (
                                            <div className="space-y-6">
                                                <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                                            <img src={formData.images?.[0] || '/default_product.png'} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white">{formData.name}</h4>
                                                            <p className="text-amber-600 font-black text-sm">₦{formData.price?.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Medium</span>
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{formData.artDetails?.medium}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Dimensions</span>
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{formData.artDetails?.dimensions}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Edition</span>
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{formData.artDetails?.edition}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {formData.artDetails?.isSigned && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Signed</span>}
                                                            {formData.artDetails?.isFramed && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Framed</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Ready to showcase your art to the world. Ensure all details are correct before publishing.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                                        {step > 1 ? (
                                            <button
                                                onClick={prevStep}
                                                className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                            >
                                                Back
                                            </button>
                                        ) : (
                                            <button
                                                onClick={onClose}
                                                className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}

                                        {step < 4 ? (
                                            <button
                                                onClick={nextStep}
                                                className="flex-[2] py-4 rounded-2xl bg-amber-500 text-white font-black text-sm hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all"
                                            >
                                                Continue
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="flex-[2] py-4 rounded-2xl bg-amber-600 text-white font-black text-sm hover:bg-amber-700 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? 'Publishing...' : 'Publish Artwork'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
