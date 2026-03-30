'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Shirt, Car, Package, ArrowLeft, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

const AddFashionComposer = dynamic(() => import('./AddFashionComposer'), { ssr: false });
const AddVehicleComposer = dynamic(() => import('./AddVehicleComposer'), { ssr: false });
const AddProductComposer = dynamic(() => import('./AddProductComposer'), { ssr: false });
const AddServiceComposer = dynamic(() => import('./AddServiceComposer'), { ssr: false });
const AddBeautyComposer = dynamic(() => import('./AddBeautyComposer'), { ssr: false });

interface AddMediaComposerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    categories: { id: string; name: string }[];
    onProductAdded: () => void;
    onAddCategory: (name: string) => Promise<void>;
    storeName: string;
    instagramHandle?: string;
}

type ComposerRoute = 'hub' | 'service' | 'fashion' | 'vehicle' | 'general' | 'beauty';

export default function AddMediaComposer(props: AddMediaComposerProps) {
    const [route, setRoute] = useState<ComposerRoute>('hub');

    if (!props.isOpen) return null;

    // Provide a wrapped onClose to reset route when fully closing
    const handleClose = () => {
        props.onClose();
        setTimeout(() => setRoute('hub'), 300);
    };

    const sharedProps = {
        isOpen: props.isOpen,
        onClose: handleClose,
        storeId: props.storeId,
        categories: props.categories,
        onProductAdded: props.onProductAdded,
        onAddCategory: props.onAddCategory,
    };

    if (route === 'service') return <AddServiceComposer {...sharedProps} onBack={() => setRoute('hub')} storeName={props.storeName} instagramHandle={props.instagramHandle} />;
    if (route === 'beauty') return <AddBeautyComposer {...sharedProps} storeName={props.storeName} instagramHandle={props.instagramHandle} />;
    if (route === 'fashion') return <AddFashionComposer {...sharedProps} storeName={props.storeName} instagramHandle={props.instagramHandle} />;
    if (route === 'vehicle') return <AddVehicleComposer {...sharedProps} />;
    if (route === 'general') return <AddProductComposer {...sharedProps} />;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm sm:items-end">
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">What are you adding?</h2>
                            <p className="text-sm text-slate-500 mt-1">Select the type of item to list on your store.</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-slate-800 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto space-y-3">
                        <button onClick={() => setRoute('service')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800 hover:shadow-md transition-all text-left group">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base">PR & Collab Services</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Brand deals, shoutouts, UGC, Escrow protected</p>
                            </div>
                        </button>

                        <button onClick={() => setRoute('beauty')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-100 dark:border-purple-800 hover:shadow-md transition-all text-left group">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base">Beauty & Candles</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Makeup, Skincare, Haircare, and Home Fragrance</p>
                            </div>
                        </button>

                        <button onClick={() => setRoute('fashion')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-100 dark:border-pink-800 hover:shadow-md transition-all text-left group">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                                <Shirt className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base">Apparel & Perfumes</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Clothes, shoes, cosmetics with size/color variants</p>
                            </div>
                        </button>

                        <button onClick={() => setRoute('vehicle')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800 hover:shadow-md transition-all text-left group">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                <Car className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base">Cars & Vehicles</h3>
                                <p className="text-xs text-slate-500 mt-0.5">List vehicles with specs and condition details</p>
                            </div>
                        </button>

                        <button onClick={() => setRoute('general')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all text-left group">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base">General Products</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Electronics, books, or any simple physical item</p>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
