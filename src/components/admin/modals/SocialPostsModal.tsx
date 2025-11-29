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
    ClipboardDocumentIcon,
    ArrowDownTrayIcon,
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
    getCharacterCountText,
    truncateCaptionForPlatform,
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
                className={`relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${isUnavailable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                whileHover={!isUnavailable ? { y: -4 } : {}}
            >
                <div className="relative w-full pt-[100%] bg-gray-100">
                    <Image
                        src={product.images[0] || 'https://placehold.co/400'}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                        className="absolute inset-0"
                        sizes="(max-width: 640px) 50vw, 33vw"
                    />

                    {/* Badge Overlay */}
                    {scoreData && scoreData.badge && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <span>{scoreData.emoji}</span>
                            <span>{scoreData.badge}</span>
                        </div>
                    )}

                    {isUnavailable && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {isVehicle ? 'Sold' : 'Out of Stock'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-3 bg-card-background">
                    <h3 className="text-sm font-semibold text-text-primary line-clamp-2 mb-1">
                        {product.name}
                    </h3>
                    <p className="text-lg font-bold text-pink-600">
                        ₦{product.price.toLocaleString()}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                            👀 {product.views || 0} views
                        </span>
                        {product.productType === 'general' && product.limitedStock && (
                            <span className="text-orange-500 font-semibold">⏰ Low Stock</span>
                        )}
                    </div>
                </div>

                {/* Post Button */}
                {!isUnavailable && (
                    <div className="absolute bottom-3 right-3">
                        <div className="bg-pink-500 text-white rounded-full p-2 shadow-lg">
                            <PencilSquareIcon className="w-4 h-4" />
                        </div>
                    </div>
                )}
            </motion.button>
        );
    };

    // Render Suggested Tab
    const renderSuggestedTab = () => (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-pink-600 mb-2">
                <SparklesIcon className="w-5 h-5" />
                <h3 className="font-semibold">Smart Suggestions</h3>
            </div>

            {suggestedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {suggestedProducts.map(scoreData =>
                        renderProductCard(scoreData.product, scoreData)
                    )}
                </div>
            ) : (
                <div className="py-12 text-center text-text-secondary">
                    <SparklesIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No products available to suggest</p>
                </div>
            )}
        </div>
    );

    // Render All Products Tab
    const renderAllProductsTab = () => (
        <div className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-input-background border-2 border-input-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-pink-500 transition"
                />
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredProducts.map(product => renderProductCard(product))}
                </div>
            ) : (
                <div className="py-12 text-center text-text-secondary">
                    <CubeIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No products found</p>
                </div>
            )}
        </div>
    );

    // Render Post Creator Tab
    const renderPostCreatorTab = () => {
        if (!selectedProduct) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-text-secondary">
                    <PencilSquareIcon className="w-16 h-16 mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold mb-2">No Product Selected</h3>
                    <p className="text-sm">Select a product from Suggested or All Products to create a post</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                {/* Selected Product Preview */}
                <div className="p-4 border-b border-border-color bg-background-secondary flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                                src={selectedProduct.images[0] || 'https://placehold.co/400'}
                                alt={selectedProduct.name}
                                layout="fill"
                                objectFit="cover"
                                sizes="64px"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-text-primary truncate">{selectedProduct.name}</h4>
                            <p className="text-sm text-pink-600 font-bold">₦{selectedProduct.price.toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedProduct(null);
                                setCurrentTab('suggested');
                            }}
                            className="text-text-secondary hover:text-text-primary transition"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Platform Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-3">
                            Select Platforms
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {platformConfigs.map(platform => (
                                <button
                                    key={platform.name}
                                    onClick={() => togglePlatform(platform.name)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedPlatforms.includes(platform.name)
                                        ? 'text-white shadow-lg'
                                        : 'bg-input-background text-text-secondary hover:bg-background-secondary'
                                        }`}
                                    style={{
                                        backgroundColor: selectedPlatforms.includes(platform.name)
                                            ? platform.color
                                            : undefined,
                                    }}
                                >
                                    <span className="mr-1.5">{platform.icon}</span>
                                    {platform.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-3">
                            Caption Style
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {captionTemplates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => {
                                        setSelectedTemplateId(template.id);
                                        setCustomCaption(''); // Reset to regenerate
                                    }}
                                    className={`p-3 rounded-lg text-sm font-medium transition-all ${selectedTemplateId === template.id
                                        ? 'bg-pink-500 text-white shadow-md'
                                        : 'bg-input-background text-text-primary hover:bg-background-secondary'
                                        }`}
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Caption Editor */}
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                            Caption
                        </label>
                        <textarea
                            value={customCaption}
                            onChange={(e) => setCustomCaption(e.target.value)}
                            className="w-full bg-input-background border-2 border-input-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-0 focus:border-pink-500 transition resize-none"
                            rows={8}
                            placeholder="Your caption will appear here..."
                        />
                        <div className="flex justify-between items-center mt-2 text-xs text-text-secondary">
                            <span>{finalCaption.length} characters</span>
                            <button
                                onClick={() => setCustomCaption(generatedCaption)}
                                className="text-pink-600 hover:text-pink-700 font-semibold"
                            >
                                Reset to Original
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-border-color space-y-3 flex-shrink-0 bg-card-background">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleCopyCaption}
                            disabled={!finalCaption || selectedPlatforms.length === 0}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {copiedRecently ? (
                                <>
                                    <CheckIcon className="w-5 h-5" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <ClipboardDocumentIcon className="w-5 h-5" />
                                    <span>Copy Text</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDownloadImage}
                            disabled={!selectedProduct?.images[0]}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span>Save Image</span>
                        </button>
                    </div>

                    <button
                        onClick={handleCopyCaption}
                        disabled={!finalCaption || selectedPlatforms.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold text-lg hover:from-pink-600 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        <SparklesIcon className="w-6 h-6" />
                        <span>Ready to Post!</span>
                    </button>
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
                    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-hidden">
                    <div className="flex min-h-full items-end justify-center md:items-center md:p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95"
                            enterTo="opacity-100 translate-y-0 md:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 md:scale-100"
                            leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95"
                        >
                            <Dialog.Panel className="relative flex w-full max-w-2xl transform text-left transition">
                                <div className="relative flex w-full h-[95vh] md:h-[85vh] flex-col overflow-hidden rounded-t-3xl md:rounded-2xl bg-background-primary shadow-2xl">
                                    {/* Header */}
                                    <div className="p-4 md:p-6 flex justify-between items-center border-b border-border-color flex-shrink-0 bg-card-background">
                                        <Dialog.Title as="h3" className="text-xl font-bold text-text-primary flex items-center gap-2">
                                            <span className="text-2xl">📱</span>
                                            Social Posts
                                        </Dialog.Title>
                                        <button
                                            onClick={handleClose}
                                            className="p-2 rounded-full hover:bg-button-secondary transition"
                                        >
                                            <XMarkIcon className="h-6 w-6 text-text-secondary" />
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="border-b border-border-color flex-shrink-0 bg-card-background">
                                        <nav className="flex">
                                            {[
                                                { id: 'suggested' as TabType, label: 'Suggested', icon: SparklesIcon },
                                                { id: 'all' as TabType, label: 'All Products', icon: CubeIcon },
                                                { id: 'creator' as TabType, label: 'Post Creator', icon: PencilSquareIcon },
                                            ].map(tab => {
                                                const Icon = tab.icon;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setCurrentTab(tab.id)}
                                                        className={`flex-1 py-4 px-2 text-center border-b-2 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${currentTab === tab.id
                                                            ? 'border-pink-500 text-pink-600'
                                                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color'
                                                            }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        <span className="hidden sm:inline">{tab.label}</span>
                                                        <span className="sm:hidden">
                                                            {tab.id === 'suggested' ? 'Suggested' : tab.id === 'all' ? 'All' : 'Create'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </nav>
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
