'use client';

import { Fragment, useState, useEffect, useDeferredValue, useMemo, memo, useRef } from 'react';
import { Send } from 'lucide-react';
import { XMarkIcon, SparklesIcon, CubeIcon, PencilSquareIcon, CheckIcon, MagnifyingGlassIcon, LightBulbIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { ProductScore, getRankedProducts } from '@/utils/productRanking';
import { captionTemplates } from '@/utils/captionTemplates';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { trackProductShare, getBatchProductMetrics } from '@/lib/productMetrics';
import { ProductMetrics, SocialPlatform as MetricsPlatform } from '@/types/productMetrics';
import { detectPriceDrop } from '@/utils/priceUtils';
import { useInView } from 'react-intersection-observer';

// Memoized Product Card Component
const ProductCardItem = memo(({
    product,
    scoreData,
    metrics,
    onSelect
}: {
    product: Product;
    scoreData?: ProductScore;
    metrics?: ProductMetrics;
    onSelect: (product: Product) => void;
}) => {
    const lastSharedText = (() => {
        if (!metrics || !metrics.lastSharedAt) return null;
        const now = Date.now();
        const lastSharedMs = metrics.lastSharedAt.toMillis();
        const daysSince = Math.floor((now - lastSharedMs) / (1000 * 60 * 60 * 24));
        if (daysSince === 0) return 'Shared today';
        if (daysSince === 1) return 'Shared yesterday';
        if (daysSince < 7) return `Shared ${daysSince} days ago`;
        if (daysSince < 14) return `Shared ${Math.floor(daysSince / 7)} week ago`;
        if (daysSince < 30) return `Shared ${Math.floor(daysSince / 7)} weeks ago`;
        return `Shared ${Math.floor(daysSince / 30)} month${daysSince >= 60 ? 's' : ''} ago`;
    })();

    const priceDropInfo = detectPriceDrop(product);

    return (
        <motion.button
            
            onClick={() => onSelect(product)}
            className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all text-left p-0 w-full"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 dark:bg-gray-700 w-full">
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

                {/* Last shared badge */}
                {lastSharedText && (
                    <div className="absolute top-9 left-2 bg-purple-100/90 dark:bg-purple-900/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1">
                        <span>📅</span>
                        <span className="text-purple-900 dark:text-purple-100">
                            {lastSharedText}
                        </span>
                    </div>
                )}

                {/* Price drop badge */}
                {priceDropInfo && (
                    <div className={`absolute bottom-2 right-2 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1 ${priceDropInfo.urgency === 'high'
                        ? 'bg-red-500/95 text-white animate-pulse'
                        : priceDropInfo.urgency === 'medium'
                            ? 'bg-orange-500/95 text-white'
                            : 'bg-green-500/95 text-white'
                        }`}>
                        <span>{priceDropInfo.emoji}</span>
                        <span>{priceDropInfo.badge}</span>
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
                    {/* Share count */}
                    {metrics && metrics.totalShares > 0 && (
                        <span className="flex items-center gap-1">
                            <span>·</span>
                            <span>📲 {metrics.totalShares}x</span>
                        </span>
                    )}
                </div>
            </div>
        </motion.button>
    );
});
ProductCardItem.displayName = 'ProductCardItem';

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
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['WhatsApp']);
    const [selectedTemplateId, setSelectedTemplateId] = useState('casual');
    const [customCaption, setCustomCaption] = useState('');
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [copiedRecently, setCopiedRecently] = useState(false);

    // Share Modal States
    const [activeShareModal, setActiveShareModal] = useState<'none' | 'link' | 'caption'>('none');
    const [shareMessage, setShareMessage] = useState('');

    // Product Metrics State
    const [metricsMap, setMetricsMap] = useState<Map<string, ProductMetrics>>(new Map());
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

    // Performance Optimizations
    const [displayLimit, setDisplayLimit] = useState(20);
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const { ref: loadMoreRef, inView } = useInView();

    // Infinite Scroll Effect
    useEffect(() => {
        if (inView) {
            setDisplayLimit(prev => prev + 20);
        }
    }, [inView]);

    // Reset limit when search changes
    useEffect(() => {
        setDisplayLimit(20);
    }, [deferredSearchTerm]);

    // Get ranked products for suggestions (with metrics)
    const rankedProducts = getRankedProducts(products, metricsMap);
    const suggestedProducts = rankedProducts.slice(0, 6); // Top 6 suggestions

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number | null>(null);
    

    // Filter products for "All" tab (Memoized)
    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(deferredSearchTerm.toLowerCase())
        );
    }, [products, deferredSearchTerm]);

    const visibleProducts = filteredProducts.slice(0, displayLimit);

    // Fetch metrics on mount
    useEffect(() => {
        async function loadMetrics() {
            if (products.length === 0) {
                setIsLoadingMetrics(false);
                return;
            }

            setIsLoadingMetrics(true);
            const productIds = products.map(p => p.id);
            const metrics = await getBatchProductMetrics(storeId, productIds);
            setMetricsMap(metrics);
            setIsLoadingMetrics(false);
        }

        if (isOpen) {
            loadMetrics();
        }
    }, [isOpen, products, storeId]);

    useEffect(() => {
        // Restore scroll position when returning to the 'all' tab
        if (currentTab === 'all' && scrollPositionRef.current !== null && scrollContainerRef.current) {
            // We use a short timeout to ensure the content is rendered before we scroll
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollPositionRef.current!;
                    // Reset after restoring to prevent incorrect scrolling later
                    scrollPositionRef.current = null;
                }
            }, 50); // A small delay like 50ms is usually enough
        }
    }, [currentTab]);
    

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
            caption += `\n\n#${selectedProduct.name.replace(/\s/g, '')} #${'category' in selectedProduct && selectedProduct.category ? selectedProduct.category.replace(/\s/g, '') : 'Product'} #ShopNow`;
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
    // Handle Ready to Post (Copy Caption + Download Image)
    const handleReadyToPost = async () => {
        if (finalCaption && selectedProduct) {
            // 1. Copy Caption
            navigator.clipboard.writeText(finalCaption);
            setCopiedRecently(true);
            toast.success('Caption copied!');

            // 2. Download Image (if available)
            if (selectedProduct.images[0]) {
                handleDownloadImage();
            }

            // 3. Track Analytics
            const platformKeys: MetricsPlatform[] = selectedPlatforms.map(
                p => p.toLowerCase() as MetricsPlatform
            );

            for (const platform of platformKeys) {
                await trackProductShare(storeId, selectedProduct.id, platform);
            }

            // 4. Refresh Metrics
            const productIds = products.map(p => p.id);
            const updatedMetrics = await getBatchProductMetrics(storeId, productIds);
            setMetricsMap(updatedMetrics);

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

    // Helper function to format "last shared" text
    const getLastSharedText = (metrics?: ProductMetrics): string | null => {
        if (!metrics || !metrics.lastSharedAt) return null;

        const now = Date.now();
        const lastSharedMs = metrics.lastSharedAt.toMillis();
        const daysSince = Math.floor((now - lastSharedMs) / (1000 * 60 * 60 * 24));

        if (daysSince === 0) return 'Shared today';
        if (daysSince === 1) return 'Shared yesterday';
        if (daysSince < 7) return `Shared ${daysSince} days ago`;
        if (daysSince < 14) return `Shared ${Math.floor(daysSince / 7)} week ago`;
        if (daysSince < 30) return `Shared ${Math.floor(daysSince / 7)} weeks ago`;

        return `Shared ${Math.floor(daysSince / 30)} month${daysSince >= 60 ? 's' : ''} ago`;
    };



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
                    {/* <ShareIcon className="w-4 h-4" /> */}
                    <span className="text-sm">Copy Link</span>
                </button>
                <button
                    onClick={() => setActiveShareModal('caption')}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all active:scale-95 border border-purple-100 dark:border-purple-800"
                >
                    {/* <ClipboardDocumentIcon className="w-4 h-4" /> */}
                    <span className="text-sm">Copy Link + Caption</span>
                </button>
            </div>

            {suggestedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {suggestedProducts.map(scoreData => (
                        <ProductCardItem
                            key={scoreData.product.id}
                            product={scoreData.product}
                            scoreData={scoreData}
                            metrics={metricsMap.get(scoreData.product.id)}
                            onSelect={(p) => {
                                setSelectedProduct(p);
                                setCurrentTab('creator');
                            }}
                        />
                    ))}
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
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:bg-white dark:focus:bg-gray-700 transition-all"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Product Grid */}
            {visibleProducts.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {visibleProducts.map(product => (
                            <ProductCardItem
                                key={product.id}
                                product={product}
                                metrics={metricsMap.get(product.id)}
                                onSelect={(p) => {
                                    if (scrollContainerRef.current) {
                                        scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                                    }
                                    setSelectedProduct(p);
                                    setCurrentTab('creator');
                                }}
                            />
                        ))}
                    </div>
                    {/* Infinite Scroll Trigger */}
                    {visibleProducts.length < filteredProducts.length && (
                        <div ref={loadMoreRef} className="py-8 flex justify-center">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </>
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
                                            ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100'
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
                        <div className="grid grid-cols-2 gap-2">

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
                                    // Added relative, h-28 for uniform height, and text-center
                                    className={`relative w-full h-28 p-2 rounded-xl text-center transition-all border-2 ${isSelected
                                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Stacks and centers the content vertically */}
                                    <div className="flex flex-col h-full items-center justify-center">
                                        <span className="text-2xl">{icons[template.id as keyof typeof icons]}</span>
                                        <div className="mt-1.5">
                                            <div className={`font-semibold text-[13px] leading-tight ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                                {template.name}
                                            </div>
                                            <div className={`text-xs mt-0.5 capitalize ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {template.style} tone
                                            </div>
                                        </div>
                                    </div>
                                    {/* Positions the checkmark in the top-right corner */}
                                    {isSelected && <CheckIcon className="absolute top-2 right-2 w-4 h-4 text-purple-600 dark:text-purple-400" />}
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

                {/* Action Buttons - Consolidated */}
                
            </div>
        );
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: '100vh' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100vh' }}
                        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent md:justify-center md:items-center"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity hidden md:block" onClick={handleClose} />

                        <div className="relative w-full h-full md:h-[90vh] md:max-w-2xl md:rounded-2xl flex flex-col overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-2xl z-10">
                            {/* iOS-style Header with blur */}
                            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        Social Posts
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Share Content</p>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Send className="w-6 h-6 text-white" />
                                </div>
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
                            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                            <div className="h-full">
    <div style={{ display: currentTab === 'suggested' ? 'block' : 'none' }}>
        {renderSuggestedTab()}
    </div>
    <div style={{ display: currentTab === 'all' ? 'block' : 'none' }}>
        {renderAllProductsTab()}
    </div>
    <div style={{ display: currentTab === 'creator' ? 'block' : 'none' }}>
        {renderPostCreatorTab(selectedProduct, setSelectedProduct)}
    </div>
</div>

                            </div>

                            {/* Footer */}
                            {/* Footer */}
<footer className="relative mt-auto flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent pointer-events-none" />
    <div className="relative max-w-3xl mx-auto h-[56px] flex items-center justify-center"> {/* A fixed height container prevents layout jumps */}
        <AnimatePresence mode="wait">
            {currentTab === 'creator' ? (
                // "Ready to Post!" button for the 'creator' tab
                <motion.div
                    key="creator-footer"
                    className="w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                    <button
                        onClick={handleReadyToPost}
                        disabled={!finalCaption || selectedPlatforms.length === 0}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
                    >
                        {copiedRecently ? (
                            <><CheckIcon className="w-6 h-6" /><span>Copied & Saved!</span></>
                        ) : (
                            <><SparklesIcon className="w-6 h-6" /><span>Ready to Post!</span></>
                        )}
                    </button>
                </motion.div>
            ) : (
                // "Done" button for other tabs
                <motion.div
                    key="default-footer"
                    className="w-full"
                    initial={{ opacity: 1, y: 0 }} // Starts visible
                    exit={{ opacity: 0, y: 10 }}     // Slides down on exit
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                    <button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Done
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
</footer>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Share Modals */}
            <AnimatePresence>
                {activeShareModal !== 'none' && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setActiveShareModal('none')}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700 pointer-events-auto"
                        >
                            <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-4">
                                {activeShareModal === 'link' ? 'Share Store Link' : 'Share with Caption'}
                            </h3>

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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SocialPostsModal;
