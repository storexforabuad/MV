'use client';

import React, { useState, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    CubeIcon,
    PencilSquareIcon,

    CheckIcon,
} from '@heroicons/react/24/solid';
import { Product } from '@/types/product';
import { SocialPlatform } from '@/types/socialPost';
import { getRankedProducts, ProductScore } from '@/utils/productRanking';
import { captionTemplates, generateCaption } from '@/utils/captionTemplates';
import {
    platformConfigs,
    copyToClipboard,
    downloadImage,
} from '@/utils/socialMediaHelpers';

interface SocialPostsModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    storeName: string;
    products: Product[];
    storeType?: 'general' | 'automotive';
}

type TabType = 'suggested' | 'all' | 'creator';

const SocialPostsModal: React.FC<SocialPostsModalProps> = ({
    isOpen,
    onClose,
    storeId,
    storeName,
    products,
    storeType,
}) => {
    const [currentTab, setCurrentTab] = useState<TabType>('suggested');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['Instagram', 'Facebook']);
    const [selectedTemplateId, setSelectedTemplateId] = useState('casual');
    const [customCaption, setCustomCaption] = useState('');
    const [copiedRecently, setCopiedRecently] = useState(false);

    // Get ranked products for suggestions
    const suggestedProducts = useMemo(() => {
        return getRankedProducts(products, 15);
    }, [products]);

    // Filter products for "All Products" tab
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    // Generate caption when product or template changes
    const generatedCaption = useMemo(() => {
        if (!selectedProduct) return '';
        return generateCaption(selectedProduct, storeName, storeId, selectedTemplateId);
    }, [selectedProduct, storeName, storeId, selectedTemplateId]);

    // Use custom caption if edited, otherwise use generated
    const finalCaption = customCaption || generatedCaption;

    // Update custom caption when generated caption changes
    React.useEffect(() => {
        if (selectedProduct && !customCaption) {
            setCustomCaption(generatedCaption);
        }
    }, [generatedCaption, selectedProduct, customCaption]);

    const handleClose = () => {
        onClose();
        // Reset state after animation
        setTimeout(() => {
            setCurrentTab('suggested');
            setSelectedProduct(null);
            setSearchTerm('');
            setCustomCaption('');
            setSelectedTemplateId('casual');
        }, 300);
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setCustomCaption(''); // Reset to use generated caption
        setCurrentTab('creator');
    };

    const togglePlatform = (platform: SocialPlatform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handleCopyCaption = async () => {
        const success = await copyToClipboard(finalCaption);
        if (success) {
            setCopiedRecently(true);
            setTimeout(() => setCopiedRecently(false), 2000);
        }
    };

    const handleDownloadImage = async () => {
        if (!selectedProduct || !selectedProduct.images[0]) return;
        const filename = `${selectedProduct.name.replace(/\s+/g, '-')}.jpg`;
        await downloadImage(selectedProduct.images[0], filename);
    };

    // Render Product Card
    const renderProductCard = (product: Product, scoreData?: ProductScore) => {
        const isVehicle = product.productType === 'vehicle';
        const isUnavailable = isVehicle ? !product.available : (product.productType === 'general' && product.soldOut);

        return (
            <motion.button
                key={product.id}
                onClick={() => !isUnavailable && handleProductSelect(product)}
                disabled={isUnavailable}
                className={`relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 ${isUnavailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-[0.98]'
                    }`}
                whileHover={!isUnavailable ? { y: -2, scale: 1.01 } : {}}
                whileTap={!isUnavailable ? { scale: 0.98 } : {}}
            >
                {/* Product Image */}
                <div className="relative w-full pt-[100%] bg-gray-100 dark:bg-gray-700">
                    <Image
                        src={product.images[0] || 'https://placehold.co/400'}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                        className="absolute inset-0"
                        sizes="(max-width: 640px) 50vw, 33vw"
                    />

                    {/* Refined Badge Overlay */}
                    {scoreData && scoreData.badge && (
                        <div className="absolute top-2 left-2 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                            <span className="text-xs">{scoreData.emoji}</span>
                            <span>{scoreData.badge}</span>
                        </div>
                    )}

                    {isUnavailable && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-white font-semibold text-sm px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
                                {isVehicle ? 'Sold' : 'Out of Stock'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5 leading-tight">
                        {product.name}
                    </h3>
                    <p className="text-lg font-bold text-pink-600 dark:text-pink-400 mb-2">
                        ₦{product.price.toLocaleString()}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            👁️ {product.views || 0} views
                        </span>
                        {product.productType === 'general' && product.limitedStock && (
                            <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-0.5">
                                ⏰ Low Stock
                            </span>
                        )}
                    </div>
                </div>
            </motion.button>
        );
    };

    // Render Suggested Tab
    const renderSuggestedTab = () => (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-2">
                <SparklesIcon className="w-5 h-5" />
                <h3 className="font-semibold text-base">Smart Suggestions</h3>
            </div>

            {suggestedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {suggestedProducts.map(scoreData =>
                        renderProductCard(scoreData.product, scoreData)
                    )}
                </div>
            ) : (
                <div className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <SparklesIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No Products Available</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add products to see suggestions</p>
                </div>
            )}
        </div>
    );

    // Render All Products Tab
    const renderAllProductsTab = () => (
        <div className="p-4 space-y-4">
            {/* iOS-style Search Bar */}
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                    type="text"
                    placeholder="Search products"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:bg-white dark:focus:bg-gray-700 transition-all"
                />
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredProducts.map(product => renderProductCard(product))}
                </div>
            ) : (
                <div className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <CubeIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No Products Found</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Try a different search term</p>
                </div>
            )}
        </div>
    );

    // Render Post Creator Tab
    const renderPostCreatorTab = () => {
        if (!selectedProduct) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <PencilSquareIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Product Selected</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Select a product from Suggested or All Products</p>
                    <button
                        onClick={() => setCurrentTab('suggested')}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all"
                    >
                        Browse Suggested Products
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                {/* Selected Product Preview */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                            <Image
                                src={selectedProduct.images[0] || 'https://placehold.co/400'}
                                alt={selectedProduct.name}
                                layout="fill"
                                objectFit="cover"
                                sizes="80px"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 truncate mb-0.5">{selectedProduct.name}</h4>
                            <p className="text-lg font-bold text-pink-600 dark:text-pink-400">₦{selectedProduct.price.toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedProduct(null);
                                setCurrentTab('suggested');
                            }}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active:scale-90 transition-all p-1"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-gray-900">
                    {/* Platform Selection - Muted Chips */}
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                            Select Platforms
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {platformConfigs.map(platform => {
                                const isSelected = selectedPlatforms.includes(platform.name);
                                return (
                                    <motion.button
                                        key={platform.name}
                                        onClick={() => togglePlatform(platform.name)}
                                        className={`px-4 py-2.5 rounded-full text-[15px] font-medium transition-all flex items-center gap-2 border-2 ${isSelected
                                            ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {isSelected && <CheckIcon className="w-4 h-4" />}
                                        <span>{platform.icon}</span>
                                        <span>{platform.name}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Template Selection - Stacked Cards */}
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                            Caption Style
                        </label>
                        <div className="space-y-2">
                            {captionTemplates.map(template => {
                                const isSelected = selectedTemplateId === template.id;
                                const icons = {
                                    casual: '🎉',
                                    professional: '💼',
                                    promotional: '🚨',
                                    minimalist: '✨',
                                };
                                return (
                                    <motion.button
                                        key={template.id}
                                        onClick={() => {
                                            setSelectedTemplateId(template.id);
                                            setCustomCaption('');
                                        }}
                                        className={`w-full p-4 rounded-xl text-left transition-all border-2 ${isSelected
                                            ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800 shadow-sm'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{icons[template.id as keyof typeof icons]}</span>
                                            <div className="flex-1">
                                                <div className={`font-semibold text-[15px] ${isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {template.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                                                    {template.style} tone
                                                </div>
                                            </div>
                                            {isSelected && <CheckIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Caption Editor */}
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                            Caption
                        </label>
                        <div className="relative">
                            <textarea
                                value={customCaption}
                                onChange={(e) => setCustomCaption(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-[15px] text-gray-900 dark:text-gray-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all resize-none"
                                rows={10}
                                placeholder="Your caption will appear here..."
                            />
                            <div className="flex justify-between items-center mt-2 text-xs">
                                <span className="text-gray-500 dark:text-gray-400">{finalCaption.length} characters</span>
                                <button
                                    onClick={() => setCustomCaption(generatedCaption)}
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium active:scale-95 transition-all"
                                >
                                    Reset to Original
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Muted */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            onClick={handleCopyCaption}
                            disabled={!finalCaption || selectedPlatforms.length === 0}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            whileTap={{ scale: 0.95 }}
                        >
                            {copiedRecently ? (
                                <>
                                    <CheckIcon className="w-5 h-5" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    {/* <ClipboardDocumentIcon className="w-5 h-5" /> */}
                                    <span>Copy Text</span>
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            onClick={handleDownloadImage}
                            disabled={!selectedProduct?.images[0]}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* <ArrowDownTrayIcon className="w-5 h-5" /> */}
                            <span>Save Image</span>
                        </motion.button>
                    </div>

                    <motion.button
                        onClick={handleCopyCaption}
                        disabled={!finalCaption || selectedPlatforms.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 dark:from-pink-600 dark:to-red-600 text-white font-bold text-base hover:from-pink-600 hover:to-red-600 dark:hover:from-pink-700 dark:hover:to-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                        whileTap={{ scale: 0.98 }}
                    >
                        <SparklesIcon className="w-6 h-6" />
                        <span>Ready to Post!</span>
                    </motion.button>
                </div>
            </div>
        );
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-hidden">
                    <div className="flex min-h-full items-end justify-center md:items-center md:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-400"
                            enterFrom="opacity-0 translate-y-full"
                            enterTo="opacity-100 translate-y-0"
                            leave="ease-in duration-300"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-full"
                        >
                            <Dialog.Panel className="relative flex w-full max-w-2xl transform text-left transition">
                                {/* Full-screen modal with dark mode */}
                                <div className="relative flex w-full h-screen md:h-[90vh] md:rounded-2xl flex-col overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-2xl">
                                    {/* iOS-style Header with blur */}
                                    <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
                                        <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-base">📱</span>
                                            </div>
                                            Social Posts
                                        </Dialog.Title>
                                        <button
                                            onClick={handleClose}
                                            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 flex items-center justify-center transition-all"
                                        >
                                            <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {/* iOS Segmented Control Tabs */}
                                    <div className="px-4 py-3 flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex relative">
                                            {/* Sliding background */}
                                            <motion.div
                                                className="absolute top-1 bottom-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                                                initial={false}
                                                animate={{
                                                    left: currentTab === 'suggested' ? '0.25rem' : currentTab === 'all' ? 'calc(33.333% + 0.125rem)' : 'calc(66.666% + 0rem)',
                                                    width: 'calc(33.333% - 0.25rem)',
                                                }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            />

                                            {[
                                                { id: 'suggested' as TabType, label: 'Suggested', icon: SparklesIcon },
                                                { id: 'all' as TabType, label: 'All', icon: CubeIcon },
                                                { id: 'creator' as TabType, label: 'Create', icon: PencilSquareIcon },
                                            ].map(tab => {
                                                const Icon = tab.icon;
                                                const isActive = currentTab === tab.id;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setCurrentTab(tab.id)}
                                                        className={`flex-1 py-2 px-3 text-center font-semibold text-[13px] transition-all z-10 flex items-center justify-center gap-1.5 rounded-lg ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                                            }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        <span className="hidden sm:inline">{tab.label}</span>
                                                        <span className="sm:hidden">{tab.id === 'suggested' ? 'Picks' : tab.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="flex-1 overflow-y-auto">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentTab}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                className="h-full"
                                            >
                                                {currentTab === 'suggested' && renderSuggestedTab()}
                                                {currentTab === 'all' && renderAllProductsTab()}
                                                {currentTab === 'creator' && renderPostCreatorTab()}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default SocialPostsModal;
