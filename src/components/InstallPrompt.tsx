'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Zap, ShoppingCart, Package, Bell, Smartphone, Share, PlusSquare, Sparkles, Star, Download } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { usePathname, useParams, useSearchParams } from 'next/navigation';
import { getStoreMeta } from '../lib/db';
import { motion } from 'framer-motion';

interface InstallPromptProps {
  storeId?: string;
}

export default function InstallPrompt({ storeId: propStoreId }: InstallPromptProps) {
  const { showPrompt, handleInstall, handleDismiss, isIos, showIosInstructions } = useInstallPrompt();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const storeId = propStoreId ||
    (typeof params?.storeId === 'string' ? params.storeId : (Array.isArray(params?.storeId) ? params.storeId[0] : '')) ||
    searchParams?.get('storeId') ||
    '';
  const [storeName, setStoreName] = useState('');

  const isAdmin = pathname?.startsWith('/admin') || pathname === '/signin';
  const isRoadmap = pathname === '/devteam/roadmap';
  const isReferralDashboard = /^\/(register|start)\/[^/]+\/dashboard\/?$/.test(pathname || '');

  useEffect(() => {
    async function fetchStoreName() {
      if (!storeId) return;
      const meta = await getStoreMeta(storeId);
      setStoreName(meta?.name || storeId || 'The Store App');
    }
    fetchStoreName();
  }, [storeId]);

  if (!showPrompt || (!storeId && !isRoadmap && !isReferralDashboard)) return null;

  const formatStoreName = (name: string) => {
    if (!name) return '';
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  const displayStoreName = formatStoreName(storeName);

  const titleText = isRoadmap ? 'Get Roadmap App' : isReferralDashboard ? 'Get Dashboard App' : isAdmin ? 'Control Center' : `Experience ${displayStoreName}`;
  const subtitleText = isRoadmap ? 'Track your path to 10k vendors' : isReferralDashboard ? 'Track your referrals' : isAdmin ? 'Manage your store on the go' : 'A premium shopping experience.';

  const getInitials = (name: string) => {
    if (!name) return 'A';
    if (name.includes('420')) return '4H';
    const words = name.split(/[\s-]+/);
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const storeInitials = isRoadmap ? 'RM' : isReferralDashboard ? 'DB' : isAdmin ? 'CC' : getInitials(storeName);

  const features = [
    {
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-500/10',
      title: 'Order Instantly',
      desc: 'Browse catalogs and place orders 24/7 without delays.'
    },
    {
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-500/10',
      title: 'Save & Share Carts',
      desc: 'Build lists for later or share carts with family and friends.'
    },
    {
      icon: Package,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/10',
      title: 'Track Purchases',
      desc: 'Keep a full history and status of all your orders.'
    },
    {
      icon: Bell,
      color: 'text-violet-500',
      bgColor: 'bg-violet-100 dark:bg-violet-500/10',
      title: 'Real-time Alerts',
      desc: 'Get notified for flash sales, restocks, and new arrivals.'
    }
  ];

  const adminFeatures = [
    { icon: ShoppingCart, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-500/10', title: 'Instant Orders', desc: 'Get push notifications for new sales.' },
    { icon: Zap, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-500/10', title: 'Traffic Insights', desc: 'Monitor your store views and trends.' },
    { icon: Package, color: 'text-violet-500', bgColor: 'bg-violet-100 dark:bg-violet-500/10', title: 'Full Control', desc: 'Manage inventory and settings on the go.' }
  ];

  const displayFeatures = isAdmin ? adminFeatures : features;

  return (
    <Transition.Root show={showPrompt} as={Fragment}>
      <Dialog as="div" className="relative z-[1000]" onClose={handleDismiss}>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-t-[2.5rem] bg-white dark:bg-modal-background text-left align-middle shadow-2xl transition-all flex flex-col max-h-[92vh] sm:max-w-md sm:rounded-2xl sm:max-h-[85vh]">

                {/* Mobile Handle Bar */}
                <div className="flex-shrink-0 pt-4 pb-2 flex justify-center sm:hidden">
                  <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800" />
                </div>

                {/* Header */}
                <div className="flex-shrink-0 px-6 pt-2 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {storeInitials}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                        {titleText}
                      </h2>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {subtitleText}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    onClick={handleDismiss}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Content Area - Scrollable */}
                <div className="flex-grow overflow-y-auto px-6 py-4 hide-scrollbar">
                  {showIosInstructions ? (
                    <div className="space-y-6 pb-4">
                      <div className="flex flex-col items-center text-center space-y-4 py-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shadow-inner">
                          <Share className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Add to Home Screen
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                            <Share className="w-5 h-5 text-blue-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            1. Tap the <strong className="text-gray-900 dark:text-white">Share</strong> button in your browser.
                          </p>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                            <PlusSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            2. Select <strong className="text-gray-900 dark:text-white">Add to Home Screen</strong> from the menu.
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col items-center animate-bounce opacity-50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Look for the button below</span>
                        <div className="w-px h-10 bg-gradient-to-b from-gray-300 dark:from-gray-700 to-transparent mt-2" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {/* Premium Banner */}
                      <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-2xl p-4 border border-violet-500/20 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-violet-500/20">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-violet-700 dark:text-violet-300">
                          Unlock the full premium experience.
                        </p>
                      </div>

                      {/* Feature Items */}
                      <div className="grid grid-cols-1 gap-3">
                        {displayFeatures.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group">
                            <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                              <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <div className="pt-0.5">
                              <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                                {feature.title}
                              </h3>
                              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                {feature.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* App Stats */}
                      <div className="flex justify-center gap-8 py-4 border-t border-gray-100 dark:border-gray-800 mt-2">
                        <div className="text-center">
                          <p className="text-lg font-black text-gray-900 dark:text-white">4.9</p>
                          <div className="flex items-center gap-0.5 justify-center mb-1">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                          </div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Rating</p>
                        </div>
                        <div className="text-center border-x border-gray-100 dark:border-gray-800 px-8">
                          <p className="text-lg font-black text-gray-900 dark:text-white">5MB</p>
                          <div className="h-3 mb-1 flex items-center justify-center">
                            <Smartphone className="w-3 h-3 text-gray-400" />
                          </div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Size</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-gray-900 dark:text-white">100k+</p>
                          <div className="h-3 mb-1 flex items-center justify-center">
                            <Download className="w-3 h-3 text-gray-400" />
                          </div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Users</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Footer */}
                <div className="flex-shrink-0 p-6 bg-white dark:bg-modal-background border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={showIosInstructions ? handleDismiss : handleInstall}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {showIosInstructions ? (
                      <span>Got It</span>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Install App</span>
                      </>
                    )}
                  </button>
                  {!showIosInstructions && (
                    <p className="text-[11px] text-center text-gray-400 mt-3 font-medium uppercase tracking-widest">
                      Fast • Secure • Premium
                    </p>
                  )}
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
