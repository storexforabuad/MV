'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Megaphone, Instagram, Facebook, Twitter, MessageCircle, Link2, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                                {/* Full-screen modal */}
                                <div className="relative flex w-full h-screen md:h-[90vh] md:rounded-2xl flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl">

                                    {/* Header with gradient */}
                                    <div className="relative px-4 py-6 md:py-8 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex-shrink-0">
                                        <button
                                            onClick={onClose}
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
                                            aria-label="Close"
                                        >
                                            <X className="w-5 h-5 text-white" />
                                        </button>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 md:p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                                                <Megaphone className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                            </div>
                                            <div className="flex-1 pr-10">
                                                <Dialog.Title as="h2" className="text-2xl md:text-3xl font-bold text-white mb-1">
                                                    Advertise Your Business
                                                </Dialog.Title>
                                                <p className="text-white/90 text-xs md:text-sm">
                                                    Boost sales with powerful advertising tools
                                                </p>
                                            </div>
                                        </div>

                                        {/* Coming Soon Badge */}
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-300" />
                                            <span className="text-xs md:text-sm font-semibold text-white">Coming Soon</span>
                                        </div>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                                            {/* Introduction */}
                                            <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900">
                                                <div className="flex items-start gap-3">
                                                    <Zap className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                            Supercharge Your Sales
                                                        </h3>
                                                        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                                            Soon, you'll be able to advertise your products and store link across all major social media platforms.
                                                            Reach more customers, track engagement, and grow your business with integrated advertising tools
                                                            designed specifically for (Biz+Con)™ vendors.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Features Grid */}
                                            <div>
                                                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-1">
                                                    What's Coming
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                                    {advertisingFeatures.map((feature, index) => (
                                                        <motion.div
                                                            key={feature.title}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            className="group p-4 md:p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg"
                                                        >
                                                            <div className="flex items-start gap-3 md:gap-4">
                                                                <div className={`p-2.5 md:p-3 rounded-xl ${feature.iconBg} group-hover:scale-110 transition-transform flex-shrink-0`}>
                                                                    <feature.icon className={`w-5 h-5 md:w-6 md:h-6 ${feature.iconColor}`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-sm md:text-base text-gray-900 dark:text-white mb-1.5 md:mb-2">
                                                                        {feature.title}
                                                                    </h4>
                                                                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                                        {feature.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* CTA Section */}
                                            <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-center">
                                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">
                                                    Get Ready to Grow
                                                </h3>
                                                <p className="text-sm md:text-base text-white/90 mb-4 md:mb-6 max-w-2xl mx-auto">
                                                    We're working hard to bring you the best advertising tools. Stay tuned for updates!
                                                </p>
                                                <div className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-300 animate-pulse" />
                                                    <span className="text-sm md:text-base font-semibold text-white">Launching Soon</span>
                                                </div>
                                            </div>

                                            {/* Bottom spacing for mobile safe area */}
                                            <div className="h-4 md:h-0" />
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
