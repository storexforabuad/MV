'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Warehouse, Package, Wrench, BadgePercent, Truck, Sparkles, ArrowRight } from 'lucide-react';

interface WarehouseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const features = [
    {
        icon: Package,
        title: 'Bulk Products',
        description: 'Source products in bulk at wholesale prices for your store.',
        gradient: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50',
        bgDark: 'dark:bg-blue-900/30',
    },
    {
        icon: Wrench,
        title: 'Business Equipment',
        description: 'Quality tools and equipment to power your business operations.',
        gradient: 'from-purple-500 to-violet-600',
        bgLight: 'bg-purple-50',
        bgDark: 'dark:bg-purple-900/30',
    },
    {
        icon: BadgePercent,
        title: 'Affordable Pricing',
        description: 'Exclusive discounts and best prices for BizconNet™vendors.',
        gradient: 'from-green-500 to-emerald-600',
        bgLight: 'bg-green-50',
        bgDark: 'dark:bg-green-900/30',
    },
    {
        icon: Truck,
        title: 'Fast Delivery',
        description: 'Quick and reliable delivery straight to your doorstep.',
        gradient: 'from-orange-500 to-amber-600',
        bgLight: 'bg-orange-50',
        bgDark: 'dark:bg-orange-900/30',
    },
];

export default function WarehouseModal({ isOpen, onClose }: WarehouseModalProps) {
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    const modalVariants = {
        hidden: { opacity: 0, y: '100%' },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={modalVariants}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                >
                    {/* Header */}
                    <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                BizconNet™Warehouse
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Your sourcing hub for products & equipment
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-700 flex items-center justify-center shadow-lg">
                            <Warehouse className="w-6 h-6 text-white" />
                        </div>
                    </header>

                    {/* Main Scrollable Content */}
                    <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                        {/* Hero Section */}
                        <motion.div
                            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-700 p-6 sm:p-8 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-yellow-200" />
                                    <span className="text-xs font-semibold text-yellow-100 uppercase tracking-wider">
                                        Coming Soon
                                    </span>
                                </div>

                                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                                    Source Smarter, Grow Faster
                                </h3>

                                <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-xl">
                                    The BizconNet™Warehouse is your one-stop sourcing center for quality products and
                                    business equipment at unbeatable prices. As a BizconNet™vendor, you&apos;ll get exclusive
                                    access to wholesale deals, bulk discounts, and fast delivery—everything you need
                                    to stock your store and scale your business.
                                </p>
                            </div>
                        </motion.div>

                        {/* Feature Grid */}
                        <motion.div
                            className="mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                What&apos;s Coming
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {features.map((feature, index) => {
                                    const Icon = feature.icon;
                                    return (
                                        <motion.div
                                            key={feature.title}
                                            className={`${feature.bgLight} ${feature.bgDark} p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                        >
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-md`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <h5 className="font-semibold text-slate-800 dark:text-white mb-1">
                                                {feature.title}
                                            </h5>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {feature.description}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Benefits Section */}
                        <motion.div
                            className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                                Why BizconNet™Warehouse?
                            </h4>
                            <ul className="space-y-3">
                                {[
                                    'Curated selection of high-quality products for your store',
                                    'Exclusive vendor-only pricing you won\'t find elsewhere',
                                    'Direct sourcing from trusted manufacturers',
                                    'Seamless integration with your BizconNet™store',
                                    'Dedicated support for bulk orders',
                                ].map((benefit, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                        <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Notification Banner */}
                        <motion.div
                            className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/50 flex items-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                                    Be the first to know!
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300/80">
                                    We&apos;ll notify you when the Warehouse launches. Stay tuned!
                                </p>
                            </div>
                        </motion.div>
                    </main>

                    {/* Footer */}
                    <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-900 dark:to-transparent pointer-events-none" />
                        <div className="relative max-w-5xl mx-auto">
                            <motion.button
                                onClick={onClose}
                                className="w-full bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-600 hover:from-orange-600 hover:via-amber-700 hover:to-yellow-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                                whileTap={{ scale: 0.98 }}
                            >
                                Got It
                            </motion.button>
                        </div>
                    </footer>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
