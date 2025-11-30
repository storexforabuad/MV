'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, CubeIcon, PencilSquareIcon, CheckIcon, MagnifyingGlassIcon, ShareIcon, ClipboardDocumentIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { ProductScore, getRankedProducts } from '@/utils/productRanking';
import { captionTemplates } from '@/utils/captionTemplates';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface SocialPostsModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    storeName: string;
    products: Product[];
    categories?: Category[];
}

type TabType = 'suggested' | 'all' | 'creator';
type SocialPlatform = 'Instagram' | 'Facebook' | 'Twitter' | 'WhatsApp' | 'LinkedIn';

const formatCategories = (categories: Category[] | undefined) => {
    if (!categories || categories.length === 0) return 'products';
    const categoryNames = categories.map(c => c.name);
    const count = categoryNames.length;
    if (count <= 5) {
        if (count === 1) return categoryNames[0];
        if (count === 2) return categoryNames.join(' and ');
        const last = categoryNames.pop();
        return `${categoryNames.join(', ')}, and ${last}`;
    }
    const firstFive = categoryNames.slice(0, 5);
    return `${firstFive.join(', ')}, and more products`;
};

const SocialPostsModal: React.FC<SocialPostsModalProps> = ({ isOpen, onClose, storeId, storeName, products, categories }) => {
    const [currentTab, setCurrentTab] = useState<TabType>('suggested');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['Instagram', 'Facebook']);
    const [selectedTemplateId, setSelectedTemplateId] = useState('casual');
    const [customCaption, setCustomCaption] = useState('');
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [copiedRecently, setCopiedRecently] = useState(false);

    // Share Modal States
    const [activeShareModal, setActiveShareModal] = useState<'none' | 'link' | 'caption'>('none');
    const [shareMessage, setShareMessage] = useState('');

    // Get ranked products for suggestions
    const rankedProducts = getRankedProducts(products);
    const suggestedProducts = rankedProducts.slice(0, 6); // Top 6 suggestions

    // Filter products for "All" tab
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Initialize share message
    useEffect(() => {
        if (categories) {
            const formattedCategories = formatCategories(categories);
            const defaultStoreCaption = `🌟 Discover authentic ${formattedCategories} at affordable prices in the new ${storeName || 'Online Store'} Online Store! 🛒. Tap the link below:`;
            const fullStoreUrl = `https://tinyurl.com/bizcononline/${storeId}`;
            setShareMessage(`${defaultStoreCaption}\n${fullStoreUrl}`);
        }
    }, [categories, storeName, storeId]);

    const handleCopyShare = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
        setTimeout(() => setActiveShareModal('none'), 1500);
    };

    // Function to handle closing the modal and resetting state
    const handleClose = () => {
        onClose();
        // Reset all states when modal closes
        setCurrentTab('suggested');
        setSelectedProduct(null);
        setSearchTerm('');
        setSelectedPlatforms(['Instagram', 'Facebook']);
        setSelectedTemplateId('casual');
        setCustomCaption('');
        setIsEditingCaption(false);
        setCopiedRecently(false);
        setActiveShareModal('none');
        // shareMessage is reset by useEffect on categories change
    };

    // Platform configurations
    const platformConfigs: { name: SocialPlatform; icon: string }[] = [
        { name: 'Instagram', icon: '📸' },
        { name: 'Facebook', icon: '👍' },
        { name: 'Twitter', icon: '🐦' },
        { name: 'WhatsApp', icon: '💬' },
        { name: 'LinkedIn', icon: '💼' },
    ];

    // Toggle platform selection
    const togglePlatform = (platformName: SocialPlatform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformName)
                ? prev.filter(p => p !== platformName)
                : [...prev, platformName]
        );
    };

    // Generate caption based on selected product and template
    const generatedCaption = (() => {
        if (!selectedProduct) return '';

        const template = captionTemplates.find(t => t.id === selectedTemplateId);
        if (!template) return '';

        let caption = template.generate(selectedProduct, storeName, storeId);

        // Add platform-specific hashtags or mentions
        if (selectedPlatforms.includes('Instagram')) {
            caption += `\n\n#${selectedProduct.name.replace(/\s/g, '')} #${selectedProduct.category?.replace(/\s/g, '') || 'Product'} #ShopNow`;
        }
        if (selectedPlatforms.includes('Twitter')) {
            caption += `\n\nCheck out this amazing product! #${selectedProduct.name.replace(/\s/g, '')}`;
        }
        // Add more platform-specific logic as needed

        return caption;
    })();

    // Final caption to display/use (custom or generated)
    const finalCaption = customCaption || generatedCaption;

    // Handle copy caption
    const handleCopyCaption = () => {
        if (finalCaption) {
            navigator.clipboard.writeText(finalCaption);
            setCopiedRecently(true);
            toast.success('Caption copied!');
            setTimeout(() => setCopiedRecently(false), 2000);
        }
    };

    // Handle download image
    const handleDownloadImage = async () => {
        if (selectedProduct?.images[0]) {
            try {
                const response = await fetch(selectedProduct.images[0]);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedProduct.name.replace(/\s/g, '_')}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success('Image downloaded!');
            } catch (error) {
                console.error('Error downloading image:', error);
                toast.error('Failed to download image.');
            }
        }
    };

    // Render Product Card
    const renderProductCard = (product: Product, scoreData?: ProductScore) => (
        <motion.button
            key={product.id}
            layoutId={`product-${product.id}`}
            onClick={() => {
                setSelectedProduct(product);
                setCurrentTab('creator');
            }}
            className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all text-left"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                    src={product.images[0] || 'https://placehold.co/400'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, 33vw"
                />
                {scoreData && (
                    <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1">
                        <span>{scoreData.emoji}</span>
                        <span className="capitalize text-gray-900 dark:text-gray-100">{scoreData.reason.replace('-', ' ')}</span>
                    </div>
                )}
            </div>

            <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5 leading-tight">
                    {product.name}
                </h3>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2">
                    ₦{product.price.toLocaleString()}
                </p>

                <div className="mt-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {product.views || 0} views
                    </span>
                </div>
            </div>
        </motion.button>
    );

    // Render Suggested Tab
    const renderSuggestedTab = () => (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <SparklesIcon className="w-5 h-5" />
                    <h3 className="font-semibold text-base">Smart Suggestions</h3>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4 flex gap-3">
                <LightBulbIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Sharing your store link and products is the best way to get more views and sales. Copy your link or a ready-made caption below and share it everywhere!
                </p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={() => setActiveShareModal('link')}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all active:scale-95 border border-purple-100 dark:border-purple-800"
                >
                    <ShareIcon className="w-4 h-4" />
                    <span className="text-sm">Copy & Share Link</span>
                </button>
                <button
                    onClick={() => setActiveShareModal('caption')}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all active:scale-95 border border-purple-100 dark:border-purple-800"
                >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    <span className="text-sm">Copy Link & Caption</span>
                </button>
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
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 truncate mb-0.5">{selectedProduct.name}</h4>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">₦{selectedProduct.price.toLocaleString()}</p>
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
                                            ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{icons[template.id as keyof typeof icons]}</span>
                                            <div className="flex-1">
                                                <div className={`font-semibold text-[15px] ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {template.name}
                                                </div>
                                                <div className={`text-xs mt-0.5 capitalize ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {template.style} tone
                                                </div>
                                            </div>
                                            {isSelected && <CheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Caption Editor */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Caption
                            </label>
                            {!isEditingCaption ? (
                                <button
                                    onClick={() => setIsEditingCaption(true)}
                                    className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                                >
                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditingCaption(false)}
                                    className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1"
                                >
                                    <CheckIcon className="w-3.5 h-3.5" />
                                    Done
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            {isEditingCaption ? (
                                <textarea
                                    value={customCaption || finalCaption}
                                    onChange={(e) => setCustomCaption(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-900/30 rounded-xl px-4 py-3 text-[15px] text-gray-900 dark:text-gray-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600 focus:border-transparent transition-all resize-none"
                                    rows={10}
                                    placeholder="Your caption will appear here..."
                                    autoFocus
                                />
                            ) : (
                                <div
                                    className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => setIsEditingCaption(true)}
                                >
                                    {finalCaption}
                                </div>
                            )}

                            {isEditingCaption && (
                                <div className="flex justify-between items-center mt-2 text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">{finalCaption.length} characters</span>
                                    <button
                                        onClick={() => setCustomCaption(generatedCaption)}
                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium active:scale-95 transition-all"
                                    >
                                        Reset to Original
                                    </button>
                                </div>
                            )}
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
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700 text-white font-bold text-base hover:from-purple-600 hover:to-violet-700 dark:hover:from-purple-700 dark:hover:to-violet-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
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
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
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

                {/* Share Modals */}
                <Transition show={activeShareModal !== 'none'} as={Fragment}>
                    <Dialog as="div" className="relative z-[60]" onClose={() => setActiveShareModal('none')}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                                        <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-4">
                                            {activeShareModal === 'link' ? 'Share Store Link' : 'Share with Caption'}
                                        </Dialog.Title>

                                        <div className="mt-2">
                                            {activeShareModal === 'link' ? (
                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 break-all font-mono">
                                                        {`https://tinyurl.com/bizcononline/${storeId}`}
                                                    </p>
                                                </div>
                                            ) : (
                                                <textarea
                                                    value={shareMessage}
                                                    onChange={(e) => setShareMessage(e.target.value)}
                                                    rows={6}
                                                    className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                                />
                                            )}
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            <button
                                                type="button"
                                                className="flex-1 justify-center rounded-xl border border-transparent bg-purple-100 dark:bg-purple-900/30 px-4 py-3 text-sm font-medium text-purple-900 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 transition-all"
                                                onClick={() => setActiveShareModal('none')}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 justify-center rounded-xl border border-transparent bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 transition-all shadow-lg shadow-purple-500/30"
                                                onClick={() => handleCopyShare(activeShareModal === 'link' ? `https://tinyurl.com/bizcononline/${storeId}` : shareMessage)}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </Dialog>
        </Transition.Root>
    );
};

export default SocialPostsModal;
