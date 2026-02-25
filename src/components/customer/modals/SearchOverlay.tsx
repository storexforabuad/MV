'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useModalBackNavigation } from '@/hooks/useModalBackNavigation';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/price';
import { ensureProductType } from '@/utils/productHelpers';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onProductClick: (product: Product) => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({
    isOpen,
    onClose,
    products,
    onProductClick
}) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle back button navigation
    useModalBackNavigation(isOpen, onClose, 'search-overlay');

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            // Prevent body scroll when open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setQuery('');
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const filteredProducts = useMemo(() => {
        if (!query.trim()) return [];
        const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
        return products.filter(product => {
            const name = product.name.toLowerCase();
            const description = (product.description || '').toLowerCase();
            return searchTerms.every(term => name.includes(term) || description.includes(term));
        }).slice(0, 10); // Limit results for performance and UI
    }, [query, products]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
                >
                    {/* Header */}
                    <div className="flex-shrink-0 px-4 py-6 sm:px-8 border-b border-gray-100 dark:border-gray-800">
                        <div className="max-w-4xl mx-auto flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search products..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-800/50 border-none rounded-2xl pl-12 pr-12 py-4 text-lg font-medium text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
                        <div className="max-w-4xl mx-auto">
                            {!query.trim() ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                                    <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
                                        <Search className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Find what you're looking for</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Search for names, categories, or descriptions</p>
                                </div>
                            ) : filteredProducts.length > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Found {filteredProducts.length} items</p>
                                    {filteredProducts.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => onProductClick(product)}
                                            className="group flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer"
                                        >
                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    fill
                                                    sizes="(max-width: 640px) 80px, 80px"
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                                    {product.name}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                                                    {product.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                    {product.originalPrice && product.originalPrice > product.price && (
                                                        <span className="text-xs text-gray-400 line-through">
                                                            {formatPrice(product.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-900 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
                                        <ShoppingBag className="w-10 h-10 text-red-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matching products</h3>
                                    <p className="text-gray-500 dark:text-gray-400">We couldn't find anything matching "{query}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SearchOverlay;
