'use client';

import { useState, useEffect, Suspense } from 'react';
import { getSharedWishlist, getStoreMeta } from '@/lib/db';
import { CartItem } from '@/lib/cartContext';
import { useCart } from '@/lib/cartContext';
import { StoreMeta } from '@/types/store';
import Navbar from '@/components/layout/navbar';
import { formatPrice } from '@/utils/price';
import { ShoppingCart, Heart, Plus, PackageX, ExternalLink, Eye, ChevronRight, Check, Globe, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NeedAWebsiteModal from '@/components/customer/modals/NeedAWebsiteModal';

interface SharedWishlistPageProps {
    params: { id: string };
}

export default function SharedWishlistPage(props: SharedWishlistPageProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
            </div>
        }>
            <SharedWishlistPageContent {...props} />
        </Suspense>
    );
}

function SharedWishlistPageContent({ params }: SharedWishlistPageProps) {
    const { id } = params;
    const searchParams = useSearchParams();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [storeMetas, setStoreMetas] = useState<{ [key: string]: StoreMeta }>({});
    const [isNeedWebsiteModalOpen, setIsNeedWebsiteModalOpen] = useState(false);
    const { state, dispatch } = useCart();

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getSharedWishlist(id);
                if (data) {
                    setItems(data.items);

                    // Fetch store metas for the items
                    const storeIds = Array.from(new Set(data.items.map(item => item.storeId).filter(Boolean))) as string[];
                    const metas: { [key: string]: StoreMeta } = {};
                    for (const storeId of storeIds) {
                        const meta = await getStoreMeta(storeId);
                        if (meta) {
                            metas[storeId] = meta as StoreMeta;
                        }
                    }
                    setStoreMetas(metas);
                }
            } catch (error) {
                console.error('Error fetching shared cart:', error);
                toast.error('Failed to load shared cart.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleAddAllToCart = () => {
        items.forEach(item => {
            dispatch({ type: 'ADD_ITEM', payload: item });
        });
        toast.success('All items added to your cart!');
    };

    const handleAddToCart = (item: CartItem) => {
        dispatch({ type: 'ADD_ITEM', payload: item });
        toast.success(`${item.name} added to cart!`);
    };

    if (isLoading) {
        return (
            <>
                <Navbar storeName="Shared Cart" />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                </div>
            </>
        );
    }

    if (items.length === 0) {
        return (
            <>
                <Navbar storeName="Shared Cart" />
                <div className="min-h-screen pt-[calc(var(--navbar-height)+4rem)] px-4 flex flex-col items-center text-center">
                    <div className="p-6 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-6">
                        <PackageX className="w-12 h-12 text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Cart not found</h1>
                    <p className="text-text-secondary max-w-xs mb-8">
                        This shared cart might have expired or the link is incorrect.
                    </p>
                    <Link href="/" className="px-8 py-3 bg-[var(--button-success)] text-white rounded-full font-medium hover:bg-[var(--button-success-hover)] transition-all">
                        Go Shopping
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar storeName="Shared Cart" />
            <div className="min-h-screen mx-auto max-w-2xl px-4 pb-32 pt-[calc(var(--navbar-height)+2rem)]">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20 mb-4 ring-8 ring-red-50/50 dark:ring-red-900/10">
                        <ShoppingCart className="w-8 h-8 text-red-500 animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-bold card-text-gradient mb-2">A Gift Cart for You</h1>
                    <p className="text-text-secondary max-w-sm">
                        Someone shared these items with you. You can help them buy these products or add them to your own cart.
                    </p>

                    <button
                        onClick={handleAddAllToCart}
                        className="mt-8 group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--button-success)] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-xl hover:bg-[var(--button-success-hover)] transition-all animate-bounce-slow"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Add All to My Cart</span>
                    </button>
                </div>

                <NeedAWebsiteModal
                    isOpen={isNeedWebsiteModalOpen}
                    onClose={() => setIsNeedWebsiteModalOpen(false)}
                    storeId="bizcon"
                />

                <div className="space-y-6">
                    {items.map((item, index) => {
                        const storeMeta = item.storeId ? storeMetas[item.storeId] : null;
                        return (
                            <div
                                key={`${item.id}-${index}`}
                                className="group relative bg-white dark:bg-gray-800/20 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex gap-4">
                                    <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                                        <Image
                                            src={item.images?.[0] || '/default_product_400x400.png'}
                                            alt={item.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    <div className="flex-grow flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="font-bold text-lg line-clamp-1 mb-1">{item.name}</h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Store:</span>
                                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">{storeMeta?.name || 'Marketplace'}</span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {item.selectedSize && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-text-secondary font-medium">
                                                        Size: {item.selectedSize}
                                                    </span>
                                                )}
                                                {item.selectedColor && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-text-secondary font-medium">
                                                        Color: {item.selectedColor}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <p className="text-xl font-black card-text-gradient">{formatPrice(item.price)}</p>

                                            <div className="flex items-center bg-gray-50 dark:bg-gray-800/80 rounded-full p-1 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                                                <Link
                                                    href={item.storeId ? `/${item.storeId}/products/${item.id}?fromWishlist=${id}` : `/bizcon/products/${item.id}?fromWishlist=${id}`}
                                                    className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all text-text-secondary hover:text-text-primary group/eye"
                                                    title="View product"
                                                >
                                                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 group-hover/eye:scale-110 transition-transform" />
                                                </Link>

                                                <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                                                {state.items.some(cartItem => cartItem.id === item.id) ? (
                                                    <div className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold opacity-60 min-w-[70px] sm:min-w-[90px]">
                                                        <span>Added</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddToCart(item)}
                                                        className="flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-bold hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95"
                                                    >
                                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span>Add</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10 text-center mb-16">
                    <p className="text-sm text-text-secondary italic mb-4">
                        "Your shared cart is the map of your desires. Share it, and let the world help you find your way."
                    </p>
                    <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
                </div>

                {/* Optimized Branded Footer */}
                {false && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        onClick={() => setIsNeedWebsiteModalOpen(true)}
                        className="mt-12 mb-8 flex justify-center w-full relative group text-left"
                    >
                        <div className="w-full relative p-6 sm:p-8 rounded-[2rem] shadow-2xl bg-gradient-to-br from-[#1a1a40] via-[#2d1b4d] to-[#1a1a40] border border-amber-500/30">
                            {/* Promo Badge */}
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20 z-20 uppercase tracking-[0.2em] border border-amber-400/20">
                                PROMO
                            </div>

                            {/* Shimmer Layer */}
                            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                                <div className="absolute inset-0 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent" />
                            </div>

                            {/* Subtle background glows */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 blur-[40px] rounded-full opacity-50 z-0" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full opacity-50 z-0" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition-transform">
                                        <Globe className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-amber-400/80 tracking-[0.2em] uppercase">
                                        POWERED BY <span className="text-amber-400">BIZCONNET™ 2026.</span>
                                    </span>
                                </div>

                                <div className="flex flex-col items-center gap-1 text-center w-full">
                                    <p className="text-sm sm:text-base font-bold text-white tracking-tight">
                                        Get your professional website like
                                    </p>
                                    <p className="text-base sm:text-xl font-black text-white tracking-tight">
                                        Alaniq INT
                                    </p>
                                    <div className="flex items-center gap-2 text-amber-400 font-black text-[10px] uppercase tracking-widest mt-2 group-hover:gap-3 transition-all">
                                        Tap to start <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                        <span>→</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.button>
                )}
            </div>
        </>
    );
}
