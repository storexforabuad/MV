'use client';

import React, { Fragment, useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Zap, ShoppingCart, Package, Bell, Download, ChevronRight, ChevronLeft, Smartphone, Share, PlusSquare, Sparkles } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { usePathname, useParams } from 'next/navigation';
import { getStoreMeta } from '../lib/db';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallPromptProps {
  storeId?: string;
}

export default function InstallPrompt({ storeId: propStoreId }: InstallPromptProps) {
  const { showPrompt, handleInstall, handleDismiss, isIos, showIosInstructions } = useInstallPrompt();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const pathname = usePathname();
  const params = useParams();

  const storeId = propStoreId || (typeof params?.storeId === 'string' ? params.storeId : (Array.isArray(params?.storeId) ? params.storeId[0] : ''));
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

  // Format the store name to ensure it's capitalized and hyphens are replaced with spaces
  const formatStoreName = (name: string) => {
    if (!name) return '';
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  const displayStoreName = formatStoreName(storeName);

  const titleText = isRoadmap ? 'Get Roadmap App' : isReferralDashboard ? 'Get Dashboard App' : isAdmin ? 'Control Center' : `Experience ${displayStoreName}`;
  const subtitleText = isRoadmap ? 'Track your path to 10k vendors' : isReferralDashboard ? 'Track your referrals' : isAdmin ? 'Manage your store on the go' : 'Tap into a better, faster, and more premium shopping experience.';

  // Helper to extract clean initials for the Cover Page App Icon
  const getInitials = (name: string) => {
    if (!name) return 'A';
    if (name.includes('420')) return '4H'; // Special case based on user example
    const words = name.split(/[\s-]+/);
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const storeInitials = isRoadmap ? 'RM' : isReferralDashboard ? 'DB' : isAdmin ? 'CC' : getInitials(storeName);

  // Generic Customer Features as Slides
  const slides = [
    {
      id: 'cover',
      icon: Sparkles,
      color: 'text-gray-900 dark:text-white',
      bgColor: 'bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-500/20 dark:to-cyan-500/20',
      isCover: true,
      title: titleText,
      desc: subtitleText,
    },
    {
      id: 'feature1',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-500/10',
      title: 'Order Instantly,\nAnytime.',
      desc: 'Stop waiting for replies. Browse the full digital catalog, check stock, and place your orders 24/7 without the back-and-forth.'
    },
    {
      id: 'feature2',
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-500/10',
      title: 'Build, Share &\nSave Carts.',
      desc: 'Your cart is your superpower. Add multiple items to order at once, save them as a list for later, or share your entire cart via a simple link with friends or family.'
    },
    {
      id: 'feature3',
      icon: Package,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/10',
      title: 'Track Every\nPurchase.',
      desc: 'Keep a clean history of all your orders. Know exactly what you bought, check your order status, and easily reorder your favorites.'
    },
    {
      id: 'feature4',
      icon: Bell,
      color: 'text-violet-500',
      bgColor: 'bg-violet-100 dark:bg-violet-500/10',
      title: 'Never Miss a\nRestock.',
      desc: 'Get instant alerts for flash sales, new arrivals, and restocks straight to your phone so you never miss out.'
    }
  ];

  const adminSlides = [
    { id: 'cover', icon: Smartphone, color: 'text-gray-900 dark:text-white', bgColor: 'bg-gray-100 dark:bg-gray-800', isCover: true, title: titleText, desc: subtitleText },
    { id: 'f1', icon: ShoppingCart, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-500/10', title: 'See all orders\ninstantly', desc: 'Get push notifications the moment an order comes in.' },
    { id: 'f2', icon: Zap, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-500/10', title: 'Track store\nviews', desc: 'Monitor your traffic and top-selling products.' },
    { id: 'f3', icon: Package, color: 'text-violet-500', bgColor: 'bg-violet-100 dark:bg-violet-500/10', title: 'Manage\nEverything', desc: 'Control your inventory, settings, and orders all in one place.' }
  ];

  const displaySlides = isAdmin ? adminSlides : slides;
  const slide = displaySlides[currentSlide];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    const newPage = currentSlide + newDirection;
    if (newPage >= 0 && newPage < displaySlides.length) {
      setCurrentSlide(newPage);
    }
  };

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

        <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
          >
            {/* The modal container itself: given fixed height min max on mobile */}
            <Dialog.Panel className="relative w-full max-w-sm sm:max-w-md h-[460px] sm:h-[480px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#09090b] text-left align-middle shadow-2xl transition-all flex flex-col">

              {/* Header with Close Button */}
              <div className="absolute top-4 right-4 z-30">
                <button
                  type="button"
                  className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100/90 dark:bg-gray-800/90 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none transition-colors backdrop-blur-md"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              {/* Progress Dots */}
              <div className="absolute top-8 left-0 right-0 z-20 flex justify-center gap-2">
                {displaySlides.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-5 sm:w-6 bg-gray-900 dark:bg-white' : 'w-1 sm:w-1.5 bg-gray-200 dark:bg-gray-800'}`}
                  />
                ))}
              </div>

              {/* Slide Content Area - Takes remaining space, allows scrolling if text is very long */}
              <div className="flex-grow relative w-full h-full bg-transparent overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  {showIosInstructions ? (
                    <motion.div
                      key="ios-instructions"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden pt-12 pb-[100px] px-6 flex flex-col items-center justify-center hide-scrollbar"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mb-6 shadow-sm">
                        <Share className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
                      </div>
                      <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white leading-[1.15] mb-6 text-center px-2">
                        Add to Home Screen
                      </h2>

                      <div className="w-full max-w-sm space-y-4 text-left">
                        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center shrink-0">
                            <Share className="w-5 h-5 text-blue-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            1. Tap the <strong className="text-gray-900 dark:text-white">Share</strong> button below.
                          </p>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center shrink-0">
                            <PlusSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            2. Scroll down and tap <strong className="text-gray-900 dark:text-white pb-1">Add to Home Screen</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col items-center animate-bounce">
                        <span className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">Look Down</span>
                        <div className="w-px h-8 bg-gradient-to-b from-gray-300 dark:from-gray-600 to-transparent"></div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={currentSlide}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={1}
                      onDragEnd={(e, { offset, velocity }) => {
                        const swipe = Math.abs(offset.x) * velocity.x;
                        if (swipe < -10000) {
                          paginate(1);
                        } else if (swipe > 10000) {
                          paginate(-1);
                        }
                      }}
                      // Ensure the sliding container allows scrolling and clears the footer perfectly
                      className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden pt-20 pb-[100px] px-6 flex flex-col items-center justify-center hide-scrollbar"
                    >

                      {slide.isCover ? (
                        <div className="flex flex-col items-center justify-center text-center h-full pb-4">
                          <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] ${slide.bgColor || 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center mb-6 shadow-xl shadow-gray-200 dark:shadow-none border border-gray-200 dark:border-gray-800/60 inset-0 relative overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-white/10 dark:to-transparent pointer-events-none" />
                            {slide.icon && <slide.icon className={`w-10 h-10 sm:w-12 sm:h-12 ${slide.color} relative z-10`} />}
                          </motion.div>
                          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-2">
                            {slide.title}
                          </h2>
                          {slide.desc && (
                            <p className="text-[14px] sm:text-base text-gray-500 dark:text-gray-400 font-medium max-w-[260px] mx-auto opacity-95">
                              {slide.desc}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center w-full justify-center h-full">
                          {/* Feature Icon */}
                          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl ${slide.bgColor} flex items-center justify-center mb-6 shadow-sm`}>
                            {slide.icon && <slide.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${slide.color}`} />}
                          </div>
                          {/* Feature Copy */}
                          <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white leading-[1.15] mb-3 whitespace-pre-line text-center px-2">
                            {slide.title}
                          </h2>
                          <p className="text-[14px] sm:text-base text-gray-600 dark:text-gray-300 font-medium leading-[1.6] max-w-[280px] mx-auto text-center opacity-95">
                            {slide.desc}
                          </p>
                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Fixed Footer - Contains the actions & bottom gradient mask so scrolling text fades cleanly */}
              <div className="absolute bottom-0 inset-x-0 z-20">
                {/* Fade Mask */}
                <div className="h-6 w-full bg-gradient-to-t from-white dark:from-[#09090b] to-transparent pointer-events-none" />
                <div className="px-6 pb-6 bg-white dark:bg-[#09090b]">
                  <div className="flex gap-3 h-[52px]">
                    {!showIosInstructions && currentSlide > 0 && (
                      <button
                        onClick={() => paginate(-1)}
                        className="w-[52px] h-[52px] shrink-0 rounded-[1rem] flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    )}

                    {showIosInstructions || currentSlide === displaySlides.length - 1 ? (
                      <button
                        onClick={showIosInstructions ? handleDismiss : handleInstall}
                        className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1rem] flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-bold text-[14px] sm:text-[15px] shadow-xl shadow-gray-200 dark:shadow-none active:scale-[0.98]"
                      >
                        {showIosInstructions ? (
                          <span>Got It</span>
                        ) : (
                          <>
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{isIos ? 'Install App' : 'Install App (5mb)'}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => paginate(1)}
                        className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1rem] flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-bold text-[14px] sm:text-[15px] active:scale-[0.98]"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
