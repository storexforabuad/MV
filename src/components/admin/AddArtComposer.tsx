'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Palette, Ruler, Calendar, CheckCircle2, Image as ImageIcon, Plus, X, Upload, Info, Type, Tag, PenTool, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtProduct } from '../../types/product';
import toast from 'react-hot-toast';

import { Category } from '../../types/category';
import { addProduct } from '../../lib/db';

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

const FloatingLabelInput = ({ label, type = "text", value, onChange, placeholder = "", prefix = "", id, multiline = false }: { label: string, type?: string, value: string | number, onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, placeholder?: string, prefix?: string, id?: string, multiline?: boolean }) => {
    const defaultId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const inputId = id || defaultId;

    return (
        <div className="relative">
            {prefix && !multiline && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-zinc-500 dark:text-zinc-400 sm:text-sm">{prefix}</span>
                </div>
            )}
            {multiline ? (
                <textarea
                    id={inputId}
                    value={value}
                    onChange={onChange}
                    rows={4}
                    className="block w-full rounded-xl border-0 py-4 px-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 placeholder:text-transparent focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6 transition-all peer resize-none"
                    placeholder={placeholder || label}
                />
            ) : (
                <input
                    id={inputId}
                    type={type}
                    value={value}
                    onChange={onChange}
                    className={`block w-full rounded-xl border-0 py-4 ${prefix ? 'pl-8' : 'pl-4'} pr-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 placeholder:text-transparent focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6 transition-all peer`}
                    placeholder={placeholder || label}
                />
            )}
            <label
                htmlFor={inputId}
                className="absolute left-4 -top-2.5 bg-white dark:bg-zinc-900 px-1 text-xs font-medium text-amber-600 dark:text-amber-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-amber-600 pointer-events-none"
            >
                {label}
            </label>
        </div>
    );
};

