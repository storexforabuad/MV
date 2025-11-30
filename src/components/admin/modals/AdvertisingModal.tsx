'use client';

import { X, Megaphone, Instagram, Facebook, Twitter, MessageCircle, Link2, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvertisingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdvertisingModal({ isOpen, onClose }: AdvertisingModalProps) {
    const advertisingFeatures = [
        {
            icon: Instagram,
            title: 'Instagram Ads',
            description: 'Promote your products directly to Instagram users with targeted campaigns.',
            color: 'from-purple-500 to-pink-500',
            iconBg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
            iconColor: 'text-purple-500'
        },
        {
            icon: Facebook,
            title: 'Facebook Marketing',
            description: 'Reach millions with Facebook ads optimized for your product catalog.',
            color: 'from-blue-600 to-blue-400',
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-500'
        },
        {
            icon: Twitter,
            title: 'Twitter Promotions',
            description: 'Amplify your product launches and special offers on Twitter.',
            color: 'from-sky-500 to-cyan-400',
            iconBg: 'bg-sky-500/20',
            iconColor: 'text-sky-500'
        },
        {
            icon: MessageCircle,
            title: 'WhatsApp Business',
            description: 'Share product links directly with customers via WhatsApp catalogs.',
            color: 'from-green-500 to-emerald-400',
            iconBg: 'bg-green-500/20',
            iconColor: 'text-green-500'
        },
        {
            icon: Link2,
            title: 'Smart Product Links',
            description: 'Generate trackable links for your products to measure campaign success.',
            color: 'from-indigo-500 to-violet-400',
            iconBg: 'bg-indigo-500/20',
            iconColor: 'text-indigo-500'
        },
        {
            icon: TrendingUp,
            title: 'Boost Engagement',
            description: 'Advanced analytics to track customer interaction and optimize your ads.',
            color: 'from-orange-500 to-amber-400',
            iconBg: 'bg-orange-500/20',
            iconColor: 'text-orange-500'
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with gradient background */}
                        <div className="sticky top-0 z-10 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 md:p-8 rounded-t-3xl">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                                    <Megaphone className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                        Advertise Your Business
                                    </h2>
                                    <p className="text-white/90 text-sm md:text-base">
                                        Boost sales with powerful social media advertising tools
                                    </p>
                                </div>
                            </div>

                            {/* Coming Soon Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <span className="text-sm font-semibold text-white">Coming Soon</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8">
                            {/* Introduction */}
                            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900">
                                <div className="flex items-start gap-3">
                                    <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                            Supercharge Your Sales
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                            Soon, you'll be able to advertise your products and store link across all major social media platforms.
                                            Reach more customers, track engagement, and grow your business with integrated advertising tools
                                            designed specifically for Nigerian vendors.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Features Grid */}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                What's Coming
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {advertisingFeatures.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${feature.iconBg} group-hover:scale-110 transition-transform`}>
                                                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                                                    {feature.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* CTA Section */}
                            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-center">
                                <h3 className="text-2xl font-bold text-white mb-3">
                                    Get Ready to Grow
                                </h3>
                                <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                                    We're working hard to bring you the best advertising tools. Stay tuned for updates!
                                </p>
                                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                                    <span className="font-semibold text-white">Launching Soon</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