export default function AddArtComposer({
    isOpen, onClose, storeId, categories, onProductAdded, onAddCategory
}: AddArtComposerProps) {
    const [step, setStep] = useState(0);
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
        available: true,
        categoryId: ''
    });

    const [newImage, setNewImage] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (categories && categories.length > 0 && !formData.categoryId) {
                setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
            }
        } else {
            document.body.style.overflow = 'auto';
            setStep(0);
            setIsSubmitting(false);
            setFormData(prev => ({
                ...prev,
                name: '',
                description: '',
                price: 0,
                images: []
            }));
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, categories]);

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
        if (s === 0) {
            if (!formData.name) return "Artwork title is required";
            if (!formData.price || formData.price <= 0) return "Price must be greater than 0";
        }
        if (s === 1) {
            if (!formData.artDetails?.dimensions) return "Dimensions are required";
        }
        if (s === 2) {
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
        setStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        const error = validateStep(step);
        if (error) {
            toast.error(error);
            return;
        }
        setIsSubmitting(true);
        setStep(4);
        try {
            await addProduct(storeId, formData as any);
            setStep(5);
            await onProductAdded();
        } catch (err: any) {
            toast.error(err.message || "Failed to publish artwork");
            setIsSubmitting(false);
            setStep(3);
        }
    };

    const STEPS = [{ name: 'Basic Info' }, { name: 'Art Details' }, { name: 'Images' }, { name: 'Review' }];
    const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <motion.div key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FloatingLabelInput label="Artwork Title" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g. Sunset in Lagos" />
                        <FloatingLabelInput label="Price (₦)" type="number" prefix="₦" value={formData.price === 0 ? '' : formData.price || ''} onChange={(e) => handleInputChange('price', e.target.value === '' ? 0 : parseFloat(e.target.value))} />
                        <FloatingLabelInput label="Description" value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Tell the story behind this piece..." multiline />
                    </motion.div>
                );
            case 1:
                return (
                    <motion.div key={1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">Medium</label>
                                <select
                                    value={formData.artDetails?.medium}
                                    onChange={(e) => handleInputChange('artDetails.medium', e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-0 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-amber-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                                >
                                    {ART_MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">Surface</label>
                                <select
                                    value={formData.artDetails?.surface}
                                    onChange={(e) => handleInputChange('artDetails.surface', e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-0 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-amber-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                                >
                                    {ART_SURFACES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FloatingLabelInput label="Dimensions" value={formData.artDetails?.dimensions || ''} onChange={(e) => handleInputChange('artDetails.dimensions', e.target.value)} placeholder="e.g. 60 x 80 cm" />
                            </div>
                            <div>
                                <FloatingLabelInput label="Year" value={formData.artDetails?.year || ''} onChange={(e) => handleInputChange('artDetails.year', e.target.value)} placeholder="2024" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block pl-1">Style</label>
                            <select
                                value={formData.artDetails?.style}
                                onChange={(e) => handleInputChange('artDetails.style', e.target.value)}
                                className="w-full px-4 py-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-0 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-amber-500 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                            >
                                {ART_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <ModernToggle label="Signed by Artist?" checked={!!formData.artDetails?.isSigned} onChange={(c) => handleInputChange('artDetails.isSigned', c)} />
                            <ModernToggle label="Comes Framed?" checked={!!formData.artDetails?.isFramed} onChange={(c) => handleInputChange('artDetails.isFramed', c)} />
                            <ModernToggle label="Certificate of Authenticity?" description="Does it include a COA?" checked={!!formData.artDetails?.hasCertificate} onChange={(c) => handleInputChange('artDetails.hasCertificate', c)} />
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                                <FloatingLabelInput label="Image URL" value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="Paste image URL here..." />
                            </div>
                            <button
                                onClick={addImage}
                                className="px-6 py-4 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {formData.images?.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:scale-105 transition-transform shadow-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {idx === 0 && (
                                        <span className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-md">Cover</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div key={3} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                                    <img src={formData.images?.[0] || '/default_product.png'} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{formData.name || 'Untitled Art'}</h4>
                                    <p className="text-amber-600 font-black text-lg mt-1">₦{formData.price?.toLocaleString() || '0'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                <div>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Medium</span>
                                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{formData.artDetails?.medium}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Dimensions</span>
                                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{formData.artDetails?.dimensions || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Surface</span>
                                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{formData.artDetails?.surface}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.artDetails?.isSigned && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Signed</span>}
                                    {formData.artDetails?.isFramed && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Framed</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">Ready to showcase your art to the world. Ensure all details are correct before publishing.</p>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6">
                        <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Publishing Artwork...</h3>
                        <p className="text-zinc-500">Preparing gallery presentation...</p>
                    </div>
                );

            case 5:
                return (
                    <div className="py-20 text-center space-y-6">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 size={48} className="animate-bounce" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Artwork Published!</h3>
                            <p className="text-zinc-500 mt-2">Your art is now visible to collectors.</p>
                        </div>
                        <button onClick={onClose} className="px-10 py-4 mt-4 bg-zinc-900 text-white rounded-full font-bold shadow-xl hover:scale-105 transition-transform">Done</button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden" initial="hidden" animate="visible" exit="exit" variants={modalVariants}>
                    <header className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <button onClick={step > 0 && step < 4 ? prevStep : onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                {step > 0 && step < 4 ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
                            </button>
                            <div>
                                <h2 className="text-lg font-bold">Add New Artwork</h2>
                                <p className="text-xs text-zinc-500">{STEPS[step]?.name || 'Finalizing'} • {Math.min(step + 1, 4)}/4</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
                            <Palette className="w-6 h-6 text-white" />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full pb-32">
                        {renderStepContent()}
                    </div>

                    {step < 4 && (
                        <footer className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-20">
                            <div className="max-w-3xl mx-auto w-full">
                                <button
                                    disabled={step === 2 && (!formData.images || formData.images.length === 0)}
                                    onClick={step === 3 ? handleSubmit : nextStep}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${(step === 2 && (!formData.images || formData.images.length === 0)) ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98]'}`}
                                >
                                    {step === 3 ? 'Publish Artwork' : 'Next Step'}
                                </button>
                            </div>
                        </footer>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
